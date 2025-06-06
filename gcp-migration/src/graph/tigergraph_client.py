#!/usr/bin/env python3
"""
TigerGraph Client for RAG Integration
Provides high-level interface to TigerGraph database
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import aiohttp
import pyTigerGraph as tg
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

@dataclass
class GraphConfig:
    """TigerGraph configuration"""
    host: str = "localhost"
    port: int = 14240
    username: str = "tigergraph"
    password: str = "tigergraph123"
    graph_name: str = "RAGKnowledgeGraph"
    version: str = "3.9.3"
    timeout: int = 30
    max_retries: int = 3

@dataclass
class QueryResult:
    """Graph query result wrapper"""
    success: bool
    data: Any
    execution_time: float
    vertex_count: int = 0
    edge_count: int = 0
    error: Optional[str] = None

class TigerGraphClient:
    """
    High-level TigerGraph client for RAG applications
    Provides async interface and connection management
    """
    
    def __init__(self, config: GraphConfig):
        self.config = config
        self.connection: Optional[tg.TigerGraphConnection] = None
        self.session: Optional[aiohttp.ClientSession] = None
        self.base_url = f"http://{config.host}:{config.port}"
        self._connected = False
        
    async def connect(self) -> bool:
        """Establish connection to TigerGraph"""
        try:
            logger.info(f"Connecting to TigerGraph at {self.config.host}:{self.config.port}")
            
            # Create synchronous connection for schema operations
            self.connection = tg.TigerGraphConnection(
                host=self.config.host,
                restppPort=self.config.port,
                username=self.config.username,
                password=self.config.password,
                graphname=self.config.graph_name,
                version=self.config.version
            )
            
            # Create async session for queries
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)
            
            # Test connection
            await self._test_connection()
            
            self._connected = True
            logger.info("✅ TigerGraph connection established")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to TigerGraph: {e}")
            return False
    
    async def disconnect(self):
        """Close TigerGraph connection"""
        if self.session:
            await self.session.close()
        self._connected = False
        logger.info("TigerGraph connection closed")
    
    async def _test_connection(self) -> bool:
        """Test TigerGraph connectivity"""
        try:
            url = urljoin(self.base_url, "/api/ping")
            async with self.session.get(url) as response:
                if response.status == 200:
                    return True
                else:
                    raise Exception(f"Ping failed with status {response.status}")
        except Exception as e:
            raise Exception(f"Connection test failed: {e}")
    
    async def execute_query(self, query: str, parameters: Optional[Dict] = None) -> QueryResult:
        """Execute GSQL query asynchronously"""
        if not self._connected:
            raise Exception("Not connected to TigerGraph")
        
        start_time = time.time()
        
        try:
            # Prepare query parameters
            params = parameters or {}
            
            # Execute query via REST API
            url = urljoin(self.base_url, f"/query/{self.config.graph_name}")
            
            async with self.session.post(url, json={
                "query": query,
                "parameters": params
            }) as response:
                
                if response.status == 200:
                    result_data = await response.json()
                    execution_time = time.time() - start_time
                    
                    return QueryResult(
                        success=True,
                        data=result_data,
                        execution_time=execution_time,
                        vertex_count=self._count_vertices(result_data),
                        edge_count=self._count_edges(result_data)
                    )
                else:
                    error_text = await response.text()
                    return QueryResult(
                        success=False,
                        data=None,
                        execution_time=time.time() - start_time,
                        error=f"Query failed: {error_text}"
                    )
                    
        except Exception as e:
            return QueryResult(
                success=False,
                data=None,
                execution_time=time.time() - start_time,
                error=str(e)
            )
    
    def _count_vertices(self, data: Any) -> int:
        """Count vertices in query result"""
        if isinstance(data, list):
            return sum(1 for item in data if isinstance(item, dict) and 'v_id' in item)
        elif isinstance(data, dict) and 'results' in data:
            return self._count_vertices(data['results'])
        return 0
    
    def _count_edges(self, data: Any) -> int:
        """Count edges in query result"""
        if isinstance(data, list):
            return sum(1 for item in data if isinstance(item, dict) and 'from_id' in item and 'to_id' in item)
        elif isinstance(data, dict) and 'results' in data:
            return self._count_edges(data['results'])
        return 0
    
    async def get_graph_stats(self) -> Dict[str, Any]:
        """Get graph statistics"""
        try:
            stats_query = """
            SELECT COUNT(*) as vertex_count FROM VERTEX()
            UNION ALL
            SELECT COUNT(*) as edge_count FROM EDGE()
            """
            
            result = await self.execute_query(stats_query)
            
            if result.success:
                return {
                    "connected": True,
                    "graph_name": self.config.graph_name,
                    "vertex_count": result.vertex_count,
                    "edge_count": result.edge_count,
                    "last_updated": time.time()
                }
            else:
                return {
                    "connected": False,
                    "error": result.error
                }
                
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check"""
        health_status = {
            "status": "healthy",
            "timestamp": time.time(),
            "checks": {}
        }
        
        try:
            # Test basic connectivity
            health_status["checks"]["connectivity"] = await self._test_connection()
            
            # Test query execution
            simple_query = "SELECT 1 as test"
            query_result = await self.execute_query(simple_query)
            health_status["checks"]["query_execution"] = query_result.success
            
            # Get graph stats
            stats = await self.get_graph_stats()
            health_status["checks"]["graph_accessible"] = stats.get("connected", False)
            health_status["graph_stats"] = stats
            
            # Overall status
            all_checks_passed = all(health_status["checks"].values())
            health_status["status"] = "healthy" if all_checks_passed else "unhealthy"
            
        except Exception as e:
            health_status["status"] = "unhealthy"
            health_status["error"] = str(e)
        
        return health_status
    
    # Synchronous methods for schema operations
    def create_vertex_type(self, vertex_type: str, attributes: Dict[str, str]) -> bool:
        """Create vertex type (synchronous)"""
        try:
            if not self.connection:
                raise Exception("No connection available")
            
            # Build CREATE VERTEX statement
            attr_definitions = []
            for attr_name, attr_type in attributes.items():
                attr_definitions.append(f"{attr_name} {attr_type}")
            
            gsql_statement = f"""
            CREATE VERTEX {vertex_type} (
                PRIMARY_ID id STRING,
                {', '.join(attr_definitions)}
            )
            """
            
            result = self.connection.gsql(gsql_statement)
            logger.info(f"Created vertex type {vertex_type}: {result}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create vertex type {vertex_type}: {e}")
            return False
    
    def create_edge_type(self, edge_type: str, from_vertex: str, to_vertex: str, 
                        attributes: Optional[Dict[str, str]] = None) -> bool:
        """Create edge type (synchronous)"""
        try:
            if not self.connection:
                raise Exception("No connection available")
            
            attr_definitions = []
            if attributes:
                for attr_name, attr_type in attributes.items():
                    attr_definitions.append(f"{attr_name} {attr_type}")
            
            attr_clause = f"({', '.join(attr_definitions)})" if attr_definitions else ""
            
            gsql_statement = f"""
            CREATE DIRECTED EDGE {edge_type} (
                FROM {from_vertex},
                TO {to_vertex}
                {attr_clause}
            )
            """
            
            result = self.connection.gsql(gsql_statement)
            logger.info(f"Created edge type {edge_type}: {result}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create edge type {edge_type}: {e}")
            return False
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.disconnect()

# Factory function for easy client creation
async def create_tigergraph_client(config: Optional[GraphConfig] = None) -> TigerGraphClient:
    """Create and connect TigerGraph client"""
    if config is None:
        config = GraphConfig()
    
    client = TigerGraphClient(config)
    await client.connect()
    return client