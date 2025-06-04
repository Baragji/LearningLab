"""
Improved RAG Engine with ChromaDB for fast vector search
Replaces the slow SQLite-based approach
"""

import asyncio
import logging
import os
import time
from typing import List, Dict, Any, Optional
from pathlib import Path

import chromadb
from chromadb.config import Settings
import openai
import structlog

logger = structlog.get_logger()

class RAGEngine:
    """
    Fast RAG engine using ChromaDB for vector storage
    Designed to replace the slow SQLite-based approach
    """
    
    def __init__(self, 
                 chromadb_path: str = "./data/chromadb",
                 embedding_model: str = "text-embedding-ada-002",
                 llm_model: str = "gpt-3.5-turbo"):
        
        self.chromadb_path = chromadb_path
        self.embedding_model = embedding_model
        self.llm_model = llm_model
        
        # Initialize OpenAI client with error handling
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.openai_client = openai.OpenAI(api_key=api_key)
                # Test connection
                models = self.openai_client.models.list()
                logger.info("OpenAI client initialized successfully")
            else:
                logger.warning("OPENAI_API_KEY not found in environment variables")
                self.openai_client = None
        except Exception as e:
            logger.warning("OpenAI client initialization failed - continuing without it", error=str(e))
            self.openai_client = None
        
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=chromadb_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="code_knowledge",
            metadata={"description": "Code and documentation embeddings"}
        )
        
        logger.info("FastRAGEngine initialized", 
                   chromadb_path=chromadb_path,
                   collection_count=self.collection.count())
    
    async def add_document(self, 
                          content: str, 
                          metadata: Dict[str, Any],
                          chunk_size: int = 1000,
                          chunk_overlap: int = 200) -> int:
        """
        Add a document to the RAG system with improved chunking
        Returns number of chunks created
        """
        start_time = time.time()
        
        # Smart chunking based on content type
        chunks = self._smart_chunk_content(content, metadata, chunk_size, chunk_overlap)
        
        if not chunks:
            logger.warning("No chunks created from content", metadata=metadata)
            return 0
        
        # Generate embeddings using Ollama
        embeddings = []
        chunk_texts = []
        chunk_metadatas = []
        chunk_ids = []
        
        for i, chunk in enumerate(chunks):
            # Generate embedding
            try:
                response = self.openai_client.embeddings.create(
                    model=self.embedding_model,
                    input=chunk["text"]
                )
                embeddings.append(response.data[0].embedding)
                chunk_texts.append(chunk["text"])
                
                # Create metadata for this chunk
                chunk_metadata = {
                    **metadata,
                    "chunk_index": i,
                    "chunk_size": len(chunk["text"]),
                    "start_line": chunk.get("start_line", 0),
                    "end_line": chunk.get("end_line", 0)
                }
                chunk_metadatas.append(chunk_metadata)
                
                # Create unique ID
                doc_id = metadata.get("file_path", "unknown")
                chunk_ids.append(f"{doc_id}_chunk_{i}")
                
            except Exception as e:
                logger.error("Failed to generate embedding", 
                           chunk_index=i, error=str(e))
                continue
        
        # Add to ChromaDB
        if embeddings:
            self.collection.add(
                embeddings=embeddings,
                documents=chunk_texts,
                metadatas=chunk_metadatas,
                ids=chunk_ids
            )
        
        duration = time.time() - start_time
        logger.info("Document added to RAG", 
                   file_path=metadata.get("file_path"),
                   chunks_created=len(embeddings),
                   duration_seconds=round(duration, 2))
        
        return len(embeddings)
    
    def _smart_chunk_content(self, 
                           content: str, 
                           metadata: Dict[str, Any],
                           chunk_size: int,
                           chunk_overlap: int) -> List[Dict[str, Any]]:
        """
        Smart chunking based on content type and structure
        """
        file_path = metadata.get("file_path", "")
        file_ext = Path(file_path).suffix.lower()
        
        # Code files - chunk by functions/classes
        if file_ext in [".py", ".js", ".ts", ".rs", ".go", ".java", ".cpp", ".c"]:
            return self._chunk_code_file(content, file_ext)
        
        # Markdown files - chunk by headers
        elif file_ext in [".md", ".markdown"]:
            return self._chunk_markdown_file(content)
        
        # Default text chunking
        else:
            return self._chunk_text_content(content, chunk_size, chunk_overlap)
    
    def _chunk_code_file(self, content: str, file_ext: str) -> List[Dict[str, Any]]:
        """
        Chunk code files by logical units (functions, classes, etc.)
        """
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        current_start_line = 0
        indent_level = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Detect function/class definitions
            is_definition = False
            if file_ext == ".py":
                is_definition = stripped.startswith(("def ", "class ", "async def "))
            elif file_ext in [".js", ".ts"]:
                is_definition = ("function " in stripped or 
                               stripped.startswith("class ") or
                               "=>" in stripped)
            elif file_ext == ".rs":
                is_definition = stripped.startswith(("fn ", "impl ", "struct ", "enum "))
            
            # Start new chunk on definition if current chunk is substantial
            if is_definition and len(current_chunk) > 10:
                if current_chunk:
                    chunks.append({
                        "text": '\n'.join(current_chunk),
                        "start_line": current_start_line,
                        "end_line": i - 1
                    })
                current_chunk = [line]
                current_start_line = i
            else:
                current_chunk.append(line)
            
            # Also chunk on large size
            if len(current_chunk) > 50:
                chunks.append({
                    "text": '\n'.join(current_chunk),
                    "start_line": current_start_line,
                    "end_line": i
                })
                current_chunk = []
                current_start_line = i + 1
        
        # Add remaining content
        if current_chunk:
            chunks.append({
                "text": '\n'.join(current_chunk),
                "start_line": current_start_line,
                "end_line": len(lines) - 1
            })
        
        return chunks
    
    def _chunk_markdown_file(self, content: str) -> List[Dict[str, Any]]:
        """
        Chunk markdown files by headers
        """
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        current_start_line = 0
        
        for i, line in enumerate(lines):
            # Detect headers
            if line.strip().startswith('#'):
                # Start new chunk if current chunk exists
                if current_chunk:
                    chunks.append({
                        "text": '\n'.join(current_chunk),
                        "start_line": current_start_line,
                        "end_line": i - 1
                    })
                current_chunk = [line]
                current_start_line = i
            else:
                current_chunk.append(line)
        
        # Add remaining content
        if current_chunk:
            chunks.append({
                "text": '\n'.join(current_chunk),
                "start_line": current_start_line,
                "end_line": len(lines) - 1
            })
        
        return chunks
    
    def _chunk_text_content(self, 
                          content: str, 
                          chunk_size: int, 
                          chunk_overlap: int) -> List[Dict[str, Any]]:
        """
        Default text chunking with overlap
        """
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + chunk_size
            chunk_text = content[start:end]
            
            chunks.append({
                "text": chunk_text,
                "start_char": start,
                "end_char": end
            })
            
            start = end - chunk_overlap
        
        return chunks
    
    async def query(self, 
                   query: str, 
                   max_results: int = 5,
                   context_filter: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Fast query using ChromaDB vector search
        """
        start_time = time.time()
        
        # Generate query embedding
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=query
            )
            query_embedding = response.data[0].embedding
        except Exception as e:
            logger.error("Failed to generate query embedding", error=str(e))
            raise
        
        # Search ChromaDB
        search_kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": max_results,
            "include": ["documents", "metadatas", "distances"]
        }
        
        # Add filters if provided
        if context_filter:
            search_kwargs["where"] = context_filter
        
        results = self.collection.query(**search_kwargs)
        
        # Extract relevant chunks
        relevant_chunks = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0
                
                relevant_chunks.append({
                    "content": doc,
                    "metadata": metadata,
                    "similarity": 1.0 - distance,  # Convert distance to similarity
                    "file_path": metadata.get("file_path", "unknown"),
                    "chunk_index": metadata.get("chunk_index", 0)
                })
        
        # Generate response using LLM
        context = self._build_context(relevant_chunks)
        llm_response = await self._generate_response(query, context)
        
        search_duration = time.time() - start_time
        
        result = {
            "query": query,
            "response": llm_response,
            "sources": relevant_chunks,
            "search_duration": round(search_duration, 3),
            "total_chunks_searched": self.collection.count()
        }
        
        logger.info("RAG query completed", 
                   query_length=len(query),
                   results_found=len(relevant_chunks),
                   duration_seconds=round(search_duration, 3))
        
        return result
    
    def _build_context(self, chunks: List[Dict[str, Any]]) -> str:
        """
        Build context from relevant chunks
        """
        context_parts = []
        
        for chunk in chunks:
            file_path = chunk["metadata"].get("file_path", "unknown")
            content = chunk["content"]
            similarity = chunk["similarity"]
            
            context_parts.append(
                f"File: {file_path} (similarity: {similarity:.3f})\n"
                f"Content:\n{content}\n"
                f"---"
            )
        
        return "\n".join(context_parts)
    
    async def _generate_response(self, query: str, context: str) -> str:
        """
        Generate response using Ollama LLM
        """
        prompt = f"""Based on the following code and documentation context, please answer the question.

Context:
{context}

Question: {query}

Please provide a helpful and accurate answer based on the context provided. If the context doesn't contain enough information to answer the question, please say so.

Answer:"""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                top_p=0.9,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("Failed to generate LLM response", error=str(e))
            return f"Error generating response: {str(e)}"
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get RAG system statistics
        """
        return {
            "total_chunks": self.collection.count(),
            "collection_name": self.collection.name,
            "embedding_model": self.embedding_model,
            "llm_model": self.llm_model,
            "chromadb_path": self.chromadb_path
        }
    
    def reset_collection(self):
        """
        Reset the collection (for testing/debugging)
        """
        self.chroma_client.delete_collection(self.collection.name)
        self.collection = self.chroma_client.create_collection(
            name="code_knowledge",
            metadata={"description": "Code and documentation embeddings"}
        )
        logger.info("Collection reset")
    
    async def initialize(self):
        """Initialize the RAG engine"""
        # Test OpenAI connection (non-blocking)
        if self.openai_client:
            try:
                models = self.openai_client.models.list()
                logger.info("OpenAI connection successful", models_count=len(models.data))
            except Exception as e:
                logger.warning("OpenAI connection failed - will continue without it", error=str(e))
        else:
            logger.info("OpenAI client not available - continuing without it")
        
        # Test ChromaDB
        try:
            count = self.collection.count()
            logger.info("ChromaDB connection successful", documents_count=count)
        except Exception as e:
            logger.error("Failed to connect to ChromaDB", error=str(e))
            raise
    
    def is_ready(self) -> bool:
        """Check if the RAG engine is ready"""
        try:
            # Test ChromaDB (required)
            self.collection.count()
            
            # Test OpenAI (optional)
            if self.openai_client:
                self.openai_client.models.list()
            
            return True
        except:
            return False
    
    async def analyze_code(self, code: str, language: str = None, context: str = None) -> str:
        """Analyze code and provide insights"""
        prompt = f"""Analyze the following {language or 'code'} and provide insights:

Code:
```{language or ''}
{code}
```

{f'Additional context: {context}' if context else ''}

Please provide:
1. What this code does
2. Potential improvements
3. Best practices suggestions
4. Any issues or concerns

Analysis:"""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                top_p=0.9
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("Code analysis failed", error=str(e))
            return f"Error analyzing code: {str(e)}"
    
    async def search_codebase(self, query: str, limit: int = 5) -> str:
        """Search through codebase using semantic search"""
        try:
            result = await self.query(query, max_results=limit)
            
            if not result["sources"]:
                return "No relevant code found for your query."
            
            response = f"Found {len(result['sources'])} relevant code snippets:\n\n"
            
            for i, source in enumerate(result["sources"], 1):
                file_path = source["metadata"].get("file_path", "unknown")
                similarity = source["similarity"]
                content = source["content"][:500] + "..." if len(source["content"]) > 500 else source["content"]
                
                response += f"{i}. **{file_path}** (similarity: {similarity:.3f})\n"
                response += f"```\n{content}\n```\n\n"
            
            return response
            
        except Exception as e:
            logger.error("Codebase search failed", error=str(e))
            return f"Error searching codebase: {str(e)}"
    
    async def generate_code(self, requirements: str, language: str = None, context: str = None) -> str:
        """Generate code based on requirements"""
        prompt = f"""Generate {language or 'code'} based on the following requirements:

Requirements:
{requirements}

{f'Context from codebase: {context}' if context else ''}

Please provide:
1. Clean, well-commented code
2. Follow best practices for {language or 'the language'}
3. Include error handling where appropriate
4. Explain key design decisions

Generated code:"""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                top_p=0.9
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("Code generation failed", error=str(e))
            return f"Error generating code: {str(e)}"
    
    async def explain_code(self, code: str, level: str = "intermediate") -> str:
        """Explain how code works"""
        level_prompts = {
            "beginner": "Explain this code in simple terms for someone new to programming",
            "intermediate": "Explain this code with technical details for a developer",
            "advanced": "Provide a deep technical analysis of this code"
        }
        
        prompt = f"""{level_prompts.get(level, level_prompts['intermediate'])}:

Code:
```
{code}
```

Please explain:
1. What the code does step by step
2. Key concepts and patterns used
3. How it fits into larger programming concepts
4. Any notable techniques or optimizations

Explanation:"""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                top_p=0.9
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("Code explanation failed", error=str(e))
            return f"Error explaining code: {str(e)}"
    
    async def list_collections(self) -> List[str]:
        """List all collections"""
        try:
            collections = self.chroma_client.list_collections()
            return [col.name for col in collections]
        except Exception as e:
            logger.error("Failed to list collections", error=str(e))
            return []
    
    async def create_collection(self, name: str, metadata: Dict[str, Any]) -> bool:
        """Create a new collection"""
        try:
            self.chroma_client.create_collection(name=name, metadata=metadata)
            logger.info("Collection created", name=name)
            return True
        except Exception as e:
            logger.error("Failed to create collection", name=name, error=str(e))
            return False
    
    async def get_collection_count(self, collection_name: str) -> int:
        """Get document count for a collection"""
        try:
            if collection_name == "codebase":
                # Use main collection for codebase
                return self.collection.count()
            else:
                # Try to get other collection
                try:
                    col = self.chroma_client.get_collection(collection_name)
                    return col.count()
                except:
                    return 0
        except Exception as e:
            logger.error("Failed to get collection count", collection=collection_name, error=str(e))
            return 0
    
    async def add_document_to_collection(self, collection_name: str, document_id: str, content: str, metadata: Dict[str, Any]) -> bool:
        """Add document to specific collection"""
        try:
            if collection_name == "codebase":
                # Use main collection
                chunks_created = await self.add_document(content, metadata)
                return chunks_created > 0
            else:
                # Try to get or create collection
                try:
                    col = self.chroma_client.get_collection(collection_name)
                except:
                    col = self.chroma_client.create_collection(collection_name)
                
                # Generate embedding
                response = self.ollama_client.embeddings(
                    model=self.embedding_model,
                    prompt=content
                )
                
                col.add(
                    embeddings=[response["embedding"]],
                    documents=[content],
                    metadatas=[metadata],
                    ids=[document_id]
                )
                return True
        except Exception as e:
            logger.error("Failed to add document", collection=collection_name, error=str(e))
            return False
    
    async def get_codebase_stats(self) -> Dict[str, Any]:
        """Get codebase statistics"""
        try:
            total_docs = self.collection.count()
            collections = await self.list_collections()
            
            return {
                "total_documents": total_docs,
                "collections": collections,
                "embedding_model": self.embedding_model,
                "llm_model": self.llm_model,
                "status": "ready" if self.is_ready() else "not_ready"
            }
        except Exception as e:
            logger.error("Failed to get stats", error=str(e))
            return {"error": str(e)}

# Example usage
if __name__ == "__main__":
    async def test_rag():
        rag = FastRAGEngine()
        
        # Test adding a document
        test_content = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)
"""
        
        await rag.add_document(
            content=test_content,
            metadata={
                "file_path": "test.py",
                "file_type": "python",
                "project": "test_project"
            }
        )
        
        # Test querying
        result = await rag.query("How do I calculate fibonacci numbers?")
        print(f"Query: {result['query']}")
        print(f"Response: {result['response']}")
        print(f"Duration: {result['search_duration']}s")
        print(f"Sources: {len(result['sources'])}")
    
    asyncio.run(test_rag())