"""
Data Migrator Module

This module provides tools for migrating data between vector stores and graph databases,
enabling hybrid retrieval approaches that combine the benefits of both paradigms.
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass

from .tigergraph_client import TigerGraphClient

logger = logging.getLogger(__name__)

@dataclass
class MigrationStats:
    """Statistics from a data migration operation"""
    documents_processed: int = 0
    chunks_processed: int = 0
    nodes_created: int = 0
    edges_created: int = 0
    errors: int = 0
    warnings: int = 0
    elapsed_time_seconds: float = 0.0

class VectorToGraphMigrator:
    """
    Utility for migrating data from vector stores to graph databases.
    
    This class provides methods to:
    1. Extract data from vector stores
    2. Transform it into graph structures
    3. Load it into a graph database
    """
    
    def __init__(self, graph_client: TigerGraphClient):
        """
        Initialize the migrator with a graph client.
        
        Args:
            graph_client: A configured TigerGraphClient
        """
        self.graph_client = graph_client
        
    async def migrate_from_chroma(self, 
                                 chroma_client, 
                                 collection_name: str,
                                 batch_size: int = 1000) -> MigrationStats:
        """
        Migrate data from ChromaDB to TigerGraph.
        
        Args:
            chroma_client: A ChromaDB client instance
            collection_name: Name of the ChromaDB collection to migrate
            batch_size: Number of documents to process in each batch
            
        Returns:
            MigrationStats with details about the migration
        """
        logger.info(f"Starting migration from ChromaDB collection {collection_name} to TigerGraph")
        
        stats = MigrationStats()
        import time
        start_time = time.time()
        
        try:
            # Get collection
            collection = chroma_client.get_collection(collection_name)
            
            # Get all documents
            results = collection.get(include=["documents", "metadatas", "embeddings"])
            
            documents = results["documents"]
            metadatas = results["metadatas"]
            embeddings = results["embeddings"]
            
            stats.documents_processed = len(documents)
            logger.info(f"Found {stats.documents_processed} documents to migrate")
            
            # Process in batches
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i+batch_size]
                batch_meta = metadatas[i:i+batch_size]
                batch_embeddings = embeddings[i:i+batch_size]
                
                # Transform and load batch
                nodes_created, edges_created = await self._process_batch(
                    batch_docs, batch_meta, batch_embeddings
                )
                
                stats.nodes_created += nodes_created
                stats.edges_created += edges_created
                stats.chunks_processed += len(batch_docs)
                
                logger.info(f"Processed batch {i//batch_size + 1}, "
                           f"created {nodes_created} nodes and {edges_created} edges")
            
            stats.elapsed_time_seconds = time.time() - start_time
            logger.info(f"Migration completed in {stats.elapsed_time_seconds:.2f}s")
            logger.info(f"Created {stats.nodes_created} nodes and {stats.edges_created} edges in total")
            
            return stats
            
        except Exception as e:
            stats.errors += 1
            stats.elapsed_time_seconds = time.time() - start_time
            logger.error(f"Migration failed: {str(e)}")
            raise
    
    async def _process_batch(self, 
                           documents: List[str], 
                           metadatas: List[Dict[str, Any]], 
                           embeddings: List[List[float]]) -> tuple[int, int]:
        """
        Process a batch of documents, transforming them into graph nodes and edges.
        
        Args:
            documents: List of document texts
            metadatas: List of document metadata
            embeddings: List of embedding vectors
            
        Returns:
            Tuple of (nodes_created, edges_created)
        """
        # Extract entities and concepts from documents
        entity_maps = await self._extract_entities(documents, metadatas)
        
        # Create nodes for documents, entities, and concepts
        nodes_created = await self._create_nodes(documents, metadatas, embeddings, entity_maps)
        
        # Create edges between nodes
        edges_created = await self._create_edges(documents, metadatas, entity_maps)
        
        return nodes_created, edges_created
    
    async def _extract_entities(self, 
                              documents: List[str], 
                              metadatas: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract entities and concepts from documents.
        
        Args:
            documents: List of document texts
            metadatas: List of document metadata
            
        Returns:
            List of entity maps, one per document
        """
        # This is a placeholder implementation
        # In a real implementation, you would use NER, concept extraction, etc.
        entity_maps = []
        
        for i, doc in enumerate(documents):
            # Simple word-based entity extraction
            words = doc.split()
            entities = []
            
            # Extract document title if available
            title = metadatas[i].get("title", f"Document {i}")
            
            # Extract keywords if available
            keywords = metadatas[i].get("keywords", [])
            if isinstance(keywords, str):
                keywords = [k.strip() for k in keywords.split(",")]
            
            # Use top 5 longest words as simple entities
            words = [w for w in words if len(w) > 5]
            words.sort(key=len, reverse=True)
            word_entities = words[:5]
            
            # Combine all entities
            all_entities = list(set(word_entities + keywords))
            
            entity_maps.append({
                "doc_id": metadatas[i].get("id", f"doc_{i}"),
                "title": title,
                "entities": all_entities
            })
        
        return entity_maps
    
    async def _create_nodes(self, 
                          documents: List[str], 
                          metadatas: List[Dict[str, Any]], 
                          embeddings: List[List[float]],
                          entity_maps: List[Dict[str, Any]]) -> int:
        """
        Create nodes in the graph database.
        
        Args:
            documents: List of document texts
            metadatas: List of document metadata
            embeddings: List of embedding vectors
            entity_maps: List of entity maps extracted from documents
            
        Returns:
            Number of nodes created
        """
        # Create document nodes
        doc_vertices = []
        for i, doc in enumerate(documents):
            # Prepare document node
            doc_id = metadatas[i].get("id", f"doc_{i}")
            title = metadatas[i].get("title", f"Document {i}")
            source = metadatas[i].get("source", "unknown")
            
            # Truncate embedding for storage (first 10 dimensions)
            # In a real implementation, you might use dimension reduction
            embedding_sample = embeddings[i][:10] if embeddings[i] else []
            
            doc_vertex = {
                "id": doc_id,
                "title": title,
                "content": doc[:1000],  # Truncate content for storage
                "source": source,
                "embedding_sample": embedding_sample,
                "metadata": str(metadatas[i])  # Stringify metadata for storage
            }
            
            doc_vertices.append(doc_vertex)
        
        # Create entity nodes
        entity_vertices = []
        entity_set = set()
        
        for entity_map in entity_maps:
            for entity in entity_map["entities"]:
                if entity not in entity_set:
                    entity_set.add(entity)
                    entity_vertices.append({
                        "id": f"entity_{hash(entity) % 1000000}",
                        "name": entity,
                        "type": "keyword"  # Simple entity type
                    })
        
        # Use graph client to create nodes
        doc_count = await self.graph_client.upsert_vertices("Document", doc_vertices)
        entity_count = await self.graph_client.upsert_vertices("Entity", entity_vertices)
        
        return doc_count + entity_count
    
    async def _create_edges(self, 
                          documents: List[str], 
                          metadatas: List[Dict[str, Any]],
                          entity_maps: List[Dict[str, Any]]) -> int:
        """
        Create edges in the graph database.
        
        Args:
            documents: List of document texts
            metadatas: List of document metadata
            entity_maps: List of entity maps extracted from documents
            
        Returns:
            Number of edges created
        """
        # Create document-entity edges
        edges = []
        
        for i, entity_map in enumerate(entity_maps):
            doc_id = entity_map["doc_id"]
            
            for entity in entity_map["entities"]:
                entity_id = f"entity_{hash(entity) % 1000000}"
                
                edges.append({
                    "from_id": doc_id,
                    "to_id": entity_id,
                    "weight": 1.0  # Simple weight
                })
        
        # Use graph client to create edges
        edge_count = await self.graph_client.upsert_edges("CONTAINS", edges)
        
        return edge_count