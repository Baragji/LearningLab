#!/usr/bin/env python3
"""
Data Migration from Vector DB to TigerGraph
Handles migration of existing RAG data to graph format
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from pathlib import Path
import hashlib

from .tigergraph_client import TigerGraphClient
from .schema_manager import GraphSchemaManager, VertexType, EdgeType

logger = logging.getLogger(__name__)

@dataclass
class MigrationConfig:
    """Configuration for data migration"""
    batch_size: int = 100
    max_concurrent: int = 5
    retry_attempts: int = 3
    checkpoint_interval: int = 1000
    validate_data: bool = True
    create_embeddings: bool = True
    similarity_threshold: float = 0.8

@dataclass
class MigrationProgress:
    """Migration progress tracking"""
    total_items: int = 0
    processed_items: int = 0
    successful_items: int = 0
    failed_items: int = 0
    start_time: float = 0.0
    current_phase: str = "initializing"
    errors: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []

class VectorToGraphMigrator:
    """
    Migrates data from vector database to TigerGraph
    Handles code files, functions, and relationships
    """
    
    def __init__(self, client: TigerGraphClient, schema_manager: GraphSchemaManager, 
                 config: MigrationConfig = None):
        self.client = client
        self.schema_manager = schema_manager
        self.config = config or MigrationConfig()
        self.progress = MigrationProgress()
        self.checkpoint_file = "migration_checkpoint.json"
        
    async def migrate_from_vector_db(self, vector_data: Dict[str, Any]) -> bool:
        """Main migration function from vector database"""
        try:
            logger.info("🚀 Starting migration from vector database to TigerGraph")
            self.progress.start_time = time.time()
            
            # Phase 1: Analyze source data
            self.progress.current_phase = "analyzing_data"
            analysis = await self._analyze_vector_data(vector_data)
            logger.info(f"📊 Data analysis: {analysis}")
            
            # Phase 2: Create vertices
            self.progress.current_phase = "creating_vertices"
            vertex_success = await self._migrate_vertices(vector_data)
            
            if not vertex_success:
                logger.error("❌ Vertex migration failed")
                return False
            
            # Phase 3: Create edges/relationships
            self.progress.current_phase = "creating_edges"
            edge_success = await self._migrate_edges(vector_data)
            
            if not edge_success:
                logger.error("❌ Edge migration failed")
                return False
            
            # Phase 4: Create similarity relationships
            self.progress.current_phase = "computing_similarities"
            similarity_success = await self._compute_similarities()
            
            # Phase 5: Validation
            self.progress.current_phase = "validating"
            validation_success = await self._validate_migration()
            
            # Complete migration
            self.progress.current_phase = "completed"
            total_time = time.time() - self.progress.start_time
            
            logger.info(f"✅ Migration completed in {total_time:.2f}s")
            logger.info(f"📈 Success rate: {self.progress.successful_items}/{self.progress.total_items}")
            
            return vertex_success and edge_success and validation_success
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            self.progress.errors.append(str(e))
            return False
    
    async def _analyze_vector_data(self, vector_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze vector database structure"""
        analysis = {
            "total_documents": 0,
            "document_types": {},
            "has_embeddings": False,
            "embedding_dimensions": 0,
            "estimated_vertices": 0,
            "estimated_edges": 0
        }
        
        try:
            # Analyze documents
            documents = vector_data.get("documents", [])
            analysis["total_documents"] = len(documents)
            
            for doc in documents:
                doc_type = doc.get("type", "unknown")
                analysis["document_types"][doc_type] = analysis["document_types"].get(doc_type, 0) + 1
                
                # Check for embeddings
                if "embedding" in doc and doc["embedding"]:
                    analysis["has_embeddings"] = True
                    if analysis["embedding_dimensions"] == 0:
                        analysis["embedding_dimensions"] = len(doc["embedding"])
            
            # Estimate graph size
            analysis["estimated_vertices"] = len(documents)
            analysis["estimated_edges"] = len(documents) * 2  # Rough estimate
            
            self.progress.total_items = analysis["estimated_vertices"] + analysis["estimated_edges"]
            
        except Exception as e:
            logger.error(f"Data analysis failed: {e}")
            analysis["error"] = str(e)
        
        return analysis
    
    async def _migrate_vertices(self, vector_data: Dict[str, Any]) -> bool:
        """Migrate documents as vertices"""
        try:
            documents = vector_data.get("documents", [])
            batches = [documents[i:i + self.config.batch_size] 
                      for i in range(0, len(documents), self.config.batch_size)]
            
            for batch_idx, batch in enumerate(batches):
                logger.info(f"Processing vertex batch {batch_idx + 1}/{len(batches)}")
                
                # Process batch concurrently
                tasks = []
                for doc in batch:
                    task = self._create_vertex_from_document(doc)
                    tasks.append(task)
                
                # Execute with concurrency limit
                semaphore = asyncio.Semaphore(self.config.max_concurrent)
                async def bounded_task(task):
                    async with semaphore:
                        return await task
                
                results = await asyncio.gather(*[bounded_task(task) for task in tasks], 
                                             return_exceptions=True)
                
                # Process results
                for result in results:
                    if isinstance(result, Exception):
                        self.progress.failed_items += 1
                        self.progress.errors.append(str(result))
                    else:
                        self.progress.successful_items += 1
                    
                    self.progress.processed_items += 1
                
                # Checkpoint
                if (batch_idx + 1) % (self.config.checkpoint_interval // self.config.batch_size) == 0:
                    await self._save_checkpoint()
            
            logger.info(f"✅ Vertex migration completed: {self.progress.successful_items} vertices created")
            return True
            
        except Exception as e:
            logger.error(f"Vertex migration failed: {e}")
            return False
    
    async def _create_vertex_from_document(self, doc: Dict[str, Any]) -> bool:
        """Create a graph vertex from a vector document"""
        try:
            # Determine vertex type based on document content
            vertex_type = self._classify_document_type(doc)
            vertex_id = self._generate_vertex_id(doc)
            
            # Prepare vertex attributes
            attributes = await self._prepare_vertex_attributes(doc, vertex_type)
            
            # Validate against schema
            if self.config.validate_data:
                if not self.schema_manager.validate_vertex_data(vertex_type, attributes):
                    raise Exception(f"Validation failed for vertex {vertex_id}")
            
            # Create vertex using GSQL
            gsql_statement = self._build_vertex_insert_statement(vertex_type, vertex_id, attributes)
            result = await self.client.execute_query(gsql_statement)
            
            if not result.success:
                raise Exception(f"Failed to create vertex: {result.error}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to create vertex from document: {e}")
            raise e
    
    def _classify_document_type(self, doc: Dict[str, Any]) -> str:
        """Classify document type for vertex creation"""
        # Check explicit type
        if "type" in doc:
            doc_type = doc["type"].lower()
            if "function" in doc_type:
                return VertexType.FUNCTION.value
            elif "class" in doc_type:
                return VertexType.CLASS.value
            elif "file" in doc_type:
                return VertexType.CODE_FILE.value
            elif "doc" in doc_type:
                return VertexType.DOCUMENTATION.value
        
        # Infer from content
        content = doc.get("content", "").lower()
        if "def " in content or "function" in content:
            return VertexType.FUNCTION.value
        elif "class " in content:
            return VertexType.CLASS.value
        elif any(ext in doc.get("metadata", {}).get("file_path", "") 
                for ext in [".py", ".js", ".java", ".cpp"]):
            return VertexType.CODE_FILE.value
        else:
            return VertexType.DOCUMENTATION.value
    
    def _generate_vertex_id(self, doc: Dict[str, Any]) -> str:
        """Generate unique vertex ID"""
        # Use existing ID if available
        if "id" in doc:
            return str(doc["id"])
        
        # Generate from content hash
        content = doc.get("content", "")
        metadata = doc.get("metadata", {})
        
        id_source = f"{content}_{metadata.get('file_path', '')}_{metadata.get('function_name', '')}"
        return hashlib.md5(id_source.encode()).hexdigest()
    
    async def _prepare_vertex_attributes(self, doc: Dict[str, Any], vertex_type: str) -> Dict[str, Any]:
        """Prepare vertex attributes from document"""
        attributes = {"id": self._generate_vertex_id(doc)}
        metadata = doc.get("metadata", {})
        
        if vertex_type == VertexType.FUNCTION.value:
            attributes.update({
                "function_name": metadata.get("function_name", "unknown"),
                "signature": metadata.get("signature", ""),
                "return_type": metadata.get("return_type", ""),
                "parameters": json.dumps(metadata.get("parameters", [])),
                "docstring": metadata.get("docstring", ""),
                "complexity": metadata.get("complexity", 1),
                "lines_of_code": metadata.get("lines_of_code", 0),
                "start_line": metadata.get("start_line", 0),
                "end_line": metadata.get("end_line", 0),
                "is_public": metadata.get("is_public", True),
                "is_async": metadata.get("is_async", False)
            })
        
        elif vertex_type == VertexType.CODE_FILE.value:
            attributes.update({
                "file_path": metadata.get("file_path", ""),
                "file_name": Path(metadata.get("file_path", "")).name,
                "file_type": metadata.get("file_type", ""),
                "language": metadata.get("language", ""),
                "size_bytes": metadata.get("size_bytes", 0),
                "lines_of_code": metadata.get("lines_of_code", 0),
                "content_hash": metadata.get("content_hash", ""),
                "summary": doc.get("content", "")[:500]  # Truncated summary
            })
        
        elif vertex_type == VertexType.DOCUMENTATION.value:
            attributes.update({
                "title": metadata.get("title", ""),
                "content": doc.get("content", ""),
                "doc_type": metadata.get("doc_type", ""),
                "format": metadata.get("format", "text"),
                "author": metadata.get("author", "")
            })
        
        # Add embedding if available
        if "embedding" in doc and doc["embedding"]:
            attributes["embedding"] = doc["embedding"]
        
        # Add timestamps
        current_time = time.time()
        attributes.update({
            "created_at": metadata.get("created_at", current_time),
            "modified_at": metadata.get("modified_at", current_time)
        })
        
        return attributes
    
    def _build_vertex_insert_statement(self, vertex_type: str, vertex_id: str, 
                                     attributes: Dict[str, Any]) -> str:
        """Build GSQL INSERT statement for vertex"""
        # Prepare attribute assignments
        attr_assignments = []
        for key, value in attributes.items():
            if key == "id":
                continue  # ID is handled separately
            
            if isinstance(value, str):
                attr_assignments.append(f'{key} = "{value}"')
            elif isinstance(value, (int, float, bool)):
                attr_assignments.append(f'{key} = {value}')
            elif isinstance(value, list):
                attr_assignments.append(f'{key} = {json.dumps(value)}')
            else:
                attr_assignments.append(f'{key} = "{str(value)}"')
        
        attr_clause = ", ".join(attr_assignments)
        
        return f'''
        INSERT INTO {vertex_type} (PRIMARY_ID, {attr_clause})
        VALUES ("{vertex_id}", {attr_clause})
        '''
    
    async def _migrate_edges(self, vector_data: Dict[str, Any]) -> bool:
        """Create edges/relationships between vertices"""
        try:
            logger.info("Creating edges from document relationships...")
            
            # Extract relationships from metadata
            relationships = self._extract_relationships(vector_data)
            
            # Create edges in batches
            batches = [relationships[i:i + self.config.batch_size] 
                      for i in range(0, len(relationships), self.config.batch_size)]
            
            for batch_idx, batch in enumerate(batches):
                logger.info(f"Processing edge batch {batch_idx + 1}/{len(batches)}")
                
                for relationship in batch:
                    try:
                        await self._create_edge(relationship)
                        self.progress.successful_items += 1
                    except Exception as e:
                        self.progress.failed_items += 1
                        self.progress.errors.append(f"Edge creation failed: {e}")
                    
                    self.progress.processed_items += 1
            
            logger.info(f"✅ Edge migration completed")
            return True
            
        except Exception as e:
            logger.error(f"Edge migration failed: {e}")
            return False
    
    def _extract_relationships(self, vector_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract relationships from vector data"""
        relationships = []
        documents = vector_data.get("documents", [])
        
        # Create file-contains-function relationships
        for doc in documents:
            metadata = doc.get("metadata", {})
            doc_id = self._generate_vertex_id(doc)
            
            # File contains functions
            if "functions" in metadata:
                for func_info in metadata["functions"]:
                    func_id = self._generate_function_id(func_info, metadata.get("file_path", ""))
                    relationships.append({
                        "edge_type": EdgeType.CONTAINS.value,
                        "from_id": doc_id,
                        "to_id": func_id,
                        "attributes": {"relationship_type": "contains", "confidence": 1.0}
                    })
            
            # Function calls
            if "function_calls" in metadata:
                for call_info in metadata["function_calls"]:
                    relationships.append({
                        "edge_type": EdgeType.CALLS.value,
                        "from_id": call_info["caller_id"],
                        "to_id": call_info["callee_id"],
                        "attributes": {
                            "call_count": call_info.get("count", 1),
                            "call_type": call_info.get("type", "direct"),
                            "line_number": call_info.get("line_number", 0)
                        }
                    })
        
        return relationships
    
    def _generate_function_id(self, func_info: Dict[str, Any], file_path: str) -> str:
        """Generate function ID from function info"""
        func_name = func_info.get("name", "unknown")
        signature = func_info.get("signature", "")
        id_source = f"{file_path}_{func_name}_{signature}"
        return hashlib.md5(id_source.encode()).hexdigest()
    
    async def _create_edge(self, relationship: Dict[str, Any]) -> bool:
        """Create an edge in the graph"""
        edge_type = relationship["edge_type"]
        from_id = relationship["from_id"]
        to_id = relationship["to_id"]
        attributes = relationship.get("attributes", {})
        
        # Build edge insert statement
        attr_assignments = []
        for key, value in attributes.items():
            if isinstance(value, str):
                attr_assignments.append(f'{key} = "{value}"')
            else:
                attr_assignments.append(f'{key} = {value}')
        
        attr_clause = f"({', '.join(attr_assignments)})" if attr_assignments else ""
        
        gsql_statement = f'''
        INSERT INTO {edge_type} (FROM, TO {attr_clause})
        VALUES ("{from_id}", "{to_id}" {attr_clause})
        '''
        
        result = await self.client.execute_query(gsql_statement)
        
        if not result.success:
            raise Exception(f"Failed to create edge: {result.error}")
        
        return True
    
    async def _compute_similarities(self) -> bool:
        """Compute and create similarity edges"""
        try:
            logger.info("Computing similarity relationships...")
            
            # Get all functions with embeddings
            functions_query = """
            SELECT f FROM Function:f
            WHERE f.embedding IS NOT NULL
            """
            
            result = await self.client.execute_query(functions_query)
            
            if not result.success:
                logger.error(f"Failed to fetch functions: {result.error}")
                return False
            
            functions = result.data if isinstance(result.data, list) else [result.data]
            
            # Compute pairwise similarities
            similarity_count = 0
            for i, func1 in enumerate(functions):
                for func2 in functions[i+1:]:
                    similarity = self._compute_cosine_similarity(
                        func1.get("embedding", []),
                        func2.get("embedding", [])
                    )
                    
                    if similarity >= self.config.similarity_threshold:
                        await self._create_similarity_edge(func1["id"], func2["id"], similarity)
                        similarity_count += 1
            
            logger.info(f"✅ Created {similarity_count} similarity relationships")
            return True
            
        except Exception as e:
            logger.error(f"Similarity computation failed: {e}")
            return False
    
    def _compute_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two vectors"""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    async def _create_similarity_edge(self, func1_id: str, func2_id: str, similarity: float):
        """Create similarity edge between functions"""
        gsql_statement = f'''
        INSERT INTO SimilarTo (FROM, TO, similarity_score, similarity_type, algorithm)
        VALUES ("{func1_id}", "{func2_id}", {similarity}, "cosine", "embedding")
        '''
        
        result = await self.client.execute_query(gsql_statement)
        
        if not result.success:
            logger.warning(f"Failed to create similarity edge: {result.error}")
    
    async def _validate_migration(self) -> bool:
        """Validate the migrated data"""
        try:
            logger.info("Validating migration...")
            
            # Get graph statistics
            stats = await self.client.get_graph_stats()
            
            validation_results = {
                "vertex_count": stats.get("vertex_count", 0),
                "edge_count": stats.get("edge_count", 0),
                "has_data": stats.get("vertex_count", 0) > 0,
                "connectivity": stats.get("edge_count", 0) > 0
            }
            
            logger.info(f"📊 Migration validation: {validation_results}")
            
            return validation_results["has_data"] and validation_results["connectivity"]
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False
    
    async def _save_checkpoint(self):
        """Save migration progress checkpoint"""
        try:
            checkpoint_data = {
                "progress": {
                    "total_items": self.progress.total_items,
                    "processed_items": self.progress.processed_items,
                    "successful_items": self.progress.successful_items,
                    "failed_items": self.progress.failed_items,
                    "current_phase": self.progress.current_phase
                },
                "timestamp": time.time()
            }
            
            with open(self.checkpoint_file, 'w') as f:
                json.dump(checkpoint_data, f, indent=2)
                
        except Exception as e:
            logger.warning(f"Failed to save checkpoint: {e}")
    
    def get_migration_status(self) -> Dict[str, Any]:
        """Get current migration status"""
        elapsed_time = time.time() - self.progress.start_time if self.progress.start_time > 0 else 0
        
        return {
            "phase": self.progress.current_phase,
            "progress_percent": (self.progress.processed_items / max(self.progress.total_items, 1)) * 100,
            "processed": self.progress.processed_items,
            "total": self.progress.total_items,
            "successful": self.progress.successful_items,
            "failed": self.progress.failed_items,
            "elapsed_time": elapsed_time,
            "errors": self.progress.errors[-10:] if self.progress.errors else []  # Last 10 errors
        }