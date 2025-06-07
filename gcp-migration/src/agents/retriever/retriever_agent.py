"""
RetrieverAgent: Adaptive Multi-Strategy Retrieval

The RetrieverAgent executes retrieval steps from QueryPlanner with:
- Multiple retrieval strategies (direct, semantic, graph, hybrid, iterative)
- Adaptive strategy selection based on query characteristics
- Dynamic query refinement based on intermediate results
- Performance optimization and caching
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Union
from datetime import datetime

from ..planner.query_planner import RetrievalStep, RetrievalStrategy
from ...graph.query_engine import GraphQueryEngine
from ...graph.tigergraph_client import TigerGraphClient

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    """Result from a retrieval operation"""
    step_id: str
    query: str
    strategy: RetrievalStrategy
    documents: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    execution_time: float
    confidence: float
    created_at: datetime


class RetrieverAgent:
    """
    Adaptive Retrieval Agent for Agentic RAG
    
    Executes retrieval steps with multiple strategies:
    - DIRECT: Single vector similarity search
    - SEMANTIC: Enhanced semantic search with context
    - GRAPH: Graph-based traversal and relationship discovery
    - HYBRID: Combination of multiple strategies
    - ITERATIVE: Multi-round refinement based on results
    """
    
    def __init__(self, query_engine: GraphQueryEngine, graph_client: TigerGraphClient):
        self.query_engine = query_engine
        self.graph_client = graph_client
        self.retrieval_cache = {}
        self.performance_metrics = {}
        
    async def execute_retrieval_step(self, step: RetrievalStep, 
                                   context: Dict[str, Any] = None,
                                   previous_results: List[RetrievalResult] = None) -> RetrievalResult:
        """
        Execute a single retrieval step
        
        Args:
            step: The retrieval step to execute
            context: Additional context for retrieval
            previous_results: Results from previous steps (for dependencies)
            
        Returns:
            RetrievalResult: The retrieval result
        """
        start_time = datetime.now()
        logger.info(f"Executing retrieval step {step.step_id} with strategy {step.strategy}")
        
        # Check cache first
        cache_key = self._generate_cache_key(step, context)
        if cache_key in self.retrieval_cache:
            logger.debug(f"Cache hit for step {step.step_id}")
            return self.retrieval_cache[cache_key]
        
        # Handle dynamic queries
        query = await self._resolve_dynamic_query(step, previous_results)
        
        # Execute retrieval based on strategy
        documents = await self._execute_strategy(step.strategy, query, step, context, previous_results)
        
        # Calculate confidence
        confidence = self._calculate_retrieval_confidence(documents, step)
        
        # Create result
        execution_time = (datetime.now() - start_time).total_seconds()
        result = RetrievalResult(
            step_id=step.step_id,
            query=query,
            strategy=step.strategy,
            documents=documents,
            metadata={
                "original_step": step,
                "context": context or {},
                "cache_hit": False,
                "num_results": len(documents)
            },
            execution_time=execution_time,
            confidence=confidence,
            created_at=start_time
        )
        
        # Cache result
        self.retrieval_cache[cache_key] = result
        
        # Update performance metrics
        self._update_performance_metrics(step.strategy, execution_time, confidence)
        
        logger.info(f"Step {step.step_id} completed: {len(documents)} documents, "
                   f"confidence: {confidence:.2f}, time: {execution_time:.2f}s")
        
        return result
    
    async def _execute_strategy(self, strategy: RetrievalStrategy, query: str,
                              step: RetrievalStep, context: Dict[str, Any] = None,
                              previous_results: List[RetrievalResult] = None) -> List[Dict[str, Any]]:
        """Execute retrieval based on the specified strategy"""
        
        if strategy == RetrievalStrategy.DIRECT:
            return await self._direct_retrieval(query, step)
            
        elif strategy == RetrievalStrategy.SEMANTIC:
            return await self._semantic_retrieval(query, step, context)
            
        elif strategy == RetrievalStrategy.GRAPH:
            return await self._graph_retrieval(query, step, context)
            
        elif strategy == RetrievalStrategy.HYBRID:
            return await self._hybrid_retrieval(query, step, context, previous_results)
            
        elif strategy == RetrievalStrategy.ITERATIVE:
            return await self._iterative_retrieval(query, step, context, previous_results)
            
        else:
            logger.warning(f"Unknown strategy {strategy}, falling back to direct")
            return await self._direct_retrieval(query, step)
    
    async def _direct_retrieval(self, query: str, step: RetrievalStep) -> List[Dict[str, Any]]:
        """Direct vector similarity search"""
        try:
            # Use query engine for similarity search
            search_result = await self.query_engine.similarity_search(
                query=query,
                threshold=step.threshold,
                limit=step.max_results
            )
            
            # Convert to standard format
            documents = []
            for result in search_result.results:
                documents.append({
                    "id": result.get("id", "unknown"),
                    "content": result.get("content", ""),
                    "metadata": result.get("metadata", {}),
                    "score": result.get("similarity_score", 0.0),
                    "source": "direct_search"
                })
            
            return documents
            
        except Exception as e:
            logger.error(f"Direct retrieval failed: {e}")
            return []
    
    async def _semantic_retrieval(self, query: str, step: RetrievalStep, 
                                context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Enhanced semantic search with context expansion"""
        try:
            # Expand query with context
            expanded_query = await self._expand_query_semantically(query, context)
            
            # Perform semantic search
            search_result = await self.query_engine.semantic_search(
                query=expanded_query,
                context=context or {},
                limit=step.max_results
            )
            
            # Convert and enrich results
            documents = []
            for result in search_result.results:
                # Add semantic enrichment
                enriched_result = await self._enrich_semantic_result(result, query)
                documents.append({
                    "id": result.get("id", "unknown"),
                    "content": result.get("content", ""),
                    "metadata": {
                        **result.get("metadata", {}),
                        "semantic_enrichment": enriched_result
                    },
                    "score": result.get("relevance_score", 0.0),
                    "source": "semantic_search"
                })
            
            return documents
            
        except Exception as e:
            logger.error(f"Semantic retrieval failed: {e}")
            return await self._direct_retrieval(query, step)  # Fallback
    
    async def _graph_retrieval(self, query: str, step: RetrievalStep,
                             context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Graph-based traversal and relationship discovery"""
        try:
            # Extract entities from query
            entities = await self._extract_entities(query)
            
            # Perform graph traversal
            graph_results = []
            for entity in entities:
                # Find related entities through graph traversal
                related = await self.query_engine.find_related_entities(
                    entity_id=entity,
                    max_hops=2,
                    limit=step.max_results // len(entities) if entities else step.max_results
                )
                graph_results.extend(related.results)
            
            # Convert to standard format
            documents = []
            for result in graph_results:
                documents.append({
                    "id": result.get("id", "unknown"),
                    "content": result.get("content", ""),
                    "metadata": {
                        **result.get("metadata", {}),
                        "graph_path": result.get("path", []),
                        "relationship_type": result.get("relationship", "unknown")
                    },
                    "score": result.get("relevance_score", 0.0),
                    "source": "graph_traversal"
                })
            
            # Remove duplicates and sort by relevance
            unique_docs = self._deduplicate_documents(documents)
            return sorted(unique_docs, key=lambda x: x["score"], reverse=True)[:step.max_results]
            
        except Exception as e:
            logger.error(f"Graph retrieval failed: {e}")
            return await self._semantic_retrieval(query, step, context)  # Fallback
    
    async def _hybrid_retrieval(self, query: str, step: RetrievalStep,
                              context: Dict[str, Any] = None,
                              previous_results: List[RetrievalResult] = None) -> List[Dict[str, Any]]:
        """Combination of multiple retrieval strategies"""
        try:
            # Execute multiple strategies in parallel
            tasks = [
                self._direct_retrieval(query, step),
                self._semantic_retrieval(query, step, context),
                self._graph_retrieval(query, step, context)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results
            all_documents = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.warning(f"Strategy {i} failed: {result}")
                    continue
                all_documents.extend(result)
            
            # Deduplicate and rerank
            unique_docs = self._deduplicate_documents(all_documents)
            reranked_docs = await self._rerank_hybrid_results(unique_docs, query)
            
            return reranked_docs[:step.max_results]
            
        except Exception as e:
            logger.error(f"Hybrid retrieval failed: {e}")
            return await self._semantic_retrieval(query, step, context)  # Fallback
    
    async def _iterative_retrieval(self, query: str, step: RetrievalStep,
                                 context: Dict[str, Any] = None,
                                 previous_results: List[RetrievalResult] = None) -> List[Dict[str, Any]]:
        """Multi-round iterative refinement"""
        try:
            documents = []
            current_query = query
            
            # Iterative refinement (max 3 rounds)
            for round_num in range(3):
                logger.debug(f"Iterative retrieval round {round_num + 1}")
                
                # Perform search
                round_results = await self._semantic_retrieval(
                    current_query, step, context
                )
                
                # Add to results
                documents.extend(round_results)
                
                # Check if we have enough high-quality results
                high_quality = [doc for doc in round_results if doc["score"] > step.threshold]
                if len(high_quality) >= step.max_results // 2:
                    break
                
                # Refine query for next round
                current_query = await self._refine_query_iteratively(
                    current_query, round_results, previous_results
                )
                
                if current_query == query:  # No refinement possible
                    break
            
            # Deduplicate and select best results
            unique_docs = self._deduplicate_documents(documents)
            return sorted(unique_docs, key=lambda x: x["score"], reverse=True)[:step.max_results]
            
        except Exception as e:
            logger.error(f"Iterative retrieval failed: {e}")
            return await self._hybrid_retrieval(query, step, context, previous_results)  # Fallback
    
    # Helper methods
    async def _resolve_dynamic_query(self, step: RetrievalStep, 
                                   previous_results: List[RetrievalResult] = None) -> str:
        """Resolve dynamic queries based on previous results"""
        if not step.metadata.get("dynamic_query", False):
            return step.query
        
        if not previous_results:
            return step.query
        
        # Extract insights from previous results
        insights = []
        for result in previous_results:
            if result.step_id in step.dependencies:
                # Extract key terms from top documents
                top_docs = sorted(result.documents, key=lambda x: x["score"], reverse=True)[:3]
                for doc in top_docs:
                    insights.extend(self._extract_key_terms(doc["content"]))
        
        # Generate refined query
        if insights:
            refined_query = f"{step.query} {' '.join(insights[:5])}"
            logger.debug(f"Refined dynamic query: {refined_query}")
            return refined_query
        
        return step.query
    
    async def _expand_query_semantically(self, query: str, context: Dict[str, Any] = None) -> str:
        """Expand query with semantic context"""
        # Simple expansion (can be enhanced with embeddings)
        expansions = []
        
        # Add context terms
        if context:
            user_context = context.get("user_context", {})
            if "domain" in user_context:
                expansions.append(user_context["domain"])
            if "language" in user_context:
                expansions.append(user_context["language"])
        
        # Add technical synonyms
        technical_synonyms = {
            "function": ["method", "procedure", "routine"],
            "class": ["object", "type", "structure"],
            "variable": ["parameter", "field", "attribute"]
        }
        
        for term, synonyms in technical_synonyms.items():
            if term in query.lower():
                expansions.extend(synonyms[:2])
        
        if expansions:
            return f"{query} {' '.join(expansions)}"
        return query
    
    async def _enrich_semantic_result(self, result: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Enrich semantic search result with additional context"""
        return {
            "query_overlap": self._calculate_query_overlap(result.get("content", ""), query),
            "semantic_category": self._classify_content(result.get("content", "")),
            "relevance_factors": self._identify_relevance_factors(result, query)
        }
    
    async def _extract_entities(self, query: str) -> List[str]:
        """Extract entities from query for graph traversal"""
        # Simple entity extraction (can be enhanced with NER)
        import re
        
        entities = []
        
        # Function names
        function_pattern = r'\b\w+\(\)'
        entities.extend(re.findall(function_pattern, query))
        
        # Class names (CamelCase)
        class_pattern = r'\b[A-Z][a-zA-Z]*[A-Z]\w*'
        entities.extend(re.findall(class_pattern, query))
        
        # Technical terms
        technical_terms = ["database", "api", "server", "client", "authentication", "authorization"]
        for term in technical_terms:
            if term in query.lower():
                entities.append(term)
        
        return list(set(entities))  # Remove duplicates
    
    def _deduplicate_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate documents based on ID and content similarity"""
        seen_ids = set()
        unique_docs = []
        
        for doc in documents:
            doc_id = doc.get("id")
            if doc_id and doc_id not in seen_ids:
                seen_ids.add(doc_id)
                unique_docs.append(doc)
            elif not doc_id:
                # For documents without ID, check content similarity
                content = doc.get("content", "")
                is_duplicate = False
                for existing_doc in unique_docs:
                    if self._calculate_content_similarity(content, existing_doc.get("content", "")) > 0.8:
                        is_duplicate = True
                        break
                if not is_duplicate:
                    unique_docs.append(doc)
        
        return unique_docs
    
    async def _rerank_hybrid_results(self, documents: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
        """Rerank hybrid results using multiple signals"""
        for doc in documents:
            # Calculate composite score
            original_score = doc.get("score", 0.0)
            source_weight = {
                "direct_search": 1.0,
                "semantic_search": 1.2,
                "graph_traversal": 0.8
            }.get(doc.get("source", "direct_search"), 1.0)
            
            # Query overlap bonus
            content = doc.get("content", "")
            overlap_bonus = self._calculate_query_overlap(content, query) * 0.2
            
            # Composite score
            doc["composite_score"] = (original_score * source_weight) + overlap_bonus
        
        return sorted(documents, key=lambda x: x.get("composite_score", 0), reverse=True)
    
    async def _refine_query_iteratively(self, query: str, round_results: List[Dict[str, Any]],
                                      previous_results: List[RetrievalResult] = None) -> str:
        """Refine query based on current round results"""
        if not round_results:
            return query
        
        # Extract key terms from top results
        top_results = sorted(round_results, key=lambda x: x["score"], reverse=True)[:3]
        key_terms = []
        
        for result in top_results:
            content = result.get("content", "")
            terms = self._extract_key_terms(content)
            key_terms.extend(terms)
        
        # Add most frequent terms to query
        if key_terms:
            from collections import Counter
            term_counts = Counter(key_terms)
            top_terms = [term for term, count in term_counts.most_common(3)]
            refined_query = f"{query} {' '.join(top_terms)}"
            return refined_query
        
        return query
    
    def _extract_key_terms(self, content: str) -> List[str]:
        """Extract key terms from content"""
        import re
        
        # Simple key term extraction
        words = re.findall(r'\b\w{4,}\b', content.lower())
        
        # Filter out common words
        stop_words = {"this", "that", "with", "from", "they", "have", "been", "were", "said", "each", "which", "their"}
        key_terms = [word for word in words if word not in stop_words]
        
        return key_terms[:10]  # Return top 10
    
    def _calculate_query_overlap(self, content: str, query: str) -> float:
        """Calculate overlap between content and query"""
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())
        
        if not query_words:
            return 0.0
        
        overlap = len(query_words.intersection(content_words))
        return overlap / len(query_words)
    
    def _classify_content(self, content: str) -> str:
        """Classify content type"""
        if "def " in content or "function" in content.lower():
            return "function"
        elif "class " in content:
            return "class"
        elif "import " in content:
            return "module"
        else:
            return "general"
    
    def _identify_relevance_factors(self, result: Dict[str, Any], query: str) -> List[str]:
        """Identify factors that make result relevant"""
        factors = []
        content = result.get("content", "").lower()
        query_lower = query.lower()
        
        if any(word in content for word in query_lower.split()):
            factors.append("keyword_match")
        
        if result.get("score", 0) > 0.8:
            factors.append("high_similarity")
        
        if "function" in query_lower and "def " in content:
            factors.append("function_match")
        
        return factors
    
    def _calculate_content_similarity(self, content1: str, content2: str) -> float:
        """Calculate similarity between two content strings"""
        words1 = set(content1.lower().split())
        words2 = set(content2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def _calculate_retrieval_confidence(self, documents: List[Dict[str, Any]], step: RetrievalStep) -> float:
        """Calculate confidence in retrieval results"""
        if not documents:
            return 0.0
        
        # Average score
        avg_score = sum(doc.get("score", 0) for doc in documents) / len(documents)
        
        # Number of results factor
        result_factor = min(len(documents) / step.max_results, 1.0)
        
        # Threshold compliance
        above_threshold = sum(1 for doc in documents if doc.get("score", 0) >= step.threshold)
        threshold_factor = above_threshold / len(documents)
        
        return (avg_score * 0.5) + (result_factor * 0.3) + (threshold_factor * 0.2)
    
    def _generate_cache_key(self, step: RetrievalStep, context: Dict[str, Any] = None) -> str:
        """Generate cache key for retrieval step"""
        import hashlib
        
        key_data = f"{step.query}_{step.strategy.value}_{step.max_results}_{step.threshold}"
        if context:
            key_data += f"_{str(sorted(context.items()))}"
        
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _update_performance_metrics(self, strategy: RetrievalStrategy, execution_time: float, confidence: float):
        """Update performance metrics for strategy"""
        if strategy not in self.performance_metrics:
            self.performance_metrics[strategy] = {
                "total_executions": 0,
                "total_time": 0.0,
                "total_confidence": 0.0,
                "avg_time": 0.0,
                "avg_confidence": 0.0
            }
        
        metrics = self.performance_metrics[strategy]
        metrics["total_executions"] += 1
        metrics["total_time"] += execution_time
        metrics["total_confidence"] += confidence
        metrics["avg_time"] = metrics["total_time"] / metrics["total_executions"]
        metrics["avg_confidence"] = metrics["total_confidence"] / metrics["total_executions"]
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get retriever performance statistics"""
        return {
            "cache_size": len(self.retrieval_cache),
            "strategy_performance": self.performance_metrics,
            "total_retrievals": sum(m["total_executions"] for m in self.performance_metrics.values())
        }