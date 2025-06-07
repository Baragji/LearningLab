#!/usr/bin/env python3
"""
Graph Analytics Service
FastAPI service for TigerGraph analytics and RAG integration
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from .tigergraph_client import TigerGraphClient, GraphConfig
from .query_engine import GraphQueryEngine, QueryType
from .rag_integration import GraphEnhancedRAG, RAGContext, RAGQueryType, RAGResponse
from .schema_manager import GraphSchemaManager
from .data_migrator import VectorToGraphMigrator, MigrationConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for services
graph_client: Optional[TigerGraphClient] = None
query_engine: Optional[GraphQueryEngine] = None
rag_system: Optional[GraphEnhancedRAG] = None
schema_manager: Optional[GraphSchemaManager] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Starting Graph Analytics Service...")
    
    global graph_client, query_engine, rag_system, schema_manager
    
    try:
        # Initialize TigerGraph connection
        config = GraphConfig(
            host="tigergraph",  # Docker service name
            port=14240,
            username="tigergraph",
            password="tigergraph123",
            graph_name="RAGKnowledgeGraph"
        )
        
        graph_client = TigerGraphClient(config)
        await graph_client.connect()
        
        # Initialize components
        schema_manager = GraphSchemaManager(graph_client)
        query_engine = GraphQueryEngine(graph_client)
        rag_system = GraphEnhancedRAG(graph_client)
        
        logger.info("✅ Graph Analytics Service started successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to start service: {e}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Graph Analytics Service...")
    if graph_client:
        await graph_client.disconnect()

# Create FastAPI app
app = FastAPI(
    title="Graph Analytics Service",
    description="TigerGraph-based analytics and RAG service for code assistance",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class HealthResponse(BaseModel):
    status: str
    timestamp: float
    version: str
    components: Dict[str, Any]

class QueryRequest(BaseModel):
    query: str
    query_type: str
    parameters: Optional[Dict[str, Any]] = {}
    limit: int = Field(default=10, ge=1, le=100)

class QueryResponse(BaseModel):
    success: bool
    data: Any
    execution_time: float
    metadata: Optional[Dict[str, Any]] = None

class RAGQueryRequest(BaseModel):
    query: str
    query_type: str
    user_context: Dict[str, Any] = {}
    max_results: int = Field(default=10, ge=1, le=50)
    include_explanations: bool = True

class SimilaritySearchRequest(BaseModel):
    target_id: str
    threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    limit: int = Field(default=10, ge=1, le=50)

class SemanticSearchRequest(BaseModel):
    query_embedding: List[float]
    vertex_types: Optional[List[str]] = None
    threshold: float = Field(default=0.8, ge=0.0, le=1.0)
    limit: int = Field(default=10, ge=1, le=50)

class MigrationRequest(BaseModel):
    vector_data: Dict[str, Any]
    config: Optional[Dict[str, Any]] = {}

# Dependency injection
async def get_graph_client() -> TigerGraphClient:
    if not graph_client:
        raise HTTPException(status_code=503, detail="Graph client not available")
    return graph_client

async def get_query_engine() -> GraphQueryEngine:
    if not query_engine:
        raise HTTPException(status_code=503, detail="Query engine not available")
    return query_engine

async def get_rag_system() -> GraphEnhancedRAG:
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system not available")
    return rag_system

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        components = {}
        
        # Check graph client
        if graph_client:
            graph_health = await graph_client.health_check()
            components["graph_client"] = graph_health
        else:
            components["graph_client"] = {"status": "unavailable"}
        
        # Check query engine
        if query_engine:
            components["query_engine"] = {"status": "healthy", "stats": query_engine.get_query_stats()}
        else:
            components["query_engine"] = {"status": "unavailable"}
        
        # Check RAG system
        if rag_system:
            rag_stats = await rag_system.get_system_stats()
            components["rag_system"] = {"status": "healthy", "stats": rag_stats}
        else:
            components["rag_system"] = {"status": "unavailable"}
        
        # Overall status
        overall_status = "healthy" if all(
            comp.get("status") == "healthy" for comp in components.values()
        ) else "degraded"
        
        return HealthResponse(
            status=overall_status,
            timestamp=time.time(),
            version="1.0.0",
            components=components
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# Graph query endpoints
@app.post("/query/execute", response_model=QueryResponse)
async def execute_query(
    request: QueryRequest,
    client: TigerGraphClient = Depends(get_graph_client)
):
    """Execute custom GSQL query"""
    try:
        start_time = time.time()
        
        result = await client.execute_query(request.query, request.parameters)
        
        return QueryResponse(
            success=result.success,
            data=result.data,
            execution_time=time.time() - start_time,
            metadata={"error": result.error} if result.error else None
        )
        
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")

@app.post("/query/similarity", response_model=QueryResponse)
async def similarity_search(
    request: SimilaritySearchRequest,
    engine: GraphQueryEngine = Depends(get_query_engine)
):
    """Find similar functions/code elements"""
    try:
        result = await engine.similarity_search(
            request.target_id,
            request.threshold,
            request.limit
        )
        
        return QueryResponse(
            success=True,
            data={
                "query_id": result.query_id,
                "results": result.results,
                "total_results": result.total_results,
                "query_type": result.query_type.value
            },
            execution_time=result.execution_time,
            metadata=result.metadata
        )
        
    except Exception as e:
        logger.error(f"Similarity search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Similarity search failed: {str(e)}")

@app.post("/query/semantic", response_model=QueryResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    engine: GraphQueryEngine = Depends(get_query_engine)
):
    """Semantic search using embeddings"""
    try:
        result = await engine.semantic_search(
            request.query_embedding,
            request.vertex_types,
            request.threshold,
            request.limit
        )
        
        return QueryResponse(
            success=True,
            data={
                "query_id": result.query_id,
                "results": result.results,
                "total_results": result.total_results,
                "query_type": result.query_type.value
            },
            execution_time=result.execution_time,
            metadata=result.metadata
        )
        
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

@app.get("/query/dependencies/{function_id}")
async def dependency_analysis(
    function_id: str,
    depth: int = 2,
    engine: GraphQueryEngine = Depends(get_query_engine)
):
    """Analyze function dependencies"""
    try:
        result = await engine.find_dependencies(function_id, depth)
        
        return QueryResponse(
            success=True,
            data={
                "query_id": result.query_id,
                "dependencies": result.results,
                "total_dependencies": result.total_results,
                "analysis_depth": depth
            },
            execution_time=result.execution_time,
            metadata=result.metadata
        )
        
    except Exception as e:
        logger.error(f"Dependency analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Dependency analysis failed: {str(e)}")

@app.get("/query/neighborhood/{vertex_id}")
async def get_neighborhood(
    vertex_id: str,
    hops: int = 2,
    vertex_types: Optional[str] = None,
    engine: GraphQueryEngine = Depends(get_query_engine)
):
    """Get vertex neighborhood"""
    try:
        types_list = vertex_types.split(",") if vertex_types else None
        
        result = await engine.get_neighborhood(vertex_id, hops, types_list)
        
        return QueryResponse(
            success=True,
            data={
                "query_id": result.query_id,
                "neighborhood": result.results,
                "total_vertices": result.total_results,
                "hops": hops
            },
            execution_time=result.execution_time,
            metadata=result.metadata
        )
        
    except Exception as e:
        logger.error(f"Neighborhood query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Neighborhood query failed: {str(e)}")

@app.post("/query/recommend/{context_id}")
async def code_recommendation(
    context_id: str,
    task_type: str = "similar",
    limit: int = 5,
    engine: GraphQueryEngine = Depends(get_query_engine)
):
    """Get code recommendations"""
    try:
        result = await engine.recommend_code(context_id, task_type, limit)
        
        return QueryResponse(
            success=True,
            data={
                "query_id": result.query_id,
                "recommendations": result.results,
                "total_recommendations": result.total_results,
                "context_id": context_id,
                "task_type": task_type
            },
            execution_time=result.execution_time,
            metadata=result.metadata
        )
        
    except Exception as e:
        logger.error(f"Code recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Code recommendation failed: {str(e)}")

# RAG endpoints
@app.post("/rag/query")
async def rag_query(
    request: RAGQueryRequest,
    rag: GraphEnhancedRAG = Depends(get_rag_system)
):
    """Enhanced RAG query with graph context"""
    try:
        # Convert string query type to enum
        try:
            query_type = RAGQueryType(request.query_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid query type: {request.query_type}")
        
        # Create RAG context
        context = RAGContext(
            query=request.query,
            query_type=query_type,
            user_context=request.user_context,
            max_results=request.max_results,
            include_explanations=request.include_explanations
        )
        
        # Execute RAG query
        response = await rag.query(context)
        
        return {
            "answer": response.answer,
            "confidence": response.confidence,
            "sources": response.sources,
            "graph_insights": response.graph_insights,
            "execution_time": response.execution_time,
            "query_type": response.query_type.value,
            "metadata": response.metadata
        }
        
    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

# Data management endpoints
@app.post("/data/migrate")
async def migrate_data(
    request: MigrationRequest,
    background_tasks: BackgroundTasks,
    client: TigerGraphClient = Depends(get_graph_client)
):
    """Migrate data from vector database to graph"""
    try:
        # Create migration config
        config = MigrationConfig(**request.config) if request.config else MigrationConfig()
        
        # Create migrator
        migrator = VectorToGraphMigrator(client, schema_manager, config)
        
        # Start migration in background
        background_tasks.add_task(migrator.migrate_from_vector_db, request.vector_data)
        
        return {
            "message": "Migration started",
            "migration_id": f"migration_{int(time.time())}",
            "status": "in_progress"
        }
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

@app.get("/data/migration/status")
async def migration_status():
    """Get migration status"""
    # This would need to be implemented with proper state management
    return {
        "status": "not_implemented",
        "message": "Migration status tracking not yet implemented"
    }

@app.post("/schema/create")
async def create_schema():
    """Create graph schema"""
    try:
        if not schema_manager:
            raise HTTPException(status_code=503, detail="Schema manager not available")
        
        success = await schema_manager.create_schema()
        
        if success:
            return {"message": "Schema created successfully", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Schema creation failed")
            
    except Exception as e:
        logger.error(f"Schema creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Schema creation failed: {str(e)}")

@app.get("/schema/stats")
async def schema_stats():
    """Get schema statistics"""
    try:
        if not schema_manager:
            raise HTTPException(status_code=503, detail="Schema manager not available")
        
        stats = await schema_manager.get_schema_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Schema stats failed: {e}")
        raise HTTPException(status_code=500, detail=f"Schema stats failed: {str(e)}")

@app.get("/stats")
async def system_stats():
    """Get comprehensive system statistics"""
    try:
        stats = {}
        
        # Graph stats
        if graph_client:
            stats["graph"] = await graph_client.get_graph_stats()
        
        # Query engine stats
        if query_engine:
            stats["query_engine"] = query_engine.get_query_stats()
        
        # RAG system stats
        if rag_system:
            stats["rag_system"] = await rag_system.get_system_stats()
        
        # Schema stats
        if schema_manager:
            stats["schema"] = await schema_manager.get_schema_stats()
        
        return stats
        
    except Exception as e:
        logger.error(f"System stats failed: {e}")
        raise HTTPException(status_code=500, detail=f"System stats failed: {str(e)}")

# Development endpoints
@app.get("/dev/query-types")
async def get_query_types():
    """Get available query types"""
    return {
        "graph_query_types": [qt.value for qt in QueryType],
        "rag_query_types": [qt.value for qt in RAGQueryType]
    }

@app.get("/dev/templates")
async def get_query_templates():
    """Get available query templates"""
    if not query_engine:
        raise HTTPException(status_code=503, detail="Query engine not available")
    
    return {
        "templates": list(query_engine.query_templates.keys()),
        "count": len(query_engine.query_templates)
    }

if __name__ == "__main__":
    uvicorn.run(
        "analytics_service:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    )