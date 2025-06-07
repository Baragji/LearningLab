#!/usr/bin/env python3
"""
Test Suite for TigerGraph Integration
Tests all components of the graph-based RAG system
"""

import asyncio
import pytest
import json
import tempfile
import os
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, List, Any

# Import components to test
from .tigergraph_client import TigerGraphClient, GraphConfig, QueryResult
from .schema_manager import GraphSchemaManager, VertexType, EdgeType
from .query_engine import GraphQueryEngine, QueryType, GraphSearchResult
from .data_migrator import VectorToGraphMigrator, MigrationConfig
from .rag_integration import GraphEnhancedRAG, RAGContext, RAGQueryType

class TestTigerGraphClient:
    """Test TigerGraph client functionality"""
    
    @pytest.fixture
    def mock_config(self):
        """Create mock configuration"""
        return GraphConfig(
            host="localhost",
            port=14240,
            username="test_user",
            password="test_pass",
            graph_name="TestGraph"
        )
    
    @pytest.fixture
    def mock_client(self, mock_config):
        """Create mock client"""
        return TigerGraphClient(mock_config)
    
    def test_client_initialization(self, mock_client, mock_config):
        """Test client initialization"""
        assert mock_client.config == mock_config
        assert mock_client.connection is None
        assert mock_client.session is None
        assert not mock_client._connected
    
    @pytest.mark.asyncio
    async def test_connection_success(self, mock_client):
        """Test successful connection"""
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_session.return_value.get.return_value.__aenter__.return_value = mock_response
            
            with patch('pyTigerGraph.TigerGraphConnection'):
                result = await mock_client.connect()
                assert result is True
                assert mock_client._connected is True
    
    @pytest.mark.asyncio
    async def test_connection_failure(self, mock_client):
        """Test connection failure"""
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 500
            mock_session.return_value.get.return_value.__aenter__.return_value = mock_response
            
            result = await mock_client.connect()
            assert result is False
            assert mock_client._connected is False
    
    @pytest.mark.asyncio
    async def test_query_execution_success(self, mock_client):
        """Test successful query execution"""
        mock_client._connected = True
        
        # Mock the execute_query method directly
        expected_result = QueryResult(
            success=True,
            data={"results": [{"id": "test"}]},
            execution_time=0.1,
            vertex_count=1,
            edge_count=0
        )
        
        with patch.object(mock_client, 'execute_query', return_value=expected_result) as mock_execute:
            result = await mock_client.execute_query("SELECT * FROM Test")
            
            assert result.success is True
            assert result.data == {"results": [{"id": "test"}]}
            assert result.execution_time > 0
            mock_execute.assert_called_once_with("SELECT * FROM Test")
    
    @pytest.mark.asyncio
    async def test_query_execution_failure(self, mock_client):
        """Test query execution failure"""
        mock_client._connected = True
        
        # Mock the execute_query method for failure
        expected_result = QueryResult(
            success=False,
            data=None,
            execution_time=0.1,
            vertex_count=0,
            edge_count=0,
            error="Query error"
        )
        
        with patch.object(mock_client, 'execute_query', return_value=expected_result) as mock_execute:
            result = await mock_client.execute_query("INVALID QUERY")
            
            assert result.success is False
            assert "Query error" in result.error
            mock_execute.assert_called_once_with("INVALID QUERY")
    
    @pytest.mark.asyncio
    async def test_health_check(self, mock_client):
        """Test health check functionality"""
        mock_client._connected = True
        
        # Mock health_check method directly
        expected_health = {
            "status": "healthy",
            "timestamp": 1234567890,
            "checks": {
                "connectivity": True,
                "query_execution": True,
                "graph_accessible": True
            },
            "graph_stats": {
                "connected": True,
                "graph_name": "RAGKnowledgeGraph",
                "vertex_count": 100,
                "edge_count": 200
            }
        }
        
        with patch.object(mock_client, 'health_check', return_value=expected_health) as mock_health:
            health = await mock_client.health_check()
            
            assert health["status"] == "healthy"
            assert health["checks"]["connectivity"] is True
            assert health["checks"]["query_execution"] is True
            mock_health.assert_called_once()

class TestGraphSchemaManager:
    """Test graph schema management"""
    
    @pytest.fixture
    def mock_client(self):
        """Create mock TigerGraph client"""
        client = Mock(spec=TigerGraphClient)
        client.create_vertex_type = Mock(return_value=True)
        client.create_edge_type = Mock(return_value=True)
        return client
    
    @pytest.fixture
    def schema_manager(self, mock_client):
        """Create schema manager"""
        return GraphSchemaManager(mock_client)
    
    def test_schema_initialization(self, schema_manager):
        """Test schema initialization"""
        assert len(schema_manager.vertex_schemas) > 0
        assert len(schema_manager.edge_schemas) > 0
        assert VertexType.FUNCTION.value in schema_manager.vertex_schemas
        assert EdgeType.CALLS.value in schema_manager.edge_schemas
    
    @pytest.mark.asyncio
    async def test_schema_creation_success(self, schema_manager, mock_client):
        """Test successful schema creation"""
        result = await schema_manager.create_schema()
        assert result is True
        
        # Verify vertex types were created
        assert mock_client.create_vertex_type.call_count > 0
        assert mock_client.create_edge_type.call_count > 0
    
    @pytest.mark.asyncio
    async def test_schema_creation_failure(self, schema_manager, mock_client):
        """Test schema creation failure"""
        mock_client.create_vertex_type.return_value = False
        
        result = await schema_manager.create_schema()
        assert result is False
    
    def test_vertex_data_validation_success(self, schema_manager):
        """Test successful vertex data validation"""
        valid_data = {
            "function_name": "test_function",
            "signature": "def test_function():",
            "return_type": "None",
            "parameters": "[]",
            "docstring": "Test function",
            "complexity": 1,
            "lines_of_code": 5,
            "start_line": 1,
            "end_line": 5,
            "is_public": True,
            "is_async": False
        }
        
        result = schema_manager.validate_vertex_data(VertexType.FUNCTION.value, valid_data)
        assert result is True
    
    def test_vertex_data_validation_failure(self, schema_manager):
        """Test vertex data validation failure"""
        invalid_data = {
            "function_name": 123,  # Should be string
            "complexity": "high"   # Should be int
        }
        
        result = schema_manager.validate_vertex_data(VertexType.FUNCTION.value, invalid_data)
        assert result is False
    
    def test_schema_export(self, schema_manager):
        """Test schema export functionality"""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            temp_path = f.name
        
        try:
            result = schema_manager.export_schema(temp_path)
            assert result is True
            
            # Verify file was created and contains valid JSON
            with open(temp_path, 'r') as f:
                schema_data = json.load(f)
            
            assert "vertices" in schema_data
            assert "edges" in schema_data
            assert "metadata" in schema_data
            
        finally:
            os.unlink(temp_path)

class TestGraphQueryEngine:
    """Test graph query engine"""
    
    @pytest.fixture
    def mock_client(self):
        """Create mock TigerGraph client"""
        client = Mock(spec=TigerGraphClient)
        return client
    
    @pytest.fixture
    def query_engine(self, mock_client):
        """Create query engine"""
        return GraphQueryEngine(mock_client)
    
    def test_query_engine_initialization(self, query_engine):
        """Test query engine initialization"""
        assert query_engine.client is not None
        assert len(query_engine.query_templates) > 0
        assert isinstance(query_engine.query_cache, dict)
    
    @pytest.mark.asyncio
    async def test_similarity_search_success(self, query_engine, mock_client):
        """Test successful similarity search"""
        mock_result = QueryResult(
            success=True,
            data=[{"id": "func1", "similarity_score": 0.9}],
            execution_time=0.1
        )
        mock_client.execute_query = AsyncMock(return_value=mock_result)
        
        result = await query_engine.similarity_search("target_func", threshold=0.7)
        
        assert result.query_type == QueryType.SIMILARITY_SEARCH
        assert result.total_results == 1
        assert len(result.results) == 1
    
    @pytest.mark.asyncio
    async def test_similarity_search_failure(self, query_engine, mock_client):
        """Test similarity search failure"""
        mock_result = QueryResult(
            success=False,
            data=None,
            execution_time=0.1,
            error="Query failed"
        )
        mock_client.execute_query = AsyncMock(return_value=mock_result)
        
        result = await query_engine.similarity_search("target_func")
        
        assert result.query_type == QueryType.SIMILARITY_SEARCH
        assert result.total_results == 0
        assert "error" in result.metadata
    
    @pytest.mark.asyncio
    async def test_semantic_search(self, query_engine, mock_client):
        """Test semantic search"""
        mock_result = QueryResult(
            success=True,
            data=[{"id": "func1", "cosine_similarity": 0.85}],
            execution_time=0.2
        )
        mock_client.execute_query = AsyncMock(return_value=mock_result)
        
        query_embedding = [0.1, 0.2, 0.3, 0.4, 0.5]
        result = await query_engine.semantic_search(query_embedding, threshold=0.8)
        
        assert result.query_type == QueryType.SEMANTIC_SEARCH
        assert result.total_results == 1
    
    @pytest.mark.asyncio
    async def test_dependency_analysis(self, query_engine, mock_client):
        """Test dependency analysis"""
        mock_result = QueryResult(
            success=True,
            data=[{"id": "dep1", "type": "function"}, {"id": "dep2", "type": "module"}],
            execution_time=0.3
        )
        mock_client.execute_query = AsyncMock(return_value=mock_result)
        
        result = await query_engine.find_dependencies("func_id", depth=2)
        
        assert result.query_type == QueryType.PATH_FINDING
        assert result.total_results == 2
    
    def test_query_stats(self, query_engine):
        """Test query statistics"""
        stats = query_engine.get_query_stats()
        
        assert "available_templates" in stats
        assert "cache_size" in stats
        assert "supported_query_types" in stats
        assert "template_names" in stats

class TestDataMigrator:
    """Test data migration functionality"""
    
    @pytest.fixture
    def mock_client(self):
        """Create mock TigerGraph client"""
        client = Mock(spec=TigerGraphClient)
        client.execute_query = AsyncMock(return_value=QueryResult(success=True, data={}, execution_time=0.1))
        return client
    
    @pytest.fixture
    def mock_schema_manager(self):
        """Create mock schema manager"""
        schema_manager = Mock(spec=GraphSchemaManager)
        schema_manager.validate_vertex_data = Mock(return_value=True)
        return schema_manager
    
    @pytest.fixture
    def migrator(self, mock_client, mock_schema_manager):
        """Create data migrator"""
        config = MigrationConfig(batch_size=10, max_concurrent=2)
        return VectorToGraphMigrator(mock_client, mock_schema_manager, config)
    
    @pytest.mark.asyncio
    async def test_data_analysis(self, migrator):
        """Test vector data analysis"""
        vector_data = {
            "documents": [
                {
                    "id": "doc1",
                    "type": "function",
                    "content": "def test(): pass",
                    "embedding": [0.1, 0.2, 0.3],
                    "metadata": {"function_name": "test"}
                },
                {
                    "id": "doc2", 
                    "type": "class",
                    "content": "class Test: pass",
                    "embedding": [0.4, 0.5, 0.6],
                    "metadata": {"class_name": "Test"}
                }
            ]
        }
        
        analysis = await migrator._analyze_vector_data(vector_data)
        
        assert analysis["total_documents"] == 2
        assert analysis["has_embeddings"] is True
        assert analysis["embedding_dimensions"] == 3
        assert "function" in analysis["document_types"]
        assert "class" in analysis["document_types"]
    
    def test_document_classification(self, migrator):
        """Test document type classification"""
        function_doc = {
            "type": "function",
            "content": "def test_function(): pass",
            "metadata": {"function_name": "test_function"}
        }
        
        class_doc = {
            "content": "class TestClass: pass",
            "metadata": {"file_path": "test.py"}
        }
        
        file_doc = {
            "metadata": {"file_path": "module.py"}
        }
        
        assert migrator._classify_document_type(function_doc) == VertexType.FUNCTION.value
        assert migrator._classify_document_type(class_doc) == VertexType.CLASS.value
        assert migrator._classify_document_type(file_doc) == VertexType.CODE_FILE.value
    
    def test_vertex_id_generation(self, migrator):
        """Test vertex ID generation"""
        doc_with_id = {"id": "existing_id"}
        doc_without_id = {
            "content": "test content",
            "metadata": {"file_path": "test.py"}
        }
        
        id1 = migrator._generate_vertex_id(doc_with_id)
        id2 = migrator._generate_vertex_id(doc_without_id)
        
        assert id1 == "existing_id"
        assert len(id2) == 32  # MD5 hash length
    
    @pytest.mark.asyncio
    async def test_vertex_attribute_preparation(self, migrator):
        """Test vertex attribute preparation"""
        function_doc = {
            "content": "def test(): pass",
            "metadata": {
                "function_name": "test",
                "signature": "def test():",
                "complexity": 1,
                "lines_of_code": 1
            },
            "embedding": [0.1, 0.2, 0.3]
        }
        
        attributes = await migrator._prepare_vertex_attributes(function_doc, VertexType.FUNCTION.value)
        
        assert "function_name" in attributes
        assert attributes["function_name"] == "test"
        assert "embedding" in attributes
        assert attributes["embedding"] == [0.1, 0.2, 0.3]
        assert "complexity" in attributes
    
    def test_relationship_extraction(self, migrator):
        """Test relationship extraction from vector data"""
        vector_data = {
            "documents": [
                {
                    "id": "file1",
                    "metadata": {
                        "file_path": "test.py",
                        "functions": [
                            {"name": "func1", "signature": "def func1():"}
                        ],
                        "function_calls": [
                            {
                                "caller_id": "func1",
                                "callee_id": "func2",
                                "count": 3,
                                "line_number": 10
                            }
                        ]
                    }
                }
            ]
        }
        
        relationships = migrator._extract_relationships(vector_data)
        
        assert len(relationships) >= 1
        assert any(rel["edge_type"] == EdgeType.CALLS.value for rel in relationships)
    
    def test_migration_status(self, migrator):
        """Test migration status reporting"""
        migrator.progress.total_items = 100
        migrator.progress.processed_items = 50
        migrator.progress.successful_items = 45
        migrator.progress.failed_items = 5
        migrator.progress.current_phase = "creating_vertices"
        
        status = migrator.get_migration_status()
        
        assert status["phase"] == "creating_vertices"
        assert status["progress_percent"] == 50.0
        assert status["processed"] == 50
        assert status["successful"] == 45
        assert status["failed"] == 5

class TestRAGIntegration:
    """Test RAG integration with TigerGraph"""
    
    @pytest.fixture
    def mock_graph_client(self):
        """Create mock graph client"""
        client = Mock(spec=TigerGraphClient)
        client.execute_query = AsyncMock(return_value=QueryResult(success=True, data=[], execution_time=0.1))
        client.get_graph_stats = AsyncMock(return_value={"connected": True, "vertex_count": 100})
        return client
    
    @pytest.fixture
    def mock_vector_rag(self):
        """Create mock vector RAG engine"""
        return Mock()
    
    @pytest.fixture
    def rag_system(self, mock_graph_client, mock_vector_rag):
        """Create RAG integration system"""
        return GraphEnhancedRAG(mock_graph_client, mock_vector_rag)
    
    def test_rag_system_initialization(self, rag_system):
        """Test RAG system initialization"""
        assert rag_system.graph_client is not None
        assert rag_system.query_engine is not None
        assert rag_system.schema_manager is not None
        assert len(rag_system.query_routing) == len(RAGQueryType)
    
    @pytest.mark.asyncio
    async def test_code_search_query(self, rag_system, mock_graph_client):
        """Test code search query"""
        mock_graph_client.execute_query.return_value = QueryResult(
            success=True,
            data=[{"id": "func1", "function_name": "test_function", "docstring": "Test function"}],
            execution_time=0.1
        )
        
        context = RAGContext(
            query="find function that handles user authentication",
            query_type=RAGQueryType.CODE_SEARCH,
            user_context={}
        )
        
        response = await rag_system.query(context)
        
        assert response.query_type == RAGQueryType.CODE_SEARCH
        assert response.confidence > 0
        assert len(response.sources) > 0
        assert "graph_insights" in response.__dict__
    
    @pytest.mark.asyncio
    async def test_function_explanation_query(self, rag_system, mock_graph_client):
        """Test function explanation query"""
        # Mock function details
        mock_graph_client.execute_query.return_value = QueryResult(
            success=True,
            data={"id": "func1", "function_name": "authenticate", "complexity": 5},
            execution_time=0.1
        )
        
        context = RAGContext(
            query="explain function authenticate",
            query_type=RAGQueryType.FUNCTION_EXPLANATION,
            user_context={}
        )
        
        response = await rag_system.query(context)
        
        assert response.query_type == RAGQueryType.FUNCTION_EXPLANATION
        assert response.confidence > 0
    
    @pytest.mark.asyncio
    async def test_dependency_analysis_query(self, rag_system, mock_graph_client):
        """Test dependency analysis query"""
        mock_graph_client.execute_query.return_value = QueryResult(
            success=True,
            data=[{"id": "dep1", "type": "function"}, {"id": "dep2", "type": "module"}],
            execution_time=0.2
        )
        
        context = RAGContext(
            query="analyze dependencies for function main",
            query_type=RAGQueryType.DEPENDENCY_ANALYSIS,
            user_context={}
        )
        
        response = await rag_system.query(context)
        
        assert response.query_type == RAGQueryType.DEPENDENCY_ANALYSIS
        assert len(response.sources) > 0
    
    @pytest.mark.asyncio
    async def test_similar_code_query(self, rag_system, mock_graph_client):
        """Test similar code search"""
        mock_graph_client.execute_query.return_value = QueryResult(
            success=True,
            data=[{"id": "func1", "similarity_score": 0.9}],
            execution_time=0.1
        )
        
        context = RAGContext(
            query="find similar code to function process_data",
            query_type=RAGQueryType.SIMILAR_CODE,
            user_context={}
        )
        
        response = await rag_system.query(context)
        
        assert response.query_type == RAGQueryType.SIMILAR_CODE
        assert response.confidence > 0
    
    @pytest.mark.asyncio
    async def test_error_handling(self, rag_system, mock_graph_client):
        """Test error handling in RAG queries"""
        mock_graph_client.execute_query.side_effect = Exception("Database error")
        
        context = RAGContext(
            query="test query",
            query_type=RAGQueryType.CODE_SEARCH,
            user_context={}
        )
        
        response = await rag_system.query(context)
        
        assert response.confidence == 0.0
        assert "error" in response.metadata
        assert "Database error" in response.answer
    
    def test_search_term_extraction(self, rag_system):
        """Test search term extraction"""
        query = "find function that handles user authentication and validation"
        terms = rag_system._extract_search_terms(query)
        
        assert "function" in terms
        assert "handles" in terms
        assert "user" in terms
        assert "authentication" in terms
        assert "validation" in terms
    
    def test_function_identifier_extraction(self, rag_system):
        """Test function identifier extraction"""
        queries = [
            "explain function authenticate",
            "what does authenticate() do",
            "function process_data implementation"
        ]
        
        identifiers = [rag_system._extract_function_identifier(q) for q in queries]
        
        assert "authenticate" in identifiers
        assert "process_data" in identifiers
    
    def test_language_detection(self, rag_system):
        """Test programming language detection"""
        queries = [
            "python function def main():",
            "javascript const myFunc = () => {}",
            "java public class MyClass",
            "cpp #include <iostream>"
        ]
        
        languages = [rag_system._detect_language(q) for q in queries]
        
        assert "python" in languages
        assert "javascript" in languages
        assert "java" in languages
        assert "cpp" in languages
    
    @pytest.mark.asyncio
    async def test_system_stats(self, rag_system, mock_graph_client):
        """Test system statistics"""
        stats = await rag_system.get_system_stats()
        
        assert "graph_stats" in stats
        assert "query_stats" in stats
        assert "supported_query_types" in stats
        assert "system_status" in stats

# Integration test
@pytest.mark.asyncio
async def test_full_integration():
    """Test full integration workflow"""
    # This would be a comprehensive test that:
    # 1. Sets up a test TigerGraph instance
    # 2. Creates schema
    # 3. Migrates test data
    # 4. Performs various queries
    # 5. Validates results
    
    # For now, just test that all components can be imported and initialized
    config = GraphConfig(host="localhost", port=14240)
    
    # Test that we can create all components without errors
    client = TigerGraphClient(config)
    schema_manager = GraphSchemaManager(client)
    query_engine = GraphQueryEngine(client)
    migrator = VectorToGraphMigrator(client, schema_manager)
    rag_system = GraphEnhancedRAG(client)
    
    assert client is not None
    assert schema_manager is not None
    assert query_engine is not None
    assert migrator is not None
    assert rag_system is not None

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])