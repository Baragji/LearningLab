"""
RAG Engine with OpenAI API integration
Fast vector search with ChromaDB + OpenAI embeddings and LLM
"""

import asyncio
import hashlib
import logging
import os
import time
from functools import lru_cache
from typing import List, Dict, Any, Optional
from pathlib import Path

import chromadb
from chromadb.config import Settings
import openai
from dotenv import load_dotenv

# Import monitoring (with fallback if not available)
try:
    from ..monitoring.metrics import mcp_metrics
except ImportError:
    mcp_metrics = None

# Import error handling
try:
    from ..utils.error_handler import handle_openai_error, handle_chromadb_error, handle_rag_error
except ImportError:
    # Fallback functions if error handler is not available
    def handle_openai_error(error):
        return error
    def handle_chromadb_error(error, operation="unknown"):
        return error
    def handle_rag_error(error, operation="unknown"):
        return error

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    """
    RAG engine using ChromaDB + OpenAI API
    """
    
    def __init__(self, 
                 chromadb_path: Optional[str] = None,
                 embedding_model: Optional[str] = None,
                 llm_model: Optional[str] = None,
                 enable_cache: bool = True,
                 cache_size: int = 1000):
        
        # Initialize caching
        self.enable_cache = enable_cache
        self.cache_size = cache_size
        self._embedding_cache = {} if enable_cache else None
        
        # Get models from environment or use defaults
        self.embedding_model = embedding_model or os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        self.llm_model = llm_model or os.getenv("OPENAI_LLM_MODEL", "gpt-3.5-turbo")
        
        # Set ChromaDB path
        if chromadb_path is None:
            env_path = os.getenv("CHROMADB_PATH")
            if env_path:
                self.chromadb_path = env_path
            else:
                current_dir = Path(__file__).parent.parent
                self.chromadb_path = str(current_dir / "data" / "chromadb")
            os.makedirs(self.chromadb_path, exist_ok=True)
        else:
            self.chromadb_path = chromadb_path
            
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.openai_client = openai.OpenAI(api_key=api_key)
        
        logger.info(f"Initializing RAG engine with ChromaDB path: {self.chromadb_path}")
        logger.info(f"Using embedding model: {self.embedding_model}")
        logger.info(f"Using LLM model: {self.llm_model}")
        
        # Initialize ChromaDB client
        try:
            self.chroma_client = chromadb.PersistentClient(
                path=self.chromadb_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info("ChromaDB client initialized successfully")
        except Exception as e:
            error = handle_chromadb_error(e, "initialization")
            logger.error(f"Failed to initialize ChromaDB: {error}")
            raise error
        
        # Test OpenAI client
        try:
            models = self.openai_client.models.list()
            logger.info(f"OpenAI client initialized successfully - {len(models.data)} models available")
        except Exception as e:
            error = handle_openai_error(e)
            logger.error(f"Failed to initialize OpenAI client: {error}")
            raise error
        
        # Get or create collection
        try:
            self.collection = self.chroma_client.get_or_create_collection(
                name="code_knowledge_openai",
                metadata={"description": "Code and documentation embeddings"}
            )
            logger.info(f"Collection initialized with {self.collection.count()} documents")
        except Exception as e:
            error = handle_chromadb_error(e, "collection_initialization")
            logger.error(f"Failed to initialize collection: {error}")
            raise error
    
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
            logger.warning(f"No chunks created from content: {metadata}")
            return 0
        
        # Generate embeddings using OpenAI with batching for better performance
        embeddings = []
        chunk_texts = []
        chunk_metadatas = []
        chunk_ids = []
        
        # Prepare all chunk data first
        for i, chunk in enumerate(chunks):
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
            doc_id = metadata.get("file_path", "unknown").replace("/", "_").replace("\\", "_")
            chunk_ids.append(f"{doc_id}_chunk_{i}")
        
        # Generate embeddings in batches for better performance
        embeddings = await self._generate_embeddings_batch(chunk_texts)
        
        # Add to ChromaDB
        if embeddings:
            try:
                self.collection.add(
                    embeddings=embeddings,
                    documents=chunk_texts,
                    metadatas=chunk_metadatas,
                    ids=chunk_ids
                )
                logger.info(f"Added {len(embeddings)} chunks to collection")
            except Exception as e:
                error = handle_chromadb_error(e, "add_documents")
                logger.error(f"Failed to add chunks to ChromaDB: {error}")
                return 0
        
        duration = time.time() - start_time
        logger.info(f"Document added: {metadata.get('file_path')} - {len(embeddings)} chunks in {duration:.2f}s")
        
        return len(embeddings)
    
    async def _generate_embeddings_batch(self, texts: List[str], batch_size: int = 100) -> List[List[float]]:
        """
        Generate embeddings in batches for better performance and rate limiting
        """
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            
            try:
                # Use batch API call for multiple texts
                response = self.openai_client.embeddings.create(
                    model=self.embedding_model,
                    input=batch_texts
                )
                
                # Extract embeddings from response
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)
                
                logger.info(f"Generated embeddings for batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size} ({len(batch_texts)} texts)")
                
                # Add small delay to respect rate limits
                if i + batch_size < len(texts):
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"Failed to generate embeddings for batch starting at index {i}: {e}")
                # Fallback to individual requests for this batch
                for text in batch_texts:
                    try:
                        response = self.openai_client.embeddings.create(
                            model=self.embedding_model,
                            input=text
                        )
                        all_embeddings.append(response.data[0].embedding)
                    except Exception as individual_error:
                        logger.error(f"Failed to generate individual embedding: {individual_error}")
                        # Add zero vector as placeholder
                        all_embeddings.append([0.0] * 1536)  # Default embedding size
        
        return all_embeddings
    
    def _get_cache_key(self, text: str) -> str:
        """
        Generate a cache key for the given text
        """
        return hashlib.md5(f"{self.embedding_model}:{text}".encode()).hexdigest()
    
    async def _get_cached_embedding(self, text: str) -> Optional[List[float]]:
        """
        Get cached embedding for the given text
        """
        if not self.enable_cache or not self._embedding_cache:
            return None
        
        cache_key = self._get_cache_key(text)
        return self._embedding_cache.get(cache_key)
    
    async def _cache_embedding(self, text: str, embedding: List[float]) -> None:
        """
        Cache the embedding for the given text with LRU eviction
        """
        if not self.enable_cache or not self._embedding_cache:
            return
        
        cache_key = self._get_cache_key(text)
        
        # Simple LRU implementation - remove oldest if cache is full
        if len(self._embedding_cache) >= self.cache_size:
            # Remove the first (oldest) item
            oldest_key = next(iter(self._embedding_cache))
            del self._embedding_cache[oldest_key]
        
        self._embedding_cache[cache_key] = embedding
        logger.debug(f"Cached embedding for text (key: {cache_key[:8]}...)")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        """
        if not self.enable_cache or not self._embedding_cache:
            return {"enabled": False}
        
        return {
            "enabled": True,
            "size": len(self._embedding_cache),
            "max_size": self.cache_size,
            "hit_rate": getattr(self, '_cache_hits', 0) / max(getattr(self, '_cache_requests', 1), 1)
        }
    
    def clear_cache(self) -> None:
        """
        Clear the embedding cache
        """
        if self._embedding_cache:
            self._embedding_cache.clear()
            logger.info("Embedding cache cleared")
    
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
        cache_hit = False
        
        try:
            # Generate query embedding with caching
            query_embedding = await self._get_cached_embedding(query)
            if query_embedding is None:
                try:
                    response = self.openai_client.embeddings.create(
                        model=self.embedding_model,
                        input=query
                    )
                    query_embedding = response.data[0].embedding
                    # Cache the embedding
                    await self._cache_embedding(query, query_embedding)
                    
                    # Record OpenAI API usage
                    if mcp_metrics:
                        mcp_metrics.record_openai_request("embeddings", "success")
                        
                except Exception as e:
                    logger.error(f"Failed to generate query embedding: {e}")
                    if mcp_metrics:
                        mcp_metrics.record_openai_request("embeddings", "error")
                    raise
            else:
                cache_hit = True
            
            # Search ChromaDB
            search_kwargs = {
                "query_embeddings": [query_embedding],
                "n_results": max_results,
                "include": ["documents", "metadatas", "distances"]
            }
            
            # Add filters if provided
            if context_filter:
                search_kwargs["where"] = context_filter
            
            try:
                results = self.collection.query(**search_kwargs)
            except Exception as e:
                error = handle_chromadb_error(e, "query")
                logger.error(f"ChromaDB query failed: {error}")
                raise error
            
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
            
            # Record metrics if available
            if mcp_metrics:
                mcp_metrics.record_rag_operation("query", "success", search_duration)
            
            return result
            
        except Exception as e:
            error = handle_rag_error(e, "query")
            logger.error(f"RAG query failed: {error}")
            
            # Record error metrics
            if mcp_metrics:
                mcp_metrics.record_rag_operation("query", "error", time.time() - start_time)
            
            raise error
            
            # Record successful query metrics
            if mcp_metrics:
                mcp_metrics.record_rag_query("success", search_duration, cache_hit)
            
            logger.info(f"RAG query completed: {len(relevant_chunks)} results in {search_duration:.3f}s")
            
            return result
            
        except Exception as e:
            search_duration = time.time() - start_time
            
            # Record failed query metrics
            if mcp_metrics:
                mcp_metrics.record_rag_query("error", search_duration, cache_hit)
            
            logger.error(f"RAG query failed after {search_duration:.3f}s: {e}")
            raise
    
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
        Generate response using OpenAI LLM
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
            
            # Record successful LLM request
            if mcp_metrics:
                mcp_metrics.record_openai_request("chat", "success")
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Failed to generate LLM response: {e}")
            
            # Record failed LLM request
            if mcp_metrics:
                mcp_metrics.record_openai_request("chat", "error")
            
            return f"Error generating response: {str(e)}"
    
    async def initialize(self):
        """Initialize the RAG engine"""
        # Test OpenAI connection
        try:
            models = self.openai_client.models.list()
            logger.info(f"OpenAI connection successful - {len(models.data)} models available")
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI: {e}")
            raise
        
        # Test ChromaDB
        try:
            count = self.collection.count()
            logger.info(f"ChromaDB connection successful - {count} documents in collection")
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB: {e}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the RAG engine is ready"""
        try:
            # Test OpenAI
            self.openai_client.models.list()
            # Test ChromaDB
            self.collection.count()
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
            logger.error(f"Code analysis failed: {e}")
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
            logger.error(f"Codebase search failed: {e}")
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
            logger.error(f"Code generation failed: {e}")
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
            logger.error(f"Code explanation failed: {e}")
            return f"Error explaining code: {str(e)}"
    
    async def get_codebase_stats(self) -> Dict[str, Any]:
        """Get codebase statistics"""
        try:
            total_docs = self.collection.count()
            
            return {
                "total_documents": total_docs,
                "embedding_model": self.embedding_model,
                "llm_model": self.llm_model,
                "chromadb_path": self.chromadb_path,
                "status": "ready" if self.is_ready() else "not_ready"
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"error": str(e)}

# Test function
async def test_rag_engine():
    """Test the RAG engine with sample data"""
    print("🧪 Testing OpenAI RAG Engine...")
    
    try:
        # Initialize RAG engine
        rag = RAGEngine()
        await rag.initialize()
        print("✅ RAG engine initialized")
        
        # Test adding a document
        test_content = """
def fibonacci(n):
    '''Calculate fibonacci number recursively'''
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def factorial(n):
    '''Calculate factorial recursively'''
    if n <= 1:
        return 1
    return n * factorial(n-1)

class Calculator:
    '''Simple calculator class'''
    
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b
"""
        
        chunks_added = await rag.add_document(
            content=test_content,
            metadata={
                "file_path": "test_math.py",
                "file_type": "python",
                "project": "test_project"
            }
        )
        print(f"✅ Added {chunks_added} chunks to RAG")
        
        # Test querying
        result = await rag.query("How do I calculate fibonacci numbers?")
        print(f"✅ Query completed in {result['search_duration']}s")
        print(f"📝 Response: {result['response'][:200]}...")
        print(f"📊 Found {len(result['sources'])} relevant sources")
        
        # Test code analysis
        analysis = await rag.analyze_code(
            code="def hello(name): return f'Hello, {name}!'",
            language="python"
        )
        print(f"✅ Code analysis: {analysis[:100]}...")
        
        # Get stats
        stats = await rag.get_codebase_stats()
        print(f"📊 RAG Stats: {stats}")
        
        print("🎉 All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_rag_engine())