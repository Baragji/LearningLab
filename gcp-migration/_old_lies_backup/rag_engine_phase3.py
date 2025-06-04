"""
Phase 3 Enhanced RAG Engine with ChromaDB and Ollama
Optimized for performance and advanced features
"""

import asyncio
import logging
import os
import time
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import json

import chromadb
from chromadb.config import Settings
import ollama
import structlog

# Try to import optional dependencies
try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False

try:
    from langdetect import detect
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False

logger = structlog.get_logger()

class RAGEnginePhase3:
    """
    Enhanced RAG engine for Phase 3 with advanced features:
    - Intelligent chunking based on content type
    - Caching for better performance
    - Multiple collection support
    - Advanced search capabilities
    - Performance monitoring
    """
    
    def __init__(self, 
                 chromadb_path: str = "/app/chromadb",
                 ollama_host: str = "localhost:11434",
                 embedding_model: str = "nomic-embed-text",
                 llm_model: str = "llama3.1:8b"):
        
        self.chromadb_path = chromadb_path
        self.ollama_host = ollama_host
        self.embedding_model = embedding_model
        self.llm_model = llm_model
        
        # Performance tracking
        self.query_count = 0
        self.total_query_time = 0
        self.cache = {}
        self.cache_hits = 0
        
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=chromadb_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Initialize Ollama client
        self.ollama_client = ollama.Client(host=f"http://{ollama_host}")
        
        # Initialize tokenizer for better chunking if available
        self.tokenizer = None
        if TIKTOKEN_AVAILABLE:
            try:
                self.tokenizer = tiktoken.get_encoding("cl100k_base")
            except:
                logger.warning("Tiktoken encoding failed, using character-based chunking")
        else:
            logger.warning("Tiktoken not available, using character-based chunking")
        
        # Default collection
        self.default_collection = self.chroma_client.get_or_create_collection(
            name="code_knowledge",
            metadata={"description": "Main code and documentation embeddings"}
        )
        
        logger.info("RAGEnginePhase3 initialized", 
                   chromadb_path=chromadb_path,
                   default_collection_count=self.default_collection.count())
    
    async def initialize(self):
        """Initialize and test all components"""
        try:
            # Test Ollama connection
            models = self.ollama_client.list()
            available_models = [model['name'] for model in models.get('models', [])]
            
            if self.embedding_model not in available_models:
                logger.warning(f"Embedding model {self.embedding_model} not found")
            
            if self.llm_model not in available_models:
                logger.warning(f"LLM model {self.llm_model} not found")
            
            logger.info("Ollama connection successful", 
                       available_models=len(available_models))
            
            # Test ChromaDB
            count = self.default_collection.count()
            logger.info("ChromaDB connection successful", 
                       documents_count=count)
            
            # Test embedding generation
            test_embedding = await self._generate_embedding("test")
            if test_embedding:
                logger.info("Embedding generation test successful")
            
            return True
            
        except Exception as e:
            logger.error("Initialization failed", error=str(e))
            raise
    
    def is_ready(self) -> bool:
        """Check if the RAG engine is ready"""
        try:
            # Test Ollama
            self.ollama_client.list()
            # Test ChromaDB
            self.default_collection.count()
            return True
        except:
            return False
    
    async def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text with caching"""
        # Create cache key
        cache_key = hashlib.md5(text.encode()).hexdigest()
        
        if cache_key in self.cache:
            self.cache_hits += 1
            return self.cache[cache_key]
        
        try:
            response = self.ollama_client.embeddings(
                model=self.embedding_model,
                prompt=text
            )
            embedding = response["embedding"]
            
            # Cache the result
            self.cache[cache_key] = embedding
            
            return embedding
        except Exception as e:
            logger.error("Embedding generation failed", error=str(e))
            return None
    
    def _intelligent_chunk(self, content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Intelligent chunking based on content type and structure"""
        file_path = metadata.get("file_path", "")
        file_ext = Path(file_path).suffix.lower()
        language = metadata.get("language", "")
        
        # Detect language if not provided and langdetect is available
        if not language and LANGDETECT_AVAILABLE:
            try:
                detected_lang = detect(content[:1000])
                if detected_lang == 'en':
                    language = self._detect_programming_language(content, file_ext)
                else:
                    language = detected_lang
            except:
                language = "unknown"
        
        # Choose chunking strategy based on content type
        if file_ext in [".py", ".js", ".ts", ".rs", ".go", ".java", ".cpp", ".c", ".php"]:
            return self._chunk_code_file(content, file_ext, language)
        elif file_ext in [".md", ".markdown"]:
            return self._chunk_markdown_file(content)
        elif file_ext in [".json", ".yaml", ".yml"]:
            return self._chunk_structured_file(content, file_ext)
        elif file_ext in [".txt", ".log"]:
            return self._chunk_text_file(content)
        else:
            return self._chunk_generic_file(content)
    
    def _detect_programming_language(self, content: str, file_ext: str) -> str:
        """Detect programming language from content and extension"""
        ext_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.rs': 'rust',
            '.go': 'go',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin'
        }
        
        return ext_map.get(file_ext, 'code')
    
    def _chunk_code_file(self, content: str, file_ext: str, language: str) -> List[Dict[str, Any]]:
        """Advanced code chunking by logical units"""
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        current_start_line = 0
        
        # Language-specific patterns
        function_patterns = {
            '.py': ['def ', 'class ', 'async def '],
            '.js': ['function ', 'class ', 'const ', 'let ', 'var '],
            '.ts': ['function ', 'class ', 'interface ', 'type ', 'const ', 'let '],
            '.rs': ['fn ', 'impl ', 'struct ', 'enum ', 'trait '],
            '.go': ['func ', 'type ', 'struct ', 'interface '],
            '.java': ['public class ', 'private class ', 'public interface ', 'public void ', 'private void '],
            '.cpp': ['class ', 'struct ', 'namespace ', 'template '],
            '.c': ['struct ', 'typedef ', 'static ']
        }
        
        patterns = function_patterns.get(file_ext, ['function', 'class', 'def'])
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Check for function/class definitions
            is_definition = any(stripped.startswith(pattern) for pattern in patterns)
            
            # Start new chunk on definition if current chunk is substantial
            if is_definition and len(current_chunk) > 5:
                if current_chunk:
                    chunk_text = '\n'.join(current_chunk)
                    chunks.append({
                        "text": chunk_text,
                        "start_line": current_start_line,
                        "end_line": i - 1,
                        "type": "code_block",
                        "language": language,
                        "token_count": self._count_tokens(chunk_text)
                    })
                current_chunk = [line]
                current_start_line = i
            else:
                current_chunk.append(line)
            
            # Also chunk on size (token-based if available)
            if self._should_split_chunk(current_chunk):
                chunk_text = '\n'.join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "start_line": current_start_line,
                    "end_line": i,
                    "type": "code_block",
                    "language": language,
                    "token_count": self._count_tokens(chunk_text)
                })
                current_chunk = []
                current_start_line = i + 1
        
        # Add remaining content
        if current_chunk:
            chunk_text = '\n'.join(current_chunk)
            chunks.append({
                "text": chunk_text,
                "start_line": current_start_line,
                "end_line": len(lines) - 1,
                "type": "code_block",
                "language": language,
                "token_count": self._count_tokens(chunk_text)
            })
        
        return chunks
    
    def _chunk_markdown_file(self, content: str) -> List[Dict[str, Any]]:
        """Chunk markdown by headers and sections"""
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        current_header = ""
        current_level = 0
        
        for line in lines:
            if line.startswith('#'):
                # New header found
                if current_chunk:
                    chunk_text = '\n'.join(current_chunk)
                    chunks.append({
                        "text": chunk_text,
                        "type": "markdown_section",
                        "header": current_header,
                        "level": current_level,
                        "token_count": self._count_tokens(chunk_text)
                    })
                
                # Start new chunk
                current_header = line.strip()
                current_level = len(line) - len(line.lstrip('#'))
                current_chunk = [line]
            else:
                current_chunk.append(line)
                
                # Split large sections
                if self._should_split_chunk(current_chunk):
                    chunk_text = '\n'.join(current_chunk)
                    chunks.append({
                        "text": chunk_text,
                        "type": "markdown_section",
                        "header": current_header,
                        "level": current_level,
                        "token_count": self._count_tokens(chunk_text)
                    })
                    current_chunk = []
        
        # Add remaining content
        if current_chunk:
            chunk_text = '\n'.join(current_chunk)
            chunks.append({
                "text": chunk_text,
                "type": "markdown_section",
                "header": current_header,
                "level": current_level,
                "token_count": self._count_tokens(chunk_text)
            })
        
        return chunks
    
    def _chunk_structured_file(self, content: str, file_ext: str) -> List[Dict[str, Any]]:
        """Chunk structured files like JSON/YAML"""
        try:
            if file_ext == ".json":
                data = json.loads(content)
                return self._chunk_json_data(data, content)
            else:
                # For YAML and other structured formats, use text chunking
                return self._chunk_text_file(content)
        except:
            return self._chunk_text_file(content)
    
    def _chunk_json_data(self, data: Any, original_content: str) -> List[Dict[str, Any]]:
        """Chunk JSON data intelligently"""
        chunks = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                chunk_content = json.dumps({key: value}, indent=2)
                chunks.append({
                    "text": chunk_content,
                    "type": "json_object",
                    "key": key,
                    "token_count": self._count_tokens(chunk_content)
                })
        elif isinstance(data, list):
            for i, item in enumerate(data):
                chunk_content = json.dumps(item, indent=2)
                chunks.append({
                    "text": chunk_content,
                    "type": "json_array_item",
                    "index": i,
                    "token_count": self._count_tokens(chunk_content)
                })
        else:
            # Fallback to text chunking
            return self._chunk_text_file(original_content)
        
        return chunks
    
    def _chunk_text_file(self, content: str) -> List[Dict[str, Any]]:
        """Chunk plain text files by paragraphs and sentences"""
        paragraphs = content.split('\n\n')
        chunks = []
        
        for para in paragraphs:
            if len(para.strip()) > 0:
                chunks.append({
                    "text": para.strip(),
                    "type": "text_paragraph",
                    "token_count": self._count_tokens(para)
                })
        
        return chunks
    
    def _chunk_generic_file(self, content: str) -> List[Dict[str, Any]]:
        """Generic chunking for unknown file types"""
        return self._chunk_text_file(content)
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        if self.tokenizer:
            try:
                return len(self.tokenizer.encode(text))
            except:
                pass
        
        # Fallback to word count approximation
        return int(len(text.split()) * 1.3)  # Rough approximation
    
    def _should_split_chunk(self, chunk_lines: List[str]) -> bool:
        """Determine if chunk should be split based on size"""
        chunk_text = '\n'.join(chunk_lines)
        token_count = self._count_tokens(chunk_text)
        
        # Split if too many tokens or lines
        return token_count > 1000 or len(chunk_lines) > 100
    
    async def add_document(self, 
                          content: str, 
                          metadata: Dict[str, Any],
                          collection_name: str = "code_knowledge") -> int:
        """Add document with intelligent chunking and metadata"""
        start_time = time.time()
        
        # Get or create collection
        collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"description": f"Collection: {collection_name}"}
        )
        
        # Intelligent chunking
        chunks = self._intelligent_chunk(content, metadata)
        
        if not chunks:
            logger.warning("No chunks created from content", metadata=metadata)
            return 0
        
        # Generate embeddings and add to collection
        embeddings = []
        chunk_texts = []
        chunk_metadatas = []
        chunk_ids = []
        
        for i, chunk in enumerate(chunks):
            # Generate embedding
            embedding = await self._generate_embedding(chunk["text"])
            if embedding:
                embeddings.append(embedding)
                chunk_texts.append(chunk["text"])
                
                # Enhanced metadata
                chunk_metadata = {
                    **metadata,
                    **chunk,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "added_time": time.time()
                }
                chunk_metadatas.append(chunk_metadata)
                
                # Create unique ID
                doc_id = metadata.get("file_path", "unknown")
                chunk_ids.append(f"{doc_id}_chunk_{i}")
        
        # Add to ChromaDB
        if embeddings:
            collection.add(
                embeddings=embeddings,
                documents=chunk_texts,
                metadatas=chunk_metadatas,
                ids=chunk_ids
            )
        
        duration = time.time() - start_time
        logger.info("Document added to RAG", 
                   file_path=metadata.get("file_path"),
                   collection=collection_name,
                   chunks_created=len(embeddings),
                   duration_seconds=round(duration, 2))
        
        return len(embeddings)
    
    async def query(self, 
                   query: str, 
                   collection_name: str = "code_knowledge",
                   max_results: int = 5,
                   similarity_threshold: float = 0.7) -> Dict[str, Any]:
        """Enhanced query with performance tracking"""
        start_time = time.time()
        self.query_count += 1
        
        try:
            # Get collection
            collection = self.chroma_client.get_collection(name=collection_name)
            
            # Generate query embedding
            query_embedding = await self._generate_embedding(query)
            if not query_embedding:
                return {"sources": [], "query": query, "error": "Failed to generate embedding"}
            
            # Search
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=max_results,
                include=["documents", "metadatas", "distances"]
            )
            
            # Process results
            sources = []
            if results["documents"] and results["documents"][0]:
                for i, (doc, metadata, distance) in enumerate(zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                )):
                    similarity = 1 - distance  # Convert distance to similarity
                    
                    if similarity >= similarity_threshold:
                        sources.append({
                            "content": doc,
                            "metadata": metadata,
                            "similarity": similarity,
                            "rank": i + 1
                        })
            
            duration = time.time() - start_time
            self.total_query_time += duration
            
            return {
                "sources": sources,
                "query": query,
                "collection": collection_name,
                "query_time": round(duration, 3),
                "total_results": len(sources)
            }
            
        except Exception as e:
            logger.error("Query failed", error=str(e), query=query)
            return {"sources": [], "query": query, "error": str(e)}
    
    async def _generate_response(self, prompt: str, context: str) -> str:
        """Generate response using Ollama"""
        try:
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            
            response = self.ollama_client.generate(
                model=self.llm_model,
                prompt=full_prompt,
                options={"temperature": 0.1, "top_p": 0.9}
            )
            return response["response"]
        except Exception as e:
            logger.error("Response generation failed", error=str(e))
            return f"Error generating response: {str(e)}"
    
    async def analyze_code(self, code: str, language: str = None, context: str = None) -> str:
        """Enhanced code analysis with RAG context"""
        # Search for similar code patterns
        similar_code = await self.query(f"code analysis {language} {code[:100]}", max_results=3)
        
        context_info = ""
        if similar_code["sources"]:
            context_info = "\n\nSimilar code patterns found in codebase:\n"
            for source in similar_code["sources"][:2]:
                context_info += f"- {source['metadata'].get('file_path', 'unknown')}\n"
        
        prompt = f"""Analyze the following {language or 'code'} and provide comprehensive insights:

Code:
```{language or ''}
{code}
```

{f'Additional context: {context}' if context else ''}
{context_info}

Please provide:
1. **Functionality**: What this code does
2. **Code Quality**: Assessment of code quality and style
3. **Best Practices**: Adherence to best practices
4. **Potential Issues**: Bugs, security concerns, or performance issues
5. **Improvements**: Specific suggestions for improvement
6. **Context**: How this fits with similar patterns in the codebase

Analysis:"""

        return await self._generate_response(prompt, "")
    
    async def search_codebase(self, query: str, limit: int = 5, collection_name: str = "code_knowledge") -> str:
        """Enhanced codebase search with better formatting"""
        try:
            result = await self.query(query, collection_name=collection_name, max_results=limit)
            
            if not result["sources"]:
                return f"No relevant code found for query: '{query}'"
            
            response = f"🔍 **Search Results for:** '{query}'\n"
            response += f"📊 **Found:** {len(result['sources'])} relevant snippets\n"
            response += f"⏱️ **Query time:** {result.get('query_time', 0):.3f}s\n\n"
            
            for i, source in enumerate(result["sources"], 1):
                file_path = source["metadata"].get("file_path", "unknown")
                similarity = source["similarity"]
                content = source["content"]
                language = source["metadata"].get("language", "")
                chunk_type = source["metadata"].get("type", "code")
                
                # Truncate long content
                if len(content) > 800:
                    content = content[:800] + "\n... (truncated)"
                
                response += f"### {i}. **{file_path}** (similarity: {similarity:.3f})\n"
                response += f"**Type:** {chunk_type} | **Language:** {language}\n"
                response += f"```{language}\n{content}\n```\n\n"
            
            return response
            
        except Exception as e:
            logger.error("Codebase search failed", error=str(e))
            return f"Error searching codebase: {str(e)}"
    
    async def generate_code(self, requirements: str, language: str = None, context: str = None) -> str:
        """Enhanced code generation with codebase context"""
        # Search for relevant examples
        search_query = f"{language} {requirements}" if language else requirements
        examples = await self.query(search_query, max_results=3)
        
        example_context = ""
        if examples["sources"]:
            example_context = "\n\nRelevant examples from codebase:\n"
            for source in examples["sources"]:
                file_path = source["metadata"].get("file_path", "unknown")
                content = source["content"][:300] + "..." if len(source["content"]) > 300 else source["content"]
                example_context += f"\nFrom {file_path}:\n```\n{content}\n```\n"
        
        prompt = f"""Generate {language or 'code'} based on the following requirements:

**Requirements:**
{requirements}

{f'**Additional Context:** {context}' if context else ''}
{example_context}

Please provide:
1. Clean, well-commented code
2. Follow best practices for {language or 'the language'}
3. Include error handling where appropriate
4. Make it consistent with the codebase examples shown above

Generated Code:"""

        return await self._generate_response(prompt, "")
    
    async def explain_code(self, code: str, level: str = "intermediate") -> str:
        """Enhanced code explanation with examples"""
        # Search for similar code for context
        similar = await self.query(f"explain code similar to: {code[:200]}", max_results=2)
        
        context_info = ""
        if similar["sources"]:
            context_info = "\n\nSimilar patterns in codebase:\n"
            for source in similar["sources"]:
                file_path = source["metadata"].get("file_path", "unknown")
                context_info += f"- Found in: {file_path}\n"
        
        level_instructions = {
            "beginner": "Use simple terms and explain basic concepts. Assume minimal programming knowledge.",
            "intermediate": "Provide detailed explanations with some technical terms. Assume good programming knowledge.",
            "advanced": "Use technical terminology and focus on advanced concepts, patterns, and optimizations."
        }
        
        instruction = level_instructions.get(level, level_instructions["intermediate"])
        
        prompt = f"""Explain the following code at a {level} level:

```
{code}
```

{instruction}
{context_info}

Please explain:
1. **What it does**: High-level purpose and functionality
2. **How it works**: Step-by-step breakdown
3. **Key concepts**: Important programming concepts used
4. **Why it's written this way**: Design decisions and patterns
5. **Potential variations**: Alternative approaches or improvements

Explanation:"""

        return await self._generate_response(prompt, "")
    
    async def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        avg_query_time = self.total_query_time / self.query_count if self.query_count > 0 else 0
        cache_hit_rate = self.cache_hits / max(len(self.cache), 1)
        
        return {
            "query_count": self.query_count,
            "total_query_time": round(self.total_query_time, 3),
            "average_query_time": round(avg_query_time, 3),
            "cache_size": len(self.cache),
            "cache_hits": self.cache_hits,
            "cache_hit_rate": round(cache_hit_rate, 3)
        }
    
    async def get_codebase_stats(self) -> Dict[str, Any]:
        """Get comprehensive codebase statistics"""
        try:
            collections = self.chroma_client.list_collections()
            collection_stats = {}
            total_documents = 0
            
            for collection in collections:
                count = collection.count()
                collection_stats[collection.name] = {
                    "document_count": count,
                    "metadata": collection.metadata
                }
                total_documents += count
            
            performance_stats = await self.get_performance_stats()
            
            return {
                "total_collections": len(collections),
                "total_documents": total_documents,
                "collections": collection_stats,
                "performance": performance_stats,
                "models": {
                    "embedding_model": self.embedding_model,
                    "llm_model": self.llm_model
                },
                "status": "ready" if self.is_ready() else "not_ready"
            }
            
        except Exception as e:
            logger.error("Failed to get codebase stats", error=str(e))
            return {"error": str(e), "status": "error"}
    
    async def list_collections(self) -> List[str]:
        """List all available collections"""
        try:
            collections = self.chroma_client.list_collections()
            return [collection.name for collection in collections]
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
            collection = self.chroma_client.get_collection(name=collection_name)
            return collection.count()
        except Exception as e:
            logger.error("Failed to get collection count", collection=collection_name, error=str(e))
            return 0
    
    async def add_document_to_collection(self, 
                                       collection_name: str, 
                                       document_id: str, 
                                       content: str, 
                                       metadata: Dict[str, Any]) -> bool:
        """Add a document to a specific collection"""
        try:
            enhanced_metadata = {
                **metadata,
                "document_id": document_id,
                "file_path": metadata.get("file_path", document_id)
            }
            
            chunks_created = await self.add_document(content, enhanced_metadata, collection_name)
            return chunks_created > 0
        except Exception as e:
            logger.error("Failed to add document to collection", 
                        collection=collection_name, 
                        document_id=document_id, 
                        error=str(e))
            return False

# Alias for backward compatibility
RAGEngine = RAGEnginePhase3