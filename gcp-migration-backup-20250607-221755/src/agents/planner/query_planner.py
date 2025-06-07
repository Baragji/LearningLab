"""
QueryPlanner: Intelligent Query Decomposition and Strategy Selection

The QueryPlanner is the brain of the agentic RAG system. It analyzes incoming queries
and creates optimal execution plans with:
- Query complexity analysis
- Strategy selection (single-step, multi-step, hybrid)
- Retrieval step decomposition
- Synthesis strategy determination
- Resource allocation planning
"""

import asyncio
import logging
import re
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any, Optional, Union
from datetime import datetime

logger = logging.getLogger(__name__)


class QueryComplexity(Enum):
    """Query complexity levels"""
    SIMPLE = "simple"           # Direct factual queries
    MODERATE = "moderate"       # Queries requiring some reasoning
    COMPLEX = "complex"         # Multi-step reasoning required
    EXPERT = "expert"           # Domain expertise required


class RetrievalStrategy(Enum):
    """Available retrieval strategies"""
    DIRECT = "direct"           # Single vector search
    SEMANTIC = "semantic"       # Enhanced semantic search
    GRAPH = "graph"             # Graph-based traversal
    HYBRID = "hybrid"           # Multiple strategies combined
    ITERATIVE = "iterative"     # Multi-step refinement


class SynthesisStrategy(Enum):
    """Response synthesis strategies"""
    SIMPLE = "simple"           # Direct answer from top results
    REASONING = "reasoning"     # Step-by-step reasoning
    COMPARATIVE = "comparative" # Compare multiple sources
    CREATIVE = "creative"       # Generate novel insights


@dataclass
class RetrievalStep:
    """Individual retrieval step in the execution plan"""
    step_id: str
    query: str
    strategy: RetrievalStrategy
    max_results: int = 10
    threshold: float = 0.7
    dependencies: List[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []
        if self.metadata is None:
            self.metadata = {}


@dataclass
class QueryPlan:
    """Complete execution plan for a query"""
    plan_id: str
    original_query: str
    complexity: QueryComplexity
    retrieval_steps: List[RetrievalStep]
    synthesis_strategy: SynthesisStrategy
    estimated_time: float
    confidence: float
    created_at: datetime
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class QueryPlanner:
    """
    Intelligent Query Planner for Agentic RAG
    
    Analyzes queries and creates optimal execution plans with:
    - Complexity analysis using linguistic patterns
    - Strategy selection based on query characteristics
    - Multi-step decomposition for complex queries
    - Resource optimization and time estimation
    """
    
    def __init__(self):
        self.complexity_patterns = self._init_complexity_patterns()
        self.strategy_rules = self._init_strategy_rules()
        self.performance_history = {}
        
    def _init_complexity_patterns(self) -> Dict[QueryComplexity, List[str]]:
        """Initialize patterns for complexity detection"""
        return {
            QueryComplexity.SIMPLE: [
                r'\bwhat is\b',
                r'\bdefine\b',
                r'\bshow me\b',
                r'\blist\b',
                r'\bfind\b.*\bfunction\b',
                r'\bget\b.*\bcode\b'
            ],
            QueryComplexity.MODERATE: [
                r'\bhow to\b',
                r'\bexplain\b',
                r'\bcompare\b',
                r'\bdifference between\b',
                r'\banalyze\b',
                r'\brelationship\b'
            ],
            QueryComplexity.COMPLEX: [
                r'\bwhy\b.*\bbetter\b',
                r'\boptimize\b',
                r'\brefactor\b',
                r'\bdesign pattern\b',
                r'\barchitecture\b',
                r'\bmultiple.*steps\b'
            ],
            QueryComplexity.EXPERT: [
                r'\bperformance.*analysis\b',
                r'\bsecurity.*implications\b',
                r'\bscalability\b',
                r'\benterprise.*solution\b',
                r'\bmigration.*strategy\b'
            ]
        }
    
    def _init_strategy_rules(self) -> Dict[QueryComplexity, Dict[str, Any]]:
        """Initialize strategy selection rules"""
        return {
            QueryComplexity.SIMPLE: {
                "primary_strategy": RetrievalStrategy.DIRECT,
                "synthesis_strategy": SynthesisStrategy.SIMPLE,
                "max_steps": 1,
                "time_budget": 2.0
            },
            QueryComplexity.MODERATE: {
                "primary_strategy": RetrievalStrategy.SEMANTIC,
                "synthesis_strategy": SynthesisStrategy.REASONING,
                "max_steps": 2,
                "time_budget": 5.0
            },
            QueryComplexity.COMPLEX: {
                "primary_strategy": RetrievalStrategy.HYBRID,
                "synthesis_strategy": SynthesisStrategy.COMPARATIVE,
                "max_steps": 3,
                "time_budget": 10.0
            },
            QueryComplexity.EXPERT: {
                "primary_strategy": RetrievalStrategy.ITERATIVE,
                "synthesis_strategy": SynthesisStrategy.CREATIVE,
                "max_steps": 5,
                "time_budget": 20.0
            }
        }
    
    async def create_plan(self, query: str, context: Dict[str, Any] = None) -> QueryPlan:
        """
        Create an optimal execution plan for the given query
        
        Args:
            query: The user query to plan for
            context: Additional context (user preferences, history, etc.)
            
        Returns:
            QueryPlan: Complete execution plan
        """
        logger.info(f"Creating plan for query: {query[:100]}...")
        
        # Analyze query complexity
        complexity = self._analyze_complexity(query)
        logger.debug(f"Query complexity: {complexity}")
        
        # Get strategy rules for this complexity
        rules = self.strategy_rules[complexity]
        
        # Create retrieval steps
        retrieval_steps = await self._create_retrieval_steps(
            query, complexity, rules, context
        )
        
        # Determine synthesis strategy
        synthesis_strategy = self._select_synthesis_strategy(
            query, complexity, rules, context
        )
        
        # Estimate execution time
        estimated_time = self._estimate_execution_time(retrieval_steps, synthesis_strategy)
        
        # Calculate confidence
        confidence = self._calculate_plan_confidence(query, complexity, retrieval_steps)
        
        # Create plan
        plan = QueryPlan(
            plan_id=f"plan_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            original_query=query,
            complexity=complexity,
            retrieval_steps=retrieval_steps,
            synthesis_strategy=synthesis_strategy,
            estimated_time=estimated_time,
            confidence=confidence,
            created_at=datetime.now(),
            metadata={
                "context": context or {},
                "rules_used": rules,
                "planner_version": "1.0.0"
            }
        )
        
        logger.info(f"Plan created: {len(retrieval_steps)} steps, "
                   f"estimated time: {estimated_time:.2f}s, confidence: {confidence:.2f}")
        
        return plan
    
    def _analyze_complexity(self, query: str) -> QueryComplexity:
        """Analyze query complexity using pattern matching"""
        query_lower = query.lower()
        
        # Count matches for each complexity level
        complexity_scores = {}
        
        for complexity, patterns in self.complexity_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, query_lower))
                score += matches
            complexity_scores[complexity] = score
        
        # Additional heuristics
        word_count = len(query.split())
        question_marks = query.count('?')
        
        # Adjust scores based on heuristics
        if word_count > 20:
            complexity_scores[QueryComplexity.COMPLEX] += 1
        if word_count > 30:
            complexity_scores[QueryComplexity.EXPERT] += 1
        if question_marks > 1:
            complexity_scores[QueryComplexity.COMPLEX] += 1
        
        # Find highest scoring complexity
        if not any(complexity_scores.values()):
            return QueryComplexity.SIMPLE  # Default
        
        return max(complexity_scores.items(), key=lambda x: x[1])[0]
    
    async def _create_retrieval_steps(self, query: str, complexity: QueryComplexity, 
                                    rules: Dict[str, Any], context: Dict[str, Any] = None) -> List[RetrievalStep]:
        """Create retrieval steps based on query and complexity"""
        steps = []
        
        if complexity == QueryComplexity.SIMPLE:
            # Single direct retrieval
            steps.append(RetrievalStep(
                step_id="step_1",
                query=query,
                strategy=RetrievalStrategy.DIRECT,
                max_results=5,
                threshold=0.8
            ))
            
        elif complexity == QueryComplexity.MODERATE:
            # Semantic search with refinement
            steps.append(RetrievalStep(
                step_id="step_1",
                query=query,
                strategy=RetrievalStrategy.SEMANTIC,
                max_results=10,
                threshold=0.7
            ))
            
            # Optional second step for clarification
            if self._needs_clarification(query):
                clarified_query = self._generate_clarification_query(query)
                steps.append(RetrievalStep(
                    step_id="step_2",
                    query=clarified_query,
                    strategy=RetrievalStrategy.DIRECT,
                    max_results=5,
                    threshold=0.8,
                    dependencies=["step_1"]
                ))
                
        elif complexity == QueryComplexity.COMPLEX:
            # Multi-step hybrid approach
            
            # Step 1: Broad semantic search
            steps.append(RetrievalStep(
                step_id="step_1",
                query=query,
                strategy=RetrievalStrategy.SEMANTIC,
                max_results=15,
                threshold=0.6
            ))
            
            # Step 2: Graph-based related concepts
            steps.append(RetrievalStep(
                step_id="step_2", 
                query=self._extract_key_concepts(query),
                strategy=RetrievalStrategy.GRAPH,
                max_results=10,
                threshold=0.7,
                dependencies=["step_1"]
            ))
            
            # Step 3: Focused retrieval based on initial results
            steps.append(RetrievalStep(
                step_id="step_3",
                query="<refined_query>",  # Will be determined at runtime
                strategy=RetrievalStrategy.DIRECT,
                max_results=5,
                threshold=0.8,
                dependencies=["step_1", "step_2"],
                metadata={"dynamic_query": True}
            ))
            
        else:  # EXPERT
            # Iterative expert-level analysis
            
            # Step 1: Comprehensive semantic search
            steps.append(RetrievalStep(
                step_id="step_1",
                query=query,
                strategy=RetrievalStrategy.SEMANTIC,
                max_results=20,
                threshold=0.5
            ))
            
            # Step 2: Domain-specific graph traversal
            steps.append(RetrievalStep(
                step_id="step_2",
                query=self._extract_domain_terms(query),
                strategy=RetrievalStrategy.GRAPH,
                max_results=15,
                threshold=0.6,
                dependencies=["step_1"]
            ))
            
            # Step 3: Comparative analysis
            steps.append(RetrievalStep(
                step_id="step_3",
                query=self._generate_comparative_query(query),
                strategy=RetrievalStrategy.HYBRID,
                max_results=10,
                threshold=0.7,
                dependencies=["step_1", "step_2"]
            ))
            
            # Step 4: Expert validation
            steps.append(RetrievalStep(
                step_id="step_4",
                query="<validation_query>",
                strategy=RetrievalStrategy.ITERATIVE,
                max_results=5,
                threshold=0.8,
                dependencies=["step_1", "step_2", "step_3"],
                metadata={"validation_step": True}
            ))
        
        return steps
    
    def _select_synthesis_strategy(self, query: str, complexity: QueryComplexity,
                                 rules: Dict[str, Any], context: Dict[str, Any] = None) -> SynthesisStrategy:
        """Select optimal synthesis strategy"""
        base_strategy = rules["synthesis_strategy"]
        
        # Adjust based on query characteristics
        if "compare" in query.lower() or "difference" in query.lower():
            return SynthesisStrategy.COMPARATIVE
        elif "creative" in query.lower() or "innovative" in query.lower():
            return SynthesisStrategy.CREATIVE
        elif complexity in [QueryComplexity.COMPLEX, QueryComplexity.EXPERT]:
            return SynthesisStrategy.REASONING
        
        return base_strategy
    
    def _estimate_execution_time(self, steps: List[RetrievalStep], 
                               synthesis_strategy: SynthesisStrategy) -> float:
        """Estimate total execution time"""
        # Base time per retrieval step
        retrieval_time = len(steps) * 1.5
        
        # Synthesis time based on strategy
        synthesis_times = {
            SynthesisStrategy.SIMPLE: 0.5,
            SynthesisStrategy.REASONING: 2.0,
            SynthesisStrategy.COMPARATIVE: 3.0,
            SynthesisStrategy.CREATIVE: 4.0
        }
        
        synthesis_time = synthesis_times.get(synthesis_strategy, 1.0)
        
        # Add overhead for dependencies
        dependency_overhead = sum(1 for step in steps if step.dependencies) * 0.3
        
        return retrieval_time + synthesis_time + dependency_overhead
    
    def _calculate_plan_confidence(self, query: str, complexity: QueryComplexity,
                                 steps: List[RetrievalStep]) -> float:
        """Calculate confidence in the execution plan"""
        base_confidence = {
            QueryComplexity.SIMPLE: 0.9,
            QueryComplexity.MODERATE: 0.8,
            QueryComplexity.COMPLEX: 0.7,
            QueryComplexity.EXPERT: 0.6
        }[complexity]
        
        # Adjust based on plan characteristics
        if len(steps) > 3:
            base_confidence -= 0.1  # More steps = more uncertainty
        
        # Boost confidence for well-structured queries
        if any(keyword in query.lower() for keyword in ["function", "class", "method"]):
            base_confidence += 0.1
        
        return max(0.1, min(1.0, base_confidence))
    
    # Helper methods for query analysis
    def _needs_clarification(self, query: str) -> bool:
        """Check if query needs clarification"""
        ambiguous_terms = ["it", "this", "that", "thing", "stuff"]
        return any(term in query.lower().split() for term in ambiguous_terms)
    
    def _generate_clarification_query(self, query: str) -> str:
        """Generate a clarification query"""
        return f"clarify context for: {query}"
    
    def _extract_key_concepts(self, query: str) -> str:
        """Extract key concepts for graph search"""
        # Simple keyword extraction (can be enhanced with NLP)
        words = query.lower().split()
        key_concepts = [word for word in words if len(word) > 4 and word.isalpha()]
        return " ".join(key_concepts[:5])
    
    def _extract_domain_terms(self, query: str) -> str:
        """Extract domain-specific terms"""
        domain_terms = []
        technical_patterns = [
            r'\b\w+\(\)',  # Function calls
            r'\b[A-Z][a-zA-Z]*[A-Z]\w*',  # CamelCase
            r'\b\w+\.\w+',  # Dot notation
        ]
        
        for pattern in technical_patterns:
            matches = re.findall(pattern, query)
            domain_terms.extend(matches)
        
        return " ".join(domain_terms[:10])
    
    def _generate_comparative_query(self, query: str) -> str:
        """Generate comparative analysis query"""
        return f"compare alternatives and best practices for: {query}"
    
    async def optimize_plan(self, plan: QueryPlan, feedback: Dict[str, Any]) -> QueryPlan:
        """Optimize plan based on execution feedback"""
        # This will be implemented for adaptive learning
        logger.info(f"Optimizing plan {plan.plan_id} based on feedback")
        return plan
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get planner performance statistics"""
        return {
            "total_plans_created": len(self.performance_history),
            "average_confidence": sum(p.get("confidence", 0) for p in self.performance_history.values()) / max(1, len(self.performance_history)),
            "complexity_distribution": self._get_complexity_distribution()
        }
    
    def _get_complexity_distribution(self) -> Dict[str, int]:
        """Get distribution of query complexities"""
        distribution = {complexity.value: 0 for complexity in QueryComplexity}
        for plan_data in self.performance_history.values():
            complexity = plan_data.get("complexity")
            if complexity:
                distribution[complexity] += 1
        return distribution