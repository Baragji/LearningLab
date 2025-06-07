"""
SynthesizerAgent: Multi-Step Reasoning and Response Synthesis

The SynthesizerAgent creates comprehensive responses by:
- Analyzing retrieved documents for relevance and quality
- Applying different synthesis strategies (simple, reasoning, comparative, creative)
- Multi-step reasoning for complex queries
- Source attribution and confidence scoring
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..planner.query_planner import SynthesisStrategy
from ..retriever.retriever_agent import RetrievalResult

logger = logging.getLogger(__name__)


@dataclass
class SynthesisResult:
    """Result from synthesis operation"""
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    reasoning_steps: List[str]
    synthesis_strategy: SynthesisStrategy
    execution_time: float
    metadata: Dict[str, Any]
    created_at: datetime


class SynthesizerAgent:
    """
    Multi-Strategy Response Synthesizer for Agentic RAG
    
    Synthesis Strategies:
    - SIMPLE: Direct answer from top results
    - REASONING: Step-by-step logical reasoning
    - COMPARATIVE: Compare and contrast multiple sources
    - CREATIVE: Generate novel insights and connections
    """
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client  # OpenAI or other LLM client
        self.synthesis_cache = {}
        self.reasoning_templates = self._init_reasoning_templates()
        
    def _init_reasoning_templates(self) -> Dict[SynthesisStrategy, str]:
        """Initialize templates for different synthesis strategies"""
        return {
            SynthesisStrategy.SIMPLE: """
Based on the retrieved information, here is a direct answer to your question:

{answer}

Sources: {sources}
""",
            
            SynthesisStrategy.REASONING: """
Let me analyze this step by step:

{reasoning_steps}

Conclusion:
{answer}

Sources: {sources}
""",
            
            SynthesisStrategy.COMPARATIVE: """
Based on multiple sources, here's a comparative analysis:

{comparisons}

Summary:
{answer}

Sources: {sources}
""",
            
            SynthesisStrategy.CREATIVE: """
Drawing insights from the available information:

{creative_insights}

Novel perspective:
{answer}

Sources: {sources}
"""
        }
    
    async def synthesize_response(self, query: str, retrieval_results: List[RetrievalResult],
                                strategy: SynthesisStrategy, context: Dict[str, Any] = None) -> SynthesisResult:
        """
        Synthesize a comprehensive response from retrieval results
        
        Args:
            query: Original user query
            retrieval_results: Results from retrieval steps
            strategy: Synthesis strategy to use
            context: Additional context for synthesis
            
        Returns:
            SynthesisResult: Synthesized response with metadata
        """
        start_time = datetime.now()
        logger.info(f"Synthesizing response with strategy {strategy} for query: {query[:100]}...")
        
        # Check cache
        cache_key = self._generate_cache_key(query, retrieval_results, strategy)
        if cache_key in self.synthesis_cache:
            logger.debug("Cache hit for synthesis")
            return self.synthesis_cache[cache_key]
        
        # Prepare documents from all retrieval results
        all_documents = []
        for result in retrieval_results:
            all_documents.extend(result.documents)
        
        # Remove duplicates and rank by relevance
        unique_documents = self._deduplicate_and_rank(all_documents, query)
        
        # Apply synthesis strategy
        if strategy == SynthesisStrategy.SIMPLE:
            answer, reasoning_steps = await self._simple_synthesis(query, unique_documents, context)
        elif strategy == SynthesisStrategy.REASONING:
            answer, reasoning_steps = await self._reasoning_synthesis(query, unique_documents, context)
        elif strategy == SynthesisStrategy.COMPARATIVE:
            answer, reasoning_steps = await self._comparative_synthesis(query, unique_documents, context)
        elif strategy == SynthesisStrategy.CREATIVE:
            answer, reasoning_steps = await self._creative_synthesis(query, unique_documents, context)
        else:
            logger.warning(f"Unknown strategy {strategy}, falling back to simple")
            answer, reasoning_steps = await self._simple_synthesis(query, unique_documents, context)
        
        # Calculate confidence
        confidence = self._calculate_synthesis_confidence(answer, unique_documents, reasoning_steps)
        
        # Prepare sources
        sources = self._prepare_sources(unique_documents[:5])  # Top 5 sources
        
        # Create result
        execution_time = (datetime.now() - start_time).total_seconds()
        result = SynthesisResult(
            answer=answer,
            confidence=confidence,
            sources=sources,
            reasoning_steps=reasoning_steps,
            synthesis_strategy=strategy,
            execution_time=execution_time,
            metadata={
                "query": query,
                "num_documents": len(unique_documents),
                "num_retrieval_results": len(retrieval_results),
                "context": context or {}
            },
            created_at=start_time
        )
        
        # Cache result
        self.synthesis_cache[cache_key] = result
        
        logger.info(f"Synthesis completed: confidence {confidence:.2f}, "
                   f"time {execution_time:.2f}s, {len(reasoning_steps)} reasoning steps")
        
        return result
    
    async def _simple_synthesis(self, query: str, documents: List[Dict[str, Any]],
                              context: Dict[str, Any] = None) -> tuple[str, List[str]]:
        """Simple direct synthesis from top results"""
        if not documents:
            return "I couldn't find relevant information to answer your question.", []
        
        # Take top 3 documents
        top_docs = documents[:3]
        
        # Extract key information
        key_info = []
        for doc in top_docs:
            content = doc.get("content", "")
            if content:
                # Extract most relevant sentences
                relevant_sentences = self._extract_relevant_sentences(content, query)
                key_info.extend(relevant_sentences[:2])  # Top 2 sentences per doc
        
        if not key_info:
            return "The retrieved documents don't contain specific information about your query.", []
        
        # Create simple answer
        answer = self._create_simple_answer(query, key_info)
        reasoning_steps = [f"Analyzed {len(top_docs)} top-ranked documents"]
        
        return answer, reasoning_steps
    
    async def _reasoning_synthesis(self, query: str, documents: List[Dict[str, Any]],
                                 context: Dict[str, Any] = None) -> tuple[str, List[str]]:
        """Step-by-step reasoning synthesis"""
        reasoning_steps = []
        
        # Step 1: Analyze query intent
        query_intent = self._analyze_query_intent(query)
        reasoning_steps.append(f"Query intent: {query_intent}")
        
        # Step 2: Categorize documents
        categorized_docs = self._categorize_documents(documents, query)
        reasoning_steps.append(f"Categorized {len(documents)} documents into {len(categorized_docs)} categories")
        
        # Step 3: Extract evidence
        evidence = []
        for category, docs in categorized_docs.items():
            category_evidence = self._extract_evidence_from_category(docs, query)
            if category_evidence:
                evidence.append(f"{category}: {category_evidence}")
                reasoning_steps.append(f"Found evidence in {category}: {len(category_evidence)} points")
        
        # Step 4: Logical reasoning
        if evidence:
            logical_conclusion = self._apply_logical_reasoning(evidence, query_intent)
            reasoning_steps.append(f"Applied logical reasoning to reach conclusion")
            answer = logical_conclusion
        else:
            answer = "Based on the available information, I cannot provide a definitive answer."
            reasoning_steps.append("Insufficient evidence for logical reasoning")
        
        return answer, reasoning_steps
    
    async def _comparative_synthesis(self, query: str, documents: List[Dict[str, Any]],
                                   context: Dict[str, Any] = None) -> tuple[str, List[str]]:
        """Comparative analysis synthesis"""
        reasoning_steps = []
        
        # Group documents by perspective/source
        perspectives = self._group_by_perspective(documents)
        reasoning_steps.append(f"Identified {len(perspectives)} different perspectives")
        
        # Compare perspectives
        comparisons = []
        perspective_names = list(perspectives.keys())
        
        for i, perspective1 in enumerate(perspective_names):
            for perspective2 in perspective_names[i+1:]:
                comparison = self._compare_perspectives(
                    perspectives[perspective1], 
                    perspectives[perspective2], 
                    query
                )
                if comparison:
                    comparisons.append(comparison)
                    reasoning_steps.append(f"Compared {perspective1} vs {perspective2}")
        
        # Synthesize comparative answer
        if comparisons:
            answer = self._create_comparative_answer(comparisons, query)
            reasoning_steps.append("Synthesized comparative analysis")
        else:
            answer = "The available sources present consistent information without significant differences."
            reasoning_steps.append("No significant differences found between sources")
        
        return answer, reasoning_steps
    
    async def _creative_synthesis(self, query: str, documents: List[Dict[str, Any]],
                                context: Dict[str, Any] = None) -> tuple[str, List[str]]:
        """Creative synthesis with novel insights"""
        reasoning_steps = []
        
        # Extract patterns and connections
        patterns = self._identify_patterns(documents, query)
        reasoning_steps.append(f"Identified {len(patterns)} patterns in the data")
        
        # Find novel connections
        connections = self._find_novel_connections(documents, patterns)
        reasoning_steps.append(f"Discovered {len(connections)} novel connections")
        
        # Generate insights
        insights = self._generate_insights(patterns, connections, query)
        reasoning_steps.append(f"Generated {len(insights)} creative insights")
        
        # Create creative answer
        if insights:
            answer = self._create_creative_answer(insights, query)
            reasoning_steps.append("Synthesized creative response with novel perspectives")
        else:
            # Fallback to reasoning synthesis
            return await self._reasoning_synthesis(query, documents, context)
        
        return answer, reasoning_steps
    
    # Helper methods for document processing
    def _deduplicate_and_rank(self, documents: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
        """Remove duplicates and rank by relevance"""
        # Remove duplicates by ID
        seen_ids = set()
        unique_docs = []
        
        for doc in documents:
            doc_id = doc.get("id")
            if doc_id and doc_id not in seen_ids:
                seen_ids.add(doc_id)
                unique_docs.append(doc)
            elif not doc_id:
                unique_docs.append(doc)  # Keep documents without ID
        
        # Rank by composite score
        for doc in unique_docs:
            doc["composite_score"] = self._calculate_composite_score(doc, query)
        
        return sorted(unique_docs, key=lambda x: x.get("composite_score", 0), reverse=True)
    
    def _calculate_composite_score(self, doc: Dict[str, Any], query: str) -> float:
        """Calculate composite relevance score"""
        base_score = doc.get("score", 0.0)
        
        # Query overlap bonus
        content = doc.get("content", "")
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())
        overlap = len(query_words.intersection(content_words)) / len(query_words) if query_words else 0
        
        # Source quality bonus
        source_bonus = {
            "direct_search": 1.0,
            "semantic_search": 1.1,
            "graph_traversal": 0.9
        }.get(doc.get("source", "direct_search"), 1.0)
        
        return (base_score * source_bonus) + (overlap * 0.2)
    
    def _extract_relevant_sentences(self, content: str, query: str) -> List[str]:
        """Extract sentences most relevant to the query"""
        sentences = content.split('.')
        query_words = set(query.lower().split())
        
        sentence_scores = []
        for sentence in sentences:
            if len(sentence.strip()) < 10:  # Skip very short sentences
                continue
            
            sentence_words = set(sentence.lower().split())
            overlap = len(query_words.intersection(sentence_words))
            sentence_scores.append((sentence.strip(), overlap))
        
        # Sort by relevance and return top sentences
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        return [sentence for sentence, score in sentence_scores[:3] if score > 0]
    
    def _create_simple_answer(self, query: str, key_info: List[str]) -> str:
        """Create a simple answer from key information"""
        if not key_info:
            return "No relevant information found."
        
        # Combine key information
        answer_parts = []
        for info in key_info[:3]:  # Top 3 pieces of info
            if info and len(info.strip()) > 10:
                answer_parts.append(info.strip())
        
        if answer_parts:
            return " ".join(answer_parts)
        else:
            return "The available information is too fragmented to provide a clear answer."
    
    def _analyze_query_intent(self, query: str) -> str:
        """Analyze the intent behind the query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["what", "define", "explain"]):
            return "definition/explanation"
        elif any(word in query_lower for word in ["how", "steps", "process"]):
            return "procedural"
        elif any(word in query_lower for word in ["why", "reason", "cause"]):
            return "causal"
        elif any(word in query_lower for word in ["compare", "difference", "vs"]):
            return "comparative"
        elif any(word in query_lower for word in ["best", "recommend", "should"]):
            return "recommendation"
        else:
            return "informational"
    
    def _categorize_documents(self, documents: List[Dict[str, Any]], query: str) -> Dict[str, List[Dict[str, Any]]]:
        """Categorize documents by type/topic"""
        categories = {
            "functions": [],
            "classes": [],
            "documentation": [],
            "examples": [],
            "general": []
        }
        
        for doc in documents:
            content = doc.get("content", "").lower()
            
            if "def " in content or "function" in content:
                categories["functions"].append(doc)
            elif "class " in content:
                categories["classes"].append(doc)
            elif "example" in content or "sample" in content:
                categories["examples"].append(doc)
            elif len(content) > 200:  # Longer content likely documentation
                categories["documentation"].append(doc)
            else:
                categories["general"].append(doc)
        
        # Remove empty categories
        return {k: v for k, v in categories.items() if v}
    
    def _extract_evidence_from_category(self, docs: List[Dict[str, Any]], query: str) -> List[str]:
        """Extract evidence points from a category of documents"""
        evidence = []
        
        for doc in docs[:3]:  # Top 3 docs per category
            content = doc.get("content", "")
            relevant_sentences = self._extract_relevant_sentences(content, query)
            evidence.extend(relevant_sentences[:2])  # Top 2 sentences per doc
        
        return evidence
    
    def _apply_logical_reasoning(self, evidence: List[str], intent: str) -> str:
        """Apply logical reasoning to evidence"""
        if not evidence:
            return "Insufficient evidence for reasoning."
        
        if intent == "causal":
            return f"Based on the evidence, the cause appears to be: {evidence[0]}"
        elif intent == "procedural":
            return f"The process involves: {' -> '.join(evidence[:3])}"
        elif intent == "comparative":
            return f"Comparing the options: {' vs '.join(evidence[:2])}"
        else:
            return f"The evidence suggests: {evidence[0]}"
    
    def _group_by_perspective(self, documents: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group documents by perspective or source type"""
        perspectives = {
            "official_docs": [],
            "code_examples": [],
            "community": [],
            "technical": []
        }
        
        for doc in documents:
            content = doc.get("content", "").lower()
            metadata = doc.get("metadata", {})
            
            if "official" in str(metadata) or "documentation" in content:
                perspectives["official_docs"].append(doc)
            elif "def " in content or "class " in content:
                perspectives["code_examples"].append(doc)
            elif "community" in str(metadata) or "forum" in content:
                perspectives["community"].append(doc)
            else:
                perspectives["technical"].append(doc)
        
        return {k: v for k, v in perspectives.items() if v}
    
    def _compare_perspectives(self, docs1: List[Dict[str, Any]], docs2: List[Dict[str, Any]], query: str) -> Optional[str]:
        """Compare two sets of documents"""
        if not docs1 or not docs2:
            return None
        
        # Extract key points from each perspective
        points1 = []
        points2 = []
        
        for doc in docs1[:2]:
            points1.extend(self._extract_relevant_sentences(doc.get("content", ""), query)[:2])
        
        for doc in docs2[:2]:
            points2.extend(self._extract_relevant_sentences(doc.get("content", ""), query)[:2])
        
        if points1 and points2:
            return f"Perspective 1: {points1[0]} | Perspective 2: {points2[0]}"
        
        return None
    
    def _create_comparative_answer(self, comparisons: List[str], query: str) -> str:
        """Create answer from comparative analysis"""
        if not comparisons:
            return "No significant differences found between sources."
        
        answer_parts = ["Based on comparative analysis:"]
        answer_parts.extend(comparisons[:3])  # Top 3 comparisons
        
        return " ".join(answer_parts)
    
    def _identify_patterns(self, documents: List[Dict[str, Any]], query: str) -> List[str]:
        """Identify patterns in the documents"""
        patterns = []
        
        # Common terms pattern
        all_content = " ".join(doc.get("content", "") for doc in documents)
        words = all_content.lower().split()
        
        from collections import Counter
        word_counts = Counter(words)
        common_words = [word for word, count in word_counts.most_common(10) if len(word) > 4]
        
        if common_words:
            patterns.append(f"Common themes: {', '.join(common_words[:5])}")
        
        # Structure patterns
        function_count = sum(1 for doc in documents if "def " in doc.get("content", ""))
        class_count = sum(1 for doc in documents if "class " in doc.get("content", ""))
        
        if function_count > 0:
            patterns.append(f"Function-heavy content ({function_count} functions)")
        if class_count > 0:
            patterns.append(f"Object-oriented patterns ({class_count} classes)")
        
        return patterns
    
    def _find_novel_connections(self, documents: List[Dict[str, Any]], patterns: List[str]) -> List[str]:
        """Find novel connections between concepts"""
        connections = []
        
        # Cross-document concept connections
        concepts = set()
        for doc in documents:
            content = doc.get("content", "")
            # Extract technical terms
            import re
            tech_terms = re.findall(r'\b[A-Z][a-zA-Z]*[A-Z]\w*', content)  # CamelCase
            concepts.update(tech_terms[:3])  # Top 3 per document
        
        if len(concepts) > 1:
            concept_list = list(concepts)[:3]
            connections.append(f"Connected concepts: {' -> '.join(concept_list)}")
        
        return connections
    
    def _generate_insights(self, patterns: List[str], connections: List[str], query: str) -> List[str]:
        """Generate creative insights"""
        insights = []
        
        if patterns and connections:
            insights.append(f"Novel insight: {patterns[0]} combined with {connections[0]}")
        
        # Query-specific insights
        if "optimization" in query.lower() and patterns:
            insights.append(f"Optimization opportunity: {patterns[0]}")
        
        if "architecture" in query.lower() and connections:
            insights.append(f"Architectural pattern: {connections[0]}")
        
        return insights
    
    def _create_creative_answer(self, insights: List[str], query: str) -> str:
        """Create creative answer from insights"""
        if not insights:
            return "No novel insights could be generated from the available information."
        
        answer_parts = ["Here's a creative perspective:"]
        answer_parts.extend(insights[:2])  # Top 2 insights
        
        return " ".join(answer_parts)
    
    def _prepare_sources(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prepare source attribution"""
        sources = []
        
        for i, doc in enumerate(documents):
            source = {
                "id": doc.get("id", f"source_{i+1}"),
                "title": doc.get("metadata", {}).get("title", f"Source {i+1}"),
                "score": doc.get("score", 0.0),
                "type": doc.get("source", "unknown")
            }
            sources.append(source)
        
        return sources
    
    def _calculate_synthesis_confidence(self, answer: str, documents: List[Dict[str, Any]], 
                                      reasoning_steps: List[str]) -> float:
        """Calculate confidence in synthesized answer"""
        if not answer or "couldn't find" in answer.lower():
            return 0.1
        
        # Base confidence from document quality
        if documents:
            avg_doc_score = sum(doc.get("score", 0) for doc in documents) / len(documents)
            base_confidence = min(avg_doc_score, 0.8)
        else:
            base_confidence = 0.3
        
        # Reasoning depth bonus
        reasoning_bonus = min(len(reasoning_steps) * 0.05, 0.2)
        
        # Answer length and detail bonus
        answer_length_bonus = min(len(answer.split()) / 100, 0.1)
        
        total_confidence = base_confidence + reasoning_bonus + answer_length_bonus
        return min(max(total_confidence, 0.1), 1.0)
    
    def _generate_cache_key(self, query: str, retrieval_results: List[RetrievalResult], 
                          strategy: SynthesisStrategy) -> str:
        """Generate cache key for synthesis"""
        import hashlib
        
        # Create key from query, strategy, and result IDs
        result_ids = [result.step_id for result in retrieval_results]
        key_data = f"{query}_{strategy.value}_{sorted(result_ids)}"
        
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get synthesizer performance statistics"""
        return {
            "cache_size": len(self.synthesis_cache),
            "total_syntheses": len(self.synthesis_cache)
        }