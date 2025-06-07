#!/usr/bin/env python3
"""
Graph Query Engine for RAG Integration
Provides high-level query interface for knowledge graph operations
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from enum import Enum

from .tigergraph_client import TigerGraphClient, QueryResult
from .schema_manager import VertexType, EdgeType

logger = logging.getLogger(__name__)

class QueryType(Enum):
    """Types of graph queries"""
    SIMILARITY_SEARCH = "similarity_search"
    SEMANTIC_SEARCH = "semantic_search"
    PATTERN_MATCH = "pattern_match"
    PATH_FINDING = "path_finding"
    NEIGHBORHOOD = "neighborhood"
    AGGREGATION = "aggregation"
    RECOMMENDATION = "recommendation"

@dataclass
class SearchQuery:
    """Search query specification"""
    query_type: QueryType
    parameters: Dict[str, Any]
    limit: int = 10
    timeout: int = 30
    include_embeddings: bool = False

@dataclass
class GraphSearchResult:
    """Graph search result"""
    query_id: str
    query_type: QueryType
    results: List[Dict[str, Any]]
    execution_time: float
    total_results: int
    has_more: bool = False
    metadata: Optional[Dict[str, Any]] = None

class GraphQueryEngine:
    """
    High-level query engine for graph-based RAG operations
    Provides semantic search, pattern matching, and graph analytics
    """
    
    def __init__(self, client: TigerGraphClient):
        self.client = client
        self.query_templates = self._initialize_query_templates()
        self.query_cache: Dict[str, Any] = {}
        
    def _initialize_query_templates(self) -> Dict[str, str]:
        """Initialize GSQL query templates"""
        return {
            # Similarity search for functions
            "function_similarity": """
            CREATE QUERY function_similarity(STRING target_function_id, FLOAT threshold = 0.7, INT limit = 10) FOR GRAPH RAGKnowledgeGraph {
                
                SumAccum<FLOAT> @similarity_score;
                SetAccum<VERTEX<Function>> @@similar_functions;
                
                Start = {Function.*};
                
                Target = SELECT f FROM Start:f 
                         WHERE f.id == target_function_id;
                
                Similar = SELECT s FROM Start:s -(SimilarTo:e)- Target:t
                         WHERE e.similarity_score >= threshold
                         ACCUM s.@similarity_score = e.similarity_score
                         ORDER BY s.@similarity_score DESC
                         LIMIT limit;
                
                PRINT Similar[Similar.id, Similar.function_name, Similar.@similarity_score];
            }
            """,
            
            # Semantic search using embeddings
            "semantic_search": """
            CREATE QUERY semantic_search(STRING query_embedding, STRING vertex_type = "Function", 
                                        FLOAT threshold = 0.8, INT limit = 10) FOR GRAPH RAGKnowledgeGraph {
                
                SumAccum<FLOAT> @cosine_similarity;
                
                Start = {Function.*} UNION {CodeFile.*} UNION {Documentation.*};
                
                Results = SELECT v FROM Start:v
                         WHERE vertex_type == "ALL" OR v.type == vertex_type
                         ACCUM v.@cosine_similarity = cosine_similarity(v.embedding, query_embedding)
                         HAVING v.@cosine_similarity >= threshold
                         ORDER BY v.@cosine_similarity DESC
                         LIMIT limit;
                
                PRINT Results[Results.id, Results.@cosine_similarity];
            }
            """,
            
            # Find code dependencies
            "dependency_analysis": """
            CREATE QUERY dependency_analysis(STRING function_id, INT depth = 2) FOR GRAPH RAGKnowledgeGraph {
                
                OrAccum @visited;
                SetAccum<VERTEX> @@dependencies;
                
                Start = {Function.*};
                Current = SELECT f FROM Start:f WHERE f.id == function_id;
                
                WHILE Current.size() > 0 AND depth > 0 DO
                    Current = SELECT t FROM Current:s -(Calls|Uses:e)- :t
                             WHERE t.@visited == FALSE
                             ACCUM t.@visited = TRUE,
                                   @@dependencies += t
                             POST-ACCUM s.@visited = TRUE;
                    depth = depth - 1;
                END;
                
                PRINT @@dependencies;
            }
            """,
            
            # Find similar code patterns
            "pattern_search": """
            CREATE QUERY pattern_search(STRING pattern_type, STRING language = "python", 
                                       INT limit = 20) FOR GRAPH RAGKnowledgeGraph {
                
                Start = {Function.*};
                
                Matches = SELECT f FROM Start:f -(Contains)- CodeFile:cf
                         WHERE cf.language == language
                         AND f.signature LIKE "%" + pattern_type + "%"
                         ORDER BY f.complexity ASC
                         LIMIT limit;
                
                PRINT Matches[Matches.id, Matches.function_name, Matches.signature];
            }
            """,
            
            # Get function neighborhood
            "function_neighborhood": """
            CREATE QUERY function_neighborhood(STRING function_id, INT hops = 2) FOR GRAPH RAGKnowledgeGraph {
                
                SetAccum<VERTEX> @@neighborhood;
                OrAccum @visited;
                
                Start = {Function.*};
                Current = SELECT f FROM Start:f WHERE f.id == function_id;
                
                WHILE Current.size() > 0 AND hops > 0 DO
                    Current = SELECT t FROM Current:s -(:e)- :t
                             WHERE t.@visited == FALSE
                             ACCUM t.@visited = TRUE,
                                   @@neighborhood += t,
                                   @@neighborhood += s;
                    hops = hops - 1;
                END;
                
                PRINT @@neighborhood;
            }
            """,
            
            # Code recommendation based on context
            "code_recommendation": """
            CREATE QUERY code_recommendation(STRING context_function_id, STRING task_type = "similar", 
                                            INT limit = 5) FOR GRAPH RAGKnowledgeGraph {
                
                SumAccum<FLOAT> @relevance_score;
                
                Start = {Function.*};
                Context = SELECT f FROM Start:f WHERE f.id == context_function_id;
                
                // Find functions with similar patterns
                Candidates = SELECT t FROM Context:s -(SimilarTo:e1)- Function:t
                            ACCUM t.@relevance_score += e1.similarity_score * 0.6;
                
                // Add functions that use similar dependencies
                Candidates = SELECT t FROM Context:s -(Uses)- Dependency:d -(Uses)- Function:t
                            WHERE t != s
                            ACCUM t.@relevance_score += 0.3;
                
                // Add functions from same file
                Candidates = SELECT t FROM Context:s -(<Contains)- CodeFile:cf -(Contains)- Function:t
                            WHERE t != s
                            ACCUM t.@relevance_score += 0.1;
                
                Results = SELECT c FROM Candidates:c
                         WHERE c.@relevance_score > 0
                         ORDER BY c.@relevance_score DESC
                         LIMIT limit;
                
                PRINT Results[Results.id, Results.function_name, Results.@relevance_score];
            }
            """
        }
    
    async def similarity_search(self, target_id: str, threshold: float = 0.7, 
                               limit: int = 10) -> GraphSearchResult:
        """Find similar functions/code elements"""
        query_id = f"sim_search_{target_id}_{int(time.time())}"
        
        try:
            # Use pre-compiled query if available, otherwise execute ad-hoc
            if "function_similarity" in self.query_templates:
                result = await self.client.execute_query(
                    "function_similarity",
                    {
                        "target_function_id": target_id,
                        "threshold": threshold,
                        "limit": limit
                    }
                )
            else:
                # Fallback to direct GSQL
                gsql_query = f"""
                SELECT s FROM Function:s -(SimilarTo:e)- Function:t
                WHERE t.id == "{target_id}" AND e.similarity_score >= {threshold}
                ORDER BY e.similarity_score DESC
                LIMIT {limit}
                """
                result = await self.client.execute_query(gsql_query)
            
            if result.success:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.SIMILARITY_SEARCH,
                    results=result.data if isinstance(result.data, list) else [result.data],
                    execution_time=result.execution_time,
                    total_results=len(result.data) if isinstance(result.data, list) else 1
                )
            else:
                logger.error(f"Similarity search failed: {result.error}")
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.SIMILARITY_SEARCH,
                    results=[],
                    execution_time=result.execution_time,
                    total_results=0,
                    metadata={"error": result.error}
                )
                
        except Exception as e:
            logger.error(f"Similarity search error: {e}")
            return GraphSearchResult(
                query_id=query_id,
                query_type=QueryType.SIMILARITY_SEARCH,
                results=[],
                execution_time=0.0,
                total_results=0,
                metadata={"error": str(e)}
            )
    
    async def semantic_search(self, query_embedding: List[float], vertex_types: List[str] = None,
                             threshold: float = 0.8, limit: int = 10) -> GraphSearchResult:
        """Semantic search using embeddings"""
        query_id = f"semantic_search_{int(time.time())}"
        
        try:
            # Build vertex type filter
            vertex_filter = vertex_types or ["Function", "CodeFile", "Documentation"]
            
            # Execute semantic search
            gsql_query = f"""
            SELECT v FROM {{Function.*}} UNION {{CodeFile.*}} UNION {{Documentation.*}}:v
            WHERE v.embedding IS NOT NULL
            AND cosine_similarity(v.embedding, {query_embedding}) >= {threshold}
            ORDER BY cosine_similarity(v.embedding, {query_embedding}) DESC
            LIMIT {limit}
            """
            
            result = await self.client.execute_query(gsql_query)
            
            if result.success:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.SEMANTIC_SEARCH,
                    results=result.data if isinstance(result.data, list) else [result.data],
                    execution_time=result.execution_time,
                    total_results=len(result.data) if isinstance(result.data, list) else 1
                )
            else:
                logger.error(f"Semantic search failed: {result.error}")
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.SEMANTIC_SEARCH,
                    results=[],
                    execution_time=result.execution_time,
                    total_results=0,
                    metadata={"error": result.error}
                )
                
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return GraphSearchResult(
                query_id=query_id,
                query_type=QueryType.SEMANTIC_SEARCH,
                results=[],
                execution_time=0.0,
                total_results=0,
                metadata={"error": str(e)}
            )
    
    async def find_dependencies(self, function_id: str, depth: int = 2) -> GraphSearchResult:
        """Find function dependencies and call chains"""
        query_id = f"deps_{function_id}_{int(time.time())}"
        
        try:
            gsql_query = f"""
            SELECT t FROM Function:s -(Calls|Uses){{1,{depth}}}:e- :t
            WHERE s.id == "{function_id}"
            """
            
            result = await self.client.execute_query(gsql_query)
            
            if result.success:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.PATH_FINDING,
                    results=result.data if isinstance(result.data, list) else [result.data],
                    execution_time=result.execution_time,
                    total_results=len(result.data) if isinstance(result.data, list) else 1
                )
            else:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.PATH_FINDING,
                    results=[],
                    execution_time=result.execution_time,
                    total_results=0,
                    metadata={"error": result.error}
                )
                
        except Exception as e:
            logger.error(f"Dependency search error: {e}")
            return GraphSearchResult(
                query_id=query_id,
                query_type=QueryType.PATH_FINDING,
                results=[],
                execution_time=0.0,
                total_results=0,
                metadata={"error": str(e)}
            )
    
    async def get_neighborhood(self, vertex_id: str, hops: int = 2, 
                              vertex_types: List[str] = None) -> GraphSearchResult:
        """Get neighborhood around a vertex"""
        query_id = f"neighborhood_{vertex_id}_{int(time.time())}"
        
        try:
            # Build type filter if specified
            type_filter = ""
            if vertex_types:
                type_filter = f"AND t.type IN {vertex_types}"
            
            gsql_query = f"""
            SELECT t FROM :s -(:e){{1,{hops}}}- :t
            WHERE s.id == "{vertex_id}" {type_filter}
            """
            
            result = await self.client.execute_query(gsql_query)
            
            if result.success:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.NEIGHBORHOOD,
                    results=result.data if isinstance(result.data, list) else [result.data],
                    execution_time=result.execution_time,
                    total_results=len(result.data) if isinstance(result.data, list) else 1
                )
            else:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.NEIGHBORHOOD,
                    results=[],
                    execution_time=result.execution_time,
                    total_results=0,
                    metadata={"error": result.error}
                )
                
        except Exception as e:
            logger.error(f"Neighborhood search error: {e}")
            return GraphSearchResult(
                query_id=query_id,
                query_type=QueryType.NEIGHBORHOOD,
                results=[],
                execution_time=0.0,
                total_results=0,
                metadata={"error": str(e)}
            )
    
    async def recommend_code(self, context_id: str, task_type: str = "similar", 
                            limit: int = 5) -> GraphSearchResult:
        """Get code recommendations based on context"""
        query_id = f"recommend_{context_id}_{int(time.time())}"
        
        try:
            # Multi-factor recommendation query
            gsql_query = f"""
            SELECT t, SUM(score) as relevance_score FROM (
                SELECT t, 0.6 as score FROM Function:s -(SimilarTo:e)- Function:t
                WHERE s.id == "{context_id}"
                UNION ALL
                SELECT t, 0.3 as score FROM Function:s -(Uses)- Dependency:d -(Uses)- Function:t
                WHERE s.id == "{context_id}" AND t.id != "{context_id}"
                UNION ALL
                SELECT t, 0.1 as score FROM Function:s -(<Contains)- CodeFile:cf -(Contains)- Function:t
                WHERE s.id == "{context_id}" AND t.id != "{context_id}"
            )
            GROUP BY t
            ORDER BY relevance_score DESC
            LIMIT {limit}
            """
            
            result = await self.client.execute_query(gsql_query)
            
            if result.success:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.RECOMMENDATION,
                    results=result.data if isinstance(result.data, list) else [result.data],
                    execution_time=result.execution_time,
                    total_results=len(result.data) if isinstance(result.data, list) else 1
                )
            else:
                return GraphSearchResult(
                    query_id=query_id,
                    query_type=QueryType.RECOMMENDATION,
                    results=[],
                    execution_time=result.execution_time,
                    total_results=0,
                    metadata={"error": result.error}
                )
                
        except Exception as e:
            logger.error(f"Code recommendation error: {e}")
            return GraphSearchResult(
                query_id=query_id,
                query_type=QueryType.RECOMMENDATION,
                results=[],
                execution_time=0.0,
                total_results=0,
                metadata={"error": str(e)}
            )
    
    async def execute_custom_query(self, gsql_query: str, parameters: Dict[str, Any] = None) -> GraphSearchResult:
        """Execute custom GSQL query"""
        query_id = f"custom_{int(time.time())}"
        
        try:
            result = await self.client.execute_query(gsql_query, parameters)
            
            return GraphSearchResult(
                query_id=query_id,
                query_type=QueryType.PATTERN_MATCH,
                results=result.data if isinstance(result.data, list) else [result.data],
                execution_time=result.execution_time,
                total_results=len(result.data) if isinstance(result.data, list) else 1,
                metadata={"custom_query": True}
            )
            
        except Exception as e:
            logger.error(f"Custom query error: {e}")
            return GraphSearchResult(
                query_id=query_id,
                query_type=QueryType.PATTERN_MATCH,
                results=[],
                execution_time=0.0,
                total_results=0,
                metadata={"error": str(e)}
            )
    
    def get_query_stats(self) -> Dict[str, Any]:
        """Get query engine statistics"""
        return {
            "available_templates": len(self.query_templates),
            "cache_size": len(self.query_cache),
            "supported_query_types": [qt.value for qt in QueryType],
            "template_names": list(self.query_templates.keys())
        }