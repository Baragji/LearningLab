"""
Agentic RAG Orchestrator

This module implements the main orchestrator for the Agentic RAG system,
coordinating the interactions between the different agent components:
- QueryPlanner: Plans the query execution strategy
- RetrieverAgent: Executes retrieval operations using various strategies
- SynthesizerAgent: Synthesizes answers from retrieved information
- ValidatorAgent: Validates and refines the generated responses

The orchestrator provides a high-level interface for interacting with the
agentic RAG system, handling the complex coordination between agents.
"""

import asyncio
import time
import logging
from typing import Dict, List, Any, Optional, Tuple

from dataclasses import dataclass, field

from .planner.query_planner import QueryPlanner, QueryPlan, QueryComplexity, RetrievalStrategy, SynthesisStrategy
from .prompts import get_prompt
from .retriever.retriever_agent import RetrieverAgent, RetrievalResult
from .synthesizer.synthesizer_agent import SynthesizerAgent, SynthesisResult
from .validator.validator_agent import ValidatorAgent, ValidationResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RAGContext:
    """Context information for RAG queries."""
    query: str
    query_type: str = "general"
    user_context: Dict[str, Any] = field(default_factory=dict)
    session_id: Optional[str] = None
    additional_context: Dict[str, Any] = field(default_factory=dict)

@dataclass
class RAGResponse:
    """Response from the RAG system."""
    answer: str
    confidence: float
    sources: List[Dict[str, Any]] = field(default_factory=list)
    execution_time: float = 0.0
    graph_insights: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

class AgenticRAG:
    """
    Main orchestrator for the Agentic RAG system, coordinating interactions
    between the different agent components.
    """
    
    def __init__(self, 
                 query_planner: QueryPlanner,
                 retriever_agent: RetrieverAgent,
                 synthesizer_agent: SynthesizerAgent,
                 validator_agent: ValidatorAgent):
        """
        Initialize the AgenticRAG orchestrator.
        
        Args:
            query_planner: The query planning agent
            retriever_agent: The retrieval agent
            synthesizer_agent: The synthesis agent
            validator_agent: The validation agent
        """
        self.query_planner = query_planner
        self.retriever_agent = retriever_agent
        self.synthesizer_agent = synthesizer_agent
        self.validator_agent = validator_agent

        # Load prompt templates for agent guidance
        self.planner_prompt = get_prompt("query_planner")
        self.synthesizer_prompt = get_prompt("synthesizer")
        
        # Performance metrics
        self._total_queries = 0
        self._successful_queries = 0
        self._clarification_requests = 0
        self._refinement_attempts = 0
        self._average_response_time = 0.0
        self._average_confidence = 0.0
        
        logger.info("AgenticRAG orchestrator initialized with all agents")
    
    async def query(self, context: RAGContext) -> RAGResponse:
        """
        Execute a RAG query using the agentic approach.
        
        Args:
            context: The RAG context containing query and context information
            
        Returns:
            A RAGResponse with the answer, confidence, and metadata
        """
        start_time = time.time()
        self._total_queries += 1
        
        logger.info(f"Processing query: {context.query}")

        # Attach prompt templates to context so downstream agents can leverage them
        context.additional_context["planner_prompt"] = self.planner_prompt
        context.additional_context["synthesizer_prompt"] = self.synthesizer_prompt

        try:
            # 1. Plan the query execution
            logger.debug("Creating query plan")
            query_plan = await self.query_planner.create_plan(
                context.query,
                context={**context.user_context, "prompt": self.planner_prompt}
            )
            
            logger.info(f"Query complexity: {query_plan.complexity}")
            logger.info(f"Selected synthesis strategy: {query_plan.synthesis_strategy}")
            
            # 2. Execute retrieval steps
            logger.debug("Executing retrieval steps")
            retrieval_results = await self._execute_retrieval_steps(query_plan, context)
            
            # 3. Synthesize answer
            logger.debug("Synthesizing answer")
            synthesis_result = await self.synthesizer_agent.synthesize(
                context.query,
                retrieval_results,
                query_plan.synthesis_strategy,
                context={**context.user_context, "prompt": self.synthesizer_prompt}
            )
            
            # 4. Validate and refine answer
            logger.debug("Validating answer")
            validation_result = await self.validator_agent.validate(
                context.query,
                synthesis_result,
                retrieval_results,
                context=context.user_context
            )
            
            # 5. Apply refinements if needed
            final_result = await self._apply_refinements(
                validation_result, 
                synthesis_result, 
                retrieval_results, 
                context
            )
            
            # 6. Prepare response
            response = self._prepare_response(final_result, retrieval_results, start_time)
            
            self._successful_queries += 1
            self._update_metrics(response)
            
            logger.info(f"Query processed successfully in {response.execution_time:.2f}s with confidence {response.confidence:.2f}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            # Return graceful degradation response
            return self._create_error_response(context, start_time, str(e))
    
    async def _execute_retrieval_steps(self, 
                                      query_plan: QueryPlan, 
                                      context: RAGContext) -> List[RetrievalResult]:
        """
        Execute all retrieval steps in the query plan.
        
        Args:
            query_plan: The query execution plan
            context: The RAG context
            
        Returns:
            List of retrieval results from all steps
        """
        results = []
        
        # Execute steps in parallel if possible
        parallel_steps = []
        sequential_steps = []
        
        # Categorize steps that can run in parallel vs. those that need sequential execution
        for step in query_plan.steps:
            if not step.depends_on:
                parallel_steps.append(step)
            else:
                sequential_steps.append(step)
        
        # Execute parallel steps
        if parallel_steps:
            tasks = [
                self.retriever_agent.execute_retrieval_step(
                    step, 
                    context.query,
                    context=context.user_context
                )
                for step in parallel_steps
            ]
            parallel_results = await asyncio.gather(*tasks)
            results.extend(parallel_results)
        
        # Execute sequential steps
        for step in sequential_steps:
            # Find dependent result
            dependency_satisfied = True
            dependency_results = {}
            
            for dep_id in step.depends_on:
                dep_result = next((r for r in results if r.step_id == dep_id), None)
                if not dep_result:
                    dependency_satisfied = False
                    break
                dependency_results[dep_id] = dep_result
            
            if dependency_satisfied:
                result = await self.retriever_agent.execute_retrieval_step(
                    step, 
                    context.query,
                    dependency_results=dependency_results,
                    context=context.user_context
                )
                results.append(result)
        
        return results
    
    async def _apply_refinements(self,
                                validation_result: ValidationResult,
                                synthesis_result: SynthesisResult,
                                retrieval_results: List[RetrievalResult],
                                context: RAGContext) -> SynthesisResult:
        """
        Apply refinements based on validation feedback.
        
        Args:
            validation_result: The validation result
            synthesis_result: The original synthesis result
            retrieval_results: The retrieval results
            context: The RAG context
            
        Returns:
            The refined synthesis result
        """
        if validation_result.needs_refinement:
            logger.info("Response needs refinement")
            self._refinement_attempts += 1
            
            # Attempt refinement
            refined_result = await self.synthesizer_agent.refine(
                context.query,
                synthesis_result,
                validation_result.feedback,
                retrieval_results,
                context=context.user_context
            )
            
            # Validate the refined result
            new_validation = await self.validator_agent.validate(
                context.query,
                refined_result,
                retrieval_results,
                context=context.user_context
            )
            
            # Use refined result if it's better
            if new_validation.quality_score > validation_result.quality_score:
                return refined_result
        
        return synthesis_result
    
    def _prepare_response(self, 
                        synthesis_result: SynthesisResult,
                        retrieval_results: List[RetrievalResult],
                        start_time: float) -> RAGResponse:
        """
        Prepare the final RAG response.
        
        Args:
            synthesis_result: The synthesis result
            retrieval_results: The retrieval results
            start_time: The query start time
            
        Returns:
            The formatted RAG response
        """
        # Calculate execution time
        execution_time = time.time() - start_time
        
        # Extract sources
        sources = []
        for result in retrieval_results:
            for doc in result.documents:
                if doc not in sources:
                    sources.append(doc)
        
        # Prepare graph insights
        graph_insights = self._extract_graph_insights(retrieval_results)
        
        # Create response
        response = RAGResponse(
            answer=synthesis_result.answer,
            confidence=synthesis_result.confidence,
            sources=sources[:10],  # Limit to top 10 sources
            execution_time=execution_time,
            graph_insights=graph_insights,
            metadata={
                "complexity": synthesis_result.complexity,
                "strategy": synthesis_result.strategy.value,
                "reasoning_steps": synthesis_result.reasoning_steps
            }
        )
        
        return response
    
    def _extract_graph_insights(self, retrieval_results: List[RetrievalResult]) -> Dict[str, Any]:
        """
        Extract graph insights from retrieval results.
        
        Args:
            retrieval_results: The retrieval results
            
        Returns:
            Dict of graph insights
        """
        insights = {}
        
        for result in retrieval_results:
            if result.strategy == RetrievalStrategy.GRAPH:
                # Extract graph-specific insights
                if hasattr(result, 'graph_data') and result.graph_data:
                    for key, value in result.graph_data.items():
                        insights[key] = value
        
        return insights
    
    def _create_error_response(self, context: RAGContext, start_time: float, error: str) -> RAGResponse:
        """
        Create an error response for graceful degradation.
        
        Args:
            context: The RAG context
            start_time: The query start time
            error: The error message
            
        Returns:
            A RAG response with error information
        """
        execution_time = time.time() - start_time
        
        return RAGResponse(
            answer=f"I apologize, but I encountered an issue while processing your query. {self._get_friendly_error_message()}",
            confidence=0.0,
            sources=[],
            execution_time=execution_time,
            graph_insights={},
            metadata={
                "error": error,
                "query": context.query
            }
        )
    
    def _get_friendly_error_message(self) -> str:
        """Get a user-friendly error message."""
        messages = [
            "Could you try rephrasing your question?",
            "I'm having trouble understanding your request.",
            "I might need more specific information to help you properly.",
            "This appears to be a complex query that I'm unable to process correctly."
        ]
        import random
        return random.choice(messages)
    
    def _update_metrics(self, response: RAGResponse) -> None:
        """
        Update performance metrics based on the response.
        
        Args:
            response: The RAG response
        """
        # Update average response time
        self._average_response_time = (
            (self._average_response_time * (self._successful_queries - 1)) + response.execution_time
        ) / self._successful_queries
        
        # Update average confidence
        self._average_confidence = (
            (self._average_confidence * (self._successful_queries - 1)) + response.confidence
        ) / self._successful_queries
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """
        Get performance statistics for the agentic RAG system.
        
        Returns:
            Dict of performance statistics
        """
        success_rate = (self._successful_queries / self._total_queries) * 100 if self._total_queries > 0 else 0
        
        return {
            "total_queries": self._total_queries,
            "successful_queries": self._successful_queries,
            "success_rate": success_rate,
            "clarification_requests": self._clarification_requests,
            "refinement_attempts": self._refinement_attempts,
            "average_response_time": self._average_response_time,
            "average_confidence": self._average_confidence,
            "planner_stats": self.query_planner.get_performance_stats(),
            "retriever_stats": self.retriever_agent.get_performance_stats(),
            "synthesizer_stats": self.synthesizer_agent.get_performance_stats(),
            "validator_stats": self.validator_agent.get_performance_stats()
        }

# Factory function to create an agentic RAG system
async def create_agentic_rag(graph_query_engine, graph_client, vector_rag_engine=None):
    """
    Create an AgenticRAG instance with all required agents.
    
    Args:
        graph_query_engine: The graph query engine
        graph_client: The graph database client
        vector_rag_engine: Optional vector RAG engine for hybrid retrieval
        
    Returns:
        An initialized AgenticRAG instance
    """
    # Initialize agents
    query_planner = QueryPlanner()
    retriever_agent = RetrieverAgent(graph_query_engine, graph_client)
    synthesizer_agent = SynthesizerAgent(vector_rag_engine)
    validator_agent = ValidatorAgent()
    
    # Create AgenticRAG instance
    return AgenticRAG(query_planner, retriever_agent, synthesizer_agent, validator_agent)