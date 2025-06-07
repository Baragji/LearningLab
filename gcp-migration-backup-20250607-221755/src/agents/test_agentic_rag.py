"""
Tests for the Agentic RAG orchestrator.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, List, Any

from .agentic_rag import (
    AgenticRAG, RAGContext, RAGResponse,
    create_agentic_rag
)
from .planner.query_planner import (
    QueryPlanner, QueryPlan, RetrievalStep, 
    QueryComplexity, RetrievalStrategy, SynthesisStrategy
)
from .retriever.retriever_agent import RetrieverAgent, RetrievalResult
from .synthesizer.synthesizer_agent import SynthesizerAgent, SynthesisResult
from .validator.validator_agent import ValidatorAgent, ValidationResult

# Test data
SAMPLE_QUERY = "How does the authentication system work?"
SAMPLE_CONTEXT = {"language": "python", "project": "web_app"}

@pytest.fixture
def mock_query_planner():
    """Create a mock query planner."""
    planner = AsyncMock(spec=QueryPlanner)
    
    # Mock create_plan method
    async def mock_create_plan(query, context=None):
        step = RetrievalStep(
            id="step1",
            strategy=RetrievalStrategy.SEMANTIC,
            description="Semantic search for auth functions",
            parameters={"query": query, "limit": 5}
        )
        
        return QueryPlan(
            query=query,
            complexity=QueryComplexity.MODERATE,
            steps=[step],
            synthesis_strategy=SynthesisStrategy.REASONING
        )
    
    planner.create_plan.side_effect = mock_create_plan
    planner.get_performance_stats.return_value = {"complexity_distribution": {}}
    
    return planner

@pytest.fixture
def mock_retriever_agent():
    """Create a mock retriever agent."""
    retriever = AsyncMock(spec=RetrieverAgent)
    
    # Mock execute_retrieval_step method
    async def mock_execute_step(step, query, dependency_results=None, context=None):
        return RetrievalResult(
            step_id=step.id,
            strategy=step.strategy,
            documents=[
                {
                    "id": "doc1",
                    "content": "def authenticate_user(username, password): ...",
                    "metadata": {"file": "auth.py", "function": "authenticate_user"}
                },
                {
                    "id": "doc2",
                    "content": "class AuthManager: ...",
                    "metadata": {"file": "auth_manager.py", "class": "AuthManager"}
                }
            ],
            confidence=0.85
        )
    
    retriever.execute_retrieval_step.side_effect = mock_execute_step
    retriever.get_performance_stats.return_value = {"strategy_distribution": {}}
    
    return retriever

@pytest.fixture
def mock_synthesizer_agent():
    """Create a mock synthesizer agent."""
    synthesizer = AsyncMock(spec=SynthesizerAgent)
    
    # Mock synthesize method
    async def mock_synthesize(query, retrieval_results, strategy, context=None):
        return SynthesisResult(
            answer="The authentication system uses a username/password mechanism...",
            confidence=0.9,
            strategy=strategy,
            complexity=QueryComplexity.MODERATE,
            reasoning_steps=["Identified auth components", "Analyzed workflow"]
        )
    
    synthesizer.synthesize.side_effect = mock_synthesize
    
    # Mock refine method
    async def mock_refine(query, original_result, feedback, retrieval_results, context=None):
        return SynthesisResult(
            answer="The authentication system uses a secure username/password mechanism...",
            confidence=0.95,
            strategy=original_result.strategy,
            complexity=original_result.complexity,
            reasoning_steps=original_result.reasoning_steps + ["Applied security context"]
        )
    
    synthesizer.refine.side_effect = mock_refine
    synthesizer.get_performance_stats.return_value = {"strategy_distribution": {}}
    
    return synthesizer

@pytest.fixture
def mock_validator_agent():
    """Create a mock validator agent."""
    validator = AsyncMock(spec=ValidatorAgent)
    
    # Mock validate method
    async def mock_validate(query, synthesis_result, retrieval_results, context=None):
        return ValidationResult(
            quality_score=0.85,
            accuracy_score=0.9,
            completeness_score=0.8,
            relevance_score=0.85,
            clarity_score=0.9,
            needs_refinement=True,
            feedback={
                "missing_aspects": ["security considerations"],
                "improvement_suggestions": ["Add security context"]
            }
        )
    
    validator.validate.side_effect = mock_validate
    validator.get_performance_stats.return_value = {"validation_distribution": {}}
    
    return validator

@pytest.fixture
def agentic_rag(mock_query_planner, mock_retriever_agent, mock_synthesizer_agent, mock_validator_agent):
    """Create an AgenticRAG instance with mock components."""
    return AgenticRAG(
        query_planner=mock_query_planner,
        retriever_agent=mock_retriever_agent,
        synthesizer_agent=mock_synthesizer_agent,
        validator_agent=mock_validator_agent
    )

@pytest.mark.asyncio
async def test_query_basic_flow(agentic_rag):
    """Test the basic query flow."""
    # Create context
    context = RAGContext(
        query=SAMPLE_QUERY,
        user_context=SAMPLE_CONTEXT
    )
    
    # Execute query
    response = await agentic_rag.query(context)
    
    # Verify response
    assert isinstance(response, RAGResponse)
    assert response.answer.startswith("The authentication system uses a secure")
    assert response.confidence > 0.9
    assert len(response.sources) == 2
    assert response.execution_time > 0
    assert "complexity" in response.metadata
    assert response.metadata["complexity"] == QueryComplexity.MODERATE
    
    # Verify component calls
    agentic_rag.query_planner.create_plan.assert_called_once()
    agentic_rag.retriever_agent.execute_retrieval_step.assert_called_once()
    agentic_rag.synthesizer_agent.synthesize.assert_called_once()
    agentic_rag.validator_agent.validate.assert_called()
    agentic_rag.synthesizer_agent.refine.assert_called_once()

@pytest.mark.asyncio
async def test_query_error_handling(agentic_rag):
    """Test error handling in the query flow."""
    # Make planner raise an exception
    agentic_rag.query_planner.create_plan.side_effect = Exception("Test error")
    
    # Create context
    context = RAGContext(
        query=SAMPLE_QUERY,
        user_context=SAMPLE_CONTEXT
    )
    
    # Execute query
    response = await agentic_rag.query(context)
    
    # Verify error response
    assert isinstance(response, RAGResponse)
    assert "apologize" in response.answer.lower()
    assert response.confidence == 0.0
    assert len(response.sources) == 0
    assert "error" in response.metadata
    assert response.metadata["error"] == "Test error"

@pytest.mark.asyncio
async def test_get_performance_stats(agentic_rag):
    """Test performance statistics collection."""
    # Execute a query to generate stats
    context = RAGContext(query=SAMPLE_QUERY)
    await agentic_rag.query(context)
    
    # Get stats
    stats = agentic_rag.get_performance_stats()
    
    # Verify stats
    assert "total_queries" in stats
    assert stats["total_queries"] == 1
    assert "successful_queries" in stats
    assert stats["successful_queries"] == 1
    assert "average_response_time" in stats
    assert stats["average_response_time"] > 0
    assert "planner_stats" in stats
    assert "retriever_stats" in stats
    assert "synthesizer_stats" in stats
    assert "validator_stats" in stats

@pytest.mark.asyncio
async def test_create_agentic_rag():
    """Test the factory function for creating an AgenticRAG instance."""
    # Create mock dependencies
    graph_query_engine = AsyncMock()
    graph_client = AsyncMock()
    vector_rag_engine = AsyncMock()
    
    # Create agentic RAG
    rag = await create_agentic_rag(graph_query_engine, graph_client, vector_rag_engine)
    
    # Verify instance
    assert isinstance(rag, AgenticRAG)
    assert rag.query_planner is not None
    assert rag.retriever_agent is not None
    assert rag.synthesizer_agent is not None
    assert rag.validator_agent is not None

@pytest.mark.asyncio
async def test_parallel_retrieval_steps(mock_query_planner, mock_retriever_agent, 
                                       mock_synthesizer_agent, mock_validator_agent):
    """Test execution of parallel retrieval steps."""
    # Modify query planner to return multiple steps
    async def mock_create_plan_multi(query, context=None):
        step1 = RetrievalStep(
            id="step1",
            strategy=RetrievalStrategy.SEMANTIC,
            description="Semantic search",
            parameters={"query": query, "limit": 5}
        )
        
        step2 = RetrievalStep(
            id="step2",
            strategy=RetrievalStrategy.DIRECT,
            description="Direct search",
            parameters={"query": query, "limit": 3}
        )
        
        return QueryPlan(
            query=query,
            complexity=QueryComplexity.COMPLEX,
            steps=[step1, step2],
            synthesis_strategy=SynthesisStrategy.COMPARATIVE
        )
    
    mock_query_planner.create_plan.side_effect = mock_create_plan_multi
    
    # Create agentic RAG
    rag = AgenticRAG(
        query_planner=mock_query_planner,
        retriever_agent=mock_retriever_agent,
        synthesizer_agent=mock_synthesizer_agent,
        validator_agent=mock_validator_agent
    )
    
    # Execute query
    context = RAGContext(query=SAMPLE_QUERY)
    response = await rag.query(context)
    
    # Verify parallel execution
    assert mock_retriever_agent.execute_retrieval_step.call_count == 2
    assert isinstance(response, RAGResponse)

@pytest.mark.asyncio
async def test_sequential_retrieval_steps(mock_query_planner, mock_retriever_agent,
                                         mock_synthesizer_agent, mock_validator_agent):
    """Test execution of sequential retrieval steps with dependencies."""
    # Modify query planner to return steps with dependencies
    async def mock_create_plan_sequential(query, context=None):
        step1 = RetrievalStep(
            id="step1",
            strategy=RetrievalStrategy.SEMANTIC,
            description="Semantic search",
            parameters={"query": query, "limit": 5}
        )
        
        step2 = RetrievalStep(
            id="step2",
            strategy=RetrievalStrategy.GRAPH,
            description="Graph exploration",
            parameters={"entities": "extract_from_step1", "depth": 2},
            depends_on=["step1"]
        )
        
        return QueryPlan(
            query=query,
            complexity=QueryComplexity.EXPERT,
            steps=[step1, step2],
            synthesis_strategy=SynthesisStrategy.REASONING
        )
    
    mock_query_planner.create_plan.side_effect = mock_create_plan_sequential
    
    # Create agentic RAG
    rag = AgenticRAG(
        query_planner=mock_query_planner,
        retriever_agent=mock_retriever_agent,
        synthesizer_agent=mock_synthesizer_agent,
        validator_agent=mock_validator_agent
    )
    
    # Execute query
    context = RAGContext(query=SAMPLE_QUERY)
    response = await rag.query(context)
    
    # Verify sequential execution
    assert mock_retriever_agent.execute_retrieval_step.call_count == 2
    assert isinstance(response, RAGResponse)

if __name__ == "__main__":
    # Run tests directly
    asyncio.run(pytest.main(["-xvs", __file__]))