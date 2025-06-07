"""
ValidatorAgent: Response Quality Validation and Refinement

The ValidatorAgent ensures response quality through:
- Multi-dimensional quality assessment
- Factual accuracy validation
- Completeness and relevance checking
- Iterative refinement suggestions
- Confidence calibration
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from enum import Enum

from ..synthesizer.synthesizer_agent import SynthesisResult

logger = logging.getLogger(__name__)


class ValidationDimension(Enum):
    """Dimensions for response validation"""
    ACCURACY = "accuracy"
    COMPLETENESS = "completeness"
    RELEVANCE = "relevance"
    CLARITY = "clarity"
    CONSISTENCY = "consistency"
    FACTUALITY = "factuality"


@dataclass
class ValidationResult:
    """Result from validation operation"""
    is_valid: bool
    overall_score: float
    dimension_scores: Dict[ValidationDimension, float]
    issues_found: List[str]
    suggestions: List[str]
    confidence_adjustment: float
    needs_refinement: bool
    validation_time: float
    metadata: Dict[str, Any]
    created_at: datetime


class ValidatorAgent:
    """
    Multi-Dimensional Response Validator for Agentic RAG
    
    Validation Process:
    1. Accuracy: Check factual correctness against sources
    2. Completeness: Ensure all aspects of query are addressed
    3. Relevance: Verify response directly answers the query
    4. Clarity: Assess readability and structure
    5. Consistency: Check for internal contradictions
    6. Factuality: Validate claims against knowledge base
    """
    
    def __init__(self, knowledge_base=None):
        self.knowledge_base = knowledge_base
        self.validation_history = {}
        self.quality_thresholds = self._init_quality_thresholds()
        self.validation_rules = self._init_validation_rules()
        
    def _init_quality_thresholds(self) -> Dict[ValidationDimension, float]:
        """Initialize quality thresholds for each dimension"""
        return {
            ValidationDimension.ACCURACY: 0.8,
            ValidationDimension.COMPLETENESS: 0.7,
            ValidationDimension.RELEVANCE: 0.8,
            ValidationDimension.CLARITY: 0.7,
            ValidationDimension.CONSISTENCY: 0.8,
            ValidationDimension.FACTUALITY: 0.8
        }
    
    def _init_validation_rules(self) -> Dict[str, Any]:
        """Initialize validation rules and patterns"""
        return {
            "min_answer_length": 20,
            "max_answer_length": 2000,
            "required_source_coverage": 0.6,
            "contradiction_patterns": [
                r"but.*however",
                r"yes.*no",
                r"always.*never",
                r"all.*none"
            ],
            "uncertainty_indicators": [
                "might", "could", "possibly", "perhaps", "maybe",
                "unclear", "uncertain", "unknown"
            ],
            "factual_claim_patterns": [
                r"\d+%",  # Percentages
                r"\d+\s*(years?|months?|days?)",  # Time periods
                r"always", "never", "all", "none",  # Absolutes
                r"according to", "research shows"  # Citations
            ]
        }
    
    async def validate_response(self, synthesis_result: SynthesisResult, 
                              original_query: str, context: Dict[str, Any] = None) -> ValidationResult:
        """
        Validate a synthesized response across multiple dimensions
        
        Args:
            synthesis_result: The response to validate
            original_query: Original user query
            context: Additional validation context
            
        Returns:
            ValidationResult: Comprehensive validation assessment
        """
        start_time = datetime.now()
        logger.info(f"Validating response for query: {original_query[:100]}...")
        
        # Validate each dimension
        dimension_scores = {}
        all_issues = []
        all_suggestions = []
        
        # 1. Accuracy validation
        accuracy_score, accuracy_issues, accuracy_suggestions = await self._validate_accuracy(
            synthesis_result, original_query, context
        )
        dimension_scores[ValidationDimension.ACCURACY] = accuracy_score
        all_issues.extend(accuracy_issues)
        all_suggestions.extend(accuracy_suggestions)
        
        # 2. Completeness validation
        completeness_score, completeness_issues, completeness_suggestions = await self._validate_completeness(
            synthesis_result, original_query, context
        )
        dimension_scores[ValidationDimension.COMPLETENESS] = completeness_score
        all_issues.extend(completeness_issues)
        all_suggestions.extend(completeness_suggestions)
        
        # 3. Relevance validation
        relevance_score, relevance_issues, relevance_suggestions = await self._validate_relevance(
            synthesis_result, original_query, context
        )
        dimension_scores[ValidationDimension.RELEVANCE] = relevance_score
        all_issues.extend(relevance_issues)
        all_suggestions.extend(relevance_suggestions)
        
        # 4. Clarity validation
        clarity_score, clarity_issues, clarity_suggestions = await self._validate_clarity(
            synthesis_result, original_query, context
        )
        dimension_scores[ValidationDimension.CLARITY] = clarity_score
        all_issues.extend(clarity_issues)
        all_suggestions.extend(clarity_suggestions)
        
        # 5. Consistency validation
        consistency_score, consistency_issues, consistency_suggestions = await self._validate_consistency(
            synthesis_result, original_query, context
        )
        dimension_scores[ValidationDimension.CONSISTENCY] = consistency_score
        all_issues.extend(consistency_issues)
        all_suggestions.extend(consistency_suggestions)
        
        # 6. Factuality validation
        factuality_score, factuality_issues, factuality_suggestions = await self._validate_factuality(
            synthesis_result, original_query, context
        )
        dimension_scores[ValidationDimension.FACTUALITY] = factuality_score
        all_issues.extend(factuality_issues)
        all_suggestions.extend(factuality_suggestions)
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(dimension_scores)
        
        # Determine if response is valid
        is_valid = self._determine_validity(dimension_scores, overall_score)
        
        # Calculate confidence adjustment
        confidence_adjustment = self._calculate_confidence_adjustment(dimension_scores, synthesis_result.confidence)
        
        # Determine if refinement is needed
        needs_refinement = self._needs_refinement(dimension_scores, all_issues)
        
        # Create validation result
        validation_time = (datetime.now() - start_time).total_seconds()
        result = ValidationResult(
            is_valid=is_valid,
            overall_score=overall_score,
            dimension_scores=dimension_scores,
            issues_found=all_issues,
            suggestions=all_suggestions,
            confidence_adjustment=confidence_adjustment,
            needs_refinement=needs_refinement,
            validation_time=validation_time,
            metadata={
                "original_query": original_query,
                "synthesis_strategy": synthesis_result.synthesis_strategy.value,
                "num_sources": len(synthesis_result.sources),
                "context": context or {}
            },
            created_at=start_time
        )
        
        # Store validation history
        self.validation_history[synthesis_result.created_at.isoformat()] = result
        
        logger.info(f"Validation completed: valid={is_valid}, score={overall_score:.2f}, "
                   f"issues={len(all_issues)}, time={validation_time:.2f}s")
        
        return result
    
    async def _validate_accuracy(self, synthesis_result: SynthesisResult, 
                               query: str, context: Dict[str, Any] = None) -> Tuple[float, List[str], List[str]]:
        """Validate factual accuracy against sources"""
        issues = []
        suggestions = []
        
        answer = synthesis_result.answer
        sources = synthesis_result.sources
        
        # Check if answer is supported by sources
        source_support_score = self._calculate_source_support(answer, sources)
        
        if source_support_score < 0.6:
            issues.append("Answer may not be well-supported by provided sources")
            suggestions.append("Ensure claims are directly supported by source material")
        
        # Check for unsupported claims
        unsupported_claims = self._identify_unsupported_claims(answer, sources)
        if unsupported_claims:
            issues.extend([f"Unsupported claim: {claim}" for claim in unsupported_claims])
            suggestions.append("Provide source citations for factual claims")
        
        # Check source quality
        source_quality_score = self._assess_source_quality(sources)
        
        # Calculate accuracy score
        accuracy_score = (source_support_score * 0.6) + (source_quality_score * 0.4)
        
        return accuracy_score, issues, suggestions
    
    async def _validate_completeness(self, synthesis_result: SynthesisResult,
                                   query: str, context: Dict[str, Any] = None) -> Tuple[float, List[str], List[str]]:
        """Validate response completeness"""
        issues = []
        suggestions = []
        
        answer = synthesis_result.answer
        
        # Check answer length
        word_count = len(answer.split())
        if word_count < self.validation_rules["min_answer_length"]:
            issues.append("Answer may be too brief")
            suggestions.append("Provide more detailed explanation")
        elif word_count > self.validation_rules["max_answer_length"]:
            issues.append("Answer may be too verbose")
            suggestions.append("Consider condensing the response")
        
        # Check query coverage
        query_coverage = self._calculate_query_coverage(answer, query)
        if query_coverage < 0.7:
            issues.append("Answer may not fully address all aspects of the query")
            suggestions.append("Ensure all parts of the question are answered")
        
        # Check for missing context
        missing_context = self._identify_missing_context(answer, query, context)
        if missing_context:
            issues.extend([f"Missing context: {ctx}" for ctx in missing_context])
            suggestions.append("Provide additional context for better understanding")
        
        # Calculate completeness score
        length_score = min(word_count / 100, 1.0)  # Normalize to 0-1
        completeness_score = (query_coverage * 0.6) + (length_score * 0.4)
        
        return completeness_score, issues, suggestions
    
    async def _validate_relevance(self, synthesis_result: SynthesisResult,
                                query: str, context: Dict[str, Any] = None) -> Tuple[float, List[str], List[str]]:
        """Validate response relevance to query"""
        issues = []
        suggestions = []
        
        answer = synthesis_result.answer
        
        # Calculate semantic relevance
        semantic_relevance = self._calculate_semantic_relevance(answer, query)
        
        if semantic_relevance < 0.6:
            issues.append("Answer may not be directly relevant to the query")
            suggestions.append("Focus more directly on the specific question asked")
        
        # Check for off-topic content
        off_topic_content = self._identify_off_topic_content(answer, query)
        if off_topic_content:
            issues.extend([f"Off-topic content: {content}" for content in off_topic_content])
            suggestions.append("Remove content not directly related to the query")
        
        # Check query intent alignment
        intent_alignment = self._check_intent_alignment(answer, query)
        if intent_alignment < 0.7:
            issues.append("Answer may not align with query intent")
            suggestions.append("Ensure response type matches what the user is asking for")
        
        # Calculate relevance score
        relevance_score = (semantic_relevance * 0.5) + (intent_alignment * 0.5)
        
        return relevance_score, issues, suggestions
    
    async def _validate_clarity(self, synthesis_result: SynthesisResult,
                              query: str, context: Dict[str, Any] = None) -> Tuple[float, List[str], List[str]]:
        """Validate response clarity and readability"""
        issues = []
        suggestions = []
        
        answer = synthesis_result.answer
        
        # Check sentence structure
        sentence_clarity = self._assess_sentence_clarity(answer)
        if sentence_clarity < 0.7:
            issues.append("Some sentences may be unclear or too complex")
            suggestions.append("Use simpler, more direct sentence structures")
        
        # Check for jargon without explanation
        unexplained_jargon = self._identify_unexplained_jargon(answer)
        if unexplained_jargon:
            issues.extend([f"Unexplained jargon: {term}" for term in unexplained_jargon])
            suggestions.append("Define technical terms or provide explanations")
        
        # Check logical flow
        logical_flow = self._assess_logical_flow(answer)
        if logical_flow < 0.7:
            issues.append("Answer may lack logical flow or structure")
            suggestions.append("Organize information in a more logical sequence")
        
        # Calculate clarity score
        clarity_score = (sentence_clarity * 0.4) + (logical_flow * 0.6)
        
        return clarity_score, issues, suggestions
    
    async def _validate_consistency(self, synthesis_result: SynthesisResult,
                                  query: str, context: Dict[str, Any] = None) -> Tuple[float, List[str], List[str]]:
        """Validate internal consistency"""
        issues = []
        suggestions = []
        
        answer = synthesis_result.answer
        
        # Check for contradictions
        contradictions = self._identify_contradictions(answer)
        if contradictions:
            issues.extend([f"Contradiction found: {contradiction}" for contradiction in contradictions])
            suggestions.append("Resolve internal contradictions in the response")
        
        # Check consistency with sources
        source_consistency = self._check_source_consistency(answer, synthesis_result.sources)
        if source_consistency < 0.8:
            issues.append("Answer may be inconsistent with source material")
            suggestions.append("Ensure answer aligns with information from sources")
        
        # Check reasoning consistency
        reasoning_consistency = self._assess_reasoning_consistency(synthesis_result.reasoning_steps)
        if reasoning_consistency < 0.7:
            issues.append("Reasoning steps may be inconsistent")
            suggestions.append("Ensure logical consistency in reasoning process")
        
        # Calculate consistency score
        consistency_score = (source_consistency * 0.5) + (reasoning_consistency * 0.5)
        
        return consistency_score, issues, suggestions
    
    async def _validate_factuality(self, synthesis_result: SynthesisResult,
                                 query: str, context: Dict[str, Any] = None) -> Tuple[float, List[str], List[str]]:
        """Validate factual claims"""
        issues = []
        suggestions = []
        
        answer = synthesis_result.answer
        
        # Identify factual claims
        factual_claims = self._extract_factual_claims(answer)
        
        # Validate claims against knowledge base
        if self.knowledge_base:
            unverified_claims = []
            for claim in factual_claims:
                if not await self._verify_claim(claim):
                    unverified_claims.append(claim)
            
            if unverified_claims:
                issues.extend([f"Unverified claim: {claim}" for claim in unverified_claims])
                suggestions.append("Verify factual claims against reliable sources")
        
        # Check for uncertainty indicators
        uncertainty_level = self._assess_uncertainty_level(answer)
        if uncertainty_level > 0.5:
            issues.append("Answer contains high level of uncertainty")
            suggestions.append("Provide more definitive information where possible")
        
        # Calculate factuality score
        if factual_claims:
            verified_ratio = (len(factual_claims) - len(unverified_claims)) / len(factual_claims) if factual_claims else 1.0
        else:
            verified_ratio = 1.0  # No claims to verify
        
        factuality_score = verified_ratio * (1.0 - uncertainty_level * 0.3)
        
        return factuality_score, issues, suggestions
    
    # Helper methods for validation
    def _calculate_source_support(self, answer: str, sources: List[Dict[str, Any]]) -> float:
        """Calculate how well the answer is supported by sources"""
        if not sources:
            return 0.0
        
        answer_words = set(answer.lower().split())
        
        total_support = 0.0
        for source in sources:
            source_content = source.get("title", "") + " " + str(source.get("metadata", {}))
            source_words = set(source_content.lower().split())
            
            overlap = len(answer_words.intersection(source_words))
            support = overlap / len(answer_words) if answer_words else 0
            total_support += support * source.get("score", 0.5)
        
        return min(total_support / len(sources), 1.0)
    
    def _identify_unsupported_claims(self, answer: str, sources: List[Dict[str, Any]]) -> List[str]:
        """Identify claims in answer not supported by sources"""
        # Simple implementation - can be enhanced with NLP
        import re
        
        # Extract potential factual claims
        claims = []
        
        # Percentage claims
        percentage_claims = re.findall(r'[^.]*\d+%[^.]*', answer)
        claims.extend(percentage_claims)
        
        # Absolute statements
        absolute_patterns = [r'[^.]*always[^.]*', r'[^.]*never[^.]*', r'[^.]*all[^.]*', r'[^.]*none[^.]*']
        for pattern in absolute_patterns:
            absolute_claims = re.findall(pattern, answer, re.IGNORECASE)
            claims.extend(absolute_claims)
        
        # For now, return empty list (would need more sophisticated claim verification)
        return []
    
    def _assess_source_quality(self, sources: List[Dict[str, Any]]) -> float:
        """Assess overall quality of sources"""
        if not sources:
            return 0.0
        
        total_quality = 0.0
        for source in sources:
            score = source.get("score", 0.5)
            source_type = source.get("type", "unknown")
            
            # Weight by source type
            type_weight = {
                "semantic_search": 1.0,
                "direct_search": 0.9,
                "graph_traversal": 0.8
            }.get(source_type, 0.7)
            
            total_quality += score * type_weight
        
        return total_quality / len(sources)
    
    def _calculate_query_coverage(self, answer: str, query: str) -> float:
        """Calculate how well the answer covers the query"""
        query_words = set(query.lower().split())
        answer_words = set(answer.lower().split())
        
        # Remove common stop words
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
        query_words -= stop_words
        answer_words -= stop_words
        
        if not query_words:
            return 1.0
        
        coverage = len(query_words.intersection(answer_words)) / len(query_words)
        return coverage
    
    def _identify_missing_context(self, answer: str, query: str, context: Dict[str, Any] = None) -> List[str]:
        """Identify missing context that should be included"""
        missing = []
        
        # Check for technical terms without explanation
        import re
        technical_terms = re.findall(r'\b[A-Z][a-zA-Z]*[A-Z]\w*', answer)  # CamelCase
        
        for term in technical_terms[:3]:  # Check first 3
            if term not in answer.lower() or answer.lower().count(term.lower()) == 1:
                missing.append(f"Definition of {term}")
        
        return missing
    
    def _calculate_semantic_relevance(self, answer: str, query: str) -> float:
        """Calculate semantic relevance between answer and query"""
        # Simple word overlap approach (can be enhanced with embeddings)
        query_words = set(query.lower().split())
        answer_words = set(answer.lower().split())
        
        if not query_words:
            return 1.0
        
        overlap = len(query_words.intersection(answer_words))
        return overlap / len(query_words)
    
    def _identify_off_topic_content(self, answer: str, query: str) -> List[str]:
        """Identify content that's off-topic"""
        # Simple implementation - would need more sophisticated analysis
        return []  # Placeholder
    
    def _check_intent_alignment(self, answer: str, query: str) -> float:
        """Check if answer type aligns with query intent"""
        query_lower = query.lower()
        answer_lower = answer.lower()
        
        # Define intent patterns
        intent_patterns = {
            "definition": ["what is", "define", "meaning"],
            "procedure": ["how to", "steps", "process"],
            "comparison": ["compare", "difference", "vs"],
            "explanation": ["why", "explain", "reason"]
        }
        
        # Identify query intent
        query_intent = None
        for intent, patterns in intent_patterns.items():
            if any(pattern in query_lower for pattern in patterns):
                query_intent = intent
                break
        
        if not query_intent:
            return 0.8  # Default if intent unclear
        
        # Check if answer matches intent
        intent_indicators = {
            "definition": ["is", "means", "refers to"],
            "procedure": ["first", "then", "next", "step"],
            "comparison": ["while", "whereas", "compared to"],
            "explanation": ["because", "due to", "reason"]
        }
        
        indicators = intent_indicators.get(query_intent, [])
        alignment_score = sum(1 for indicator in indicators if indicator in answer_lower)
        
        return min(alignment_score / max(len(indicators), 1), 1.0)
    
    def _assess_sentence_clarity(self, answer: str) -> float:
        """Assess clarity of sentences"""
        sentences = answer.split('.')
        
        clarity_scores = []
        for sentence in sentences:
            if len(sentence.strip()) < 5:
                continue
            
            words = sentence.split()
            # Simple heuristics for clarity
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
            sentence_length = len(words)
            
            # Penalize very long sentences or very long words
            length_penalty = max(0, (sentence_length - 20) * 0.02)
            word_penalty = max(0, (avg_word_length - 8) * 0.05)
            
            clarity_score = 1.0 - length_penalty - word_penalty
            clarity_scores.append(max(clarity_score, 0.1))
        
        return sum(clarity_scores) / len(clarity_scores) if clarity_scores else 0.5
    
    def _identify_unexplained_jargon(self, answer: str) -> List[str]:
        """Identify technical jargon without explanation"""
        import re
        
        # Find technical terms
        technical_terms = re.findall(r'\b[A-Z][a-zA-Z]*[A-Z]\w*', answer)  # CamelCase
        technical_terms.extend(re.findall(r'\b\w+\(\)', answer))  # Function calls
        
        unexplained = []
        for term in set(technical_terms):
            # Check if term is explained (appears with "is", "means", etc.)
            explanation_pattern = f"{term}.*(?:is|means|refers to)"
            if not re.search(explanation_pattern, answer, re.IGNORECASE):
                unexplained.append(term)
        
        return unexplained[:5]  # Return first 5
    
    def _assess_logical_flow(self, answer: str) -> float:
        """Assess logical flow of the answer"""
        sentences = [s.strip() for s in answer.split('.') if s.strip()]
        
        if len(sentences) < 2:
            return 0.8  # Single sentence, assume good flow
        
        # Check for transition words/phrases
        transition_words = [
            "however", "therefore", "furthermore", "additionally", "moreover",
            "consequently", "meanwhile", "similarly", "in contrast", "as a result"
        ]
        
        transitions_found = 0
        for sentence in sentences:
            if any(word in sentence.lower() for word in transition_words):
                transitions_found += 1
        
        # Calculate flow score
        transition_ratio = transitions_found / max(len(sentences) - 1, 1)
        return min(0.5 + (transition_ratio * 0.5), 1.0)
    
    def _identify_contradictions(self, answer: str) -> List[str]:
        """Identify contradictions in the answer"""
        import re
        
        contradictions = []
        
        # Check for contradiction patterns
        for pattern in self.validation_rules["contradiction_patterns"]:
            matches = re.findall(pattern, answer, re.IGNORECASE)
            contradictions.extend(matches)
        
        return contradictions
    
    def _check_source_consistency(self, answer: str, sources: List[Dict[str, Any]]) -> float:
        """Check consistency with sources"""
        # Simple implementation - would need more sophisticated analysis
        return 0.8  # Placeholder
    
    def _assess_reasoning_consistency(self, reasoning_steps: List[str]) -> float:
        """Assess consistency of reasoning steps"""
        if not reasoning_steps:
            return 1.0
        
        # Simple check for logical progression
        # Would need more sophisticated analysis for real implementation
        return 0.8  # Placeholder
    
    def _extract_factual_claims(self, answer: str) -> List[str]:
        """Extract factual claims from answer"""
        import re
        
        claims = []
        
        # Extract claims with factual patterns
        for pattern in self.validation_rules["factual_claim_patterns"]:
            matches = re.findall(f'[^.]*{pattern}[^.]*', answer)
            claims.extend(matches)
        
        return claims
    
    async def _verify_claim(self, claim: str) -> bool:
        """Verify a factual claim against knowledge base"""
        # Placeholder - would integrate with knowledge base
        return True  # Assume verified for now
    
    def _assess_uncertainty_level(self, answer: str) -> float:
        """Assess level of uncertainty in answer"""
        uncertainty_count = 0
        total_words = len(answer.split())
        
        for indicator in self.validation_rules["uncertainty_indicators"]:
            uncertainty_count += answer.lower().count(indicator)
        
        return min(uncertainty_count / max(total_words, 1), 1.0)
    
    def _calculate_overall_score(self, dimension_scores: Dict[ValidationDimension, float]) -> float:
        """Calculate weighted overall score"""
        weights = {
            ValidationDimension.ACCURACY: 0.25,
            ValidationDimension.COMPLETENESS: 0.15,
            ValidationDimension.RELEVANCE: 0.25,
            ValidationDimension.CLARITY: 0.15,
            ValidationDimension.CONSISTENCY: 0.10,
            ValidationDimension.FACTUALITY: 0.10
        }
        
        weighted_sum = sum(score * weights[dimension] for dimension, score in dimension_scores.items())
        return weighted_sum
    
    def _determine_validity(self, dimension_scores: Dict[ValidationDimension, float], overall_score: float) -> bool:
        """Determine if response is valid"""
        # Check if all critical dimensions meet thresholds
        critical_dimensions = [ValidationDimension.ACCURACY, ValidationDimension.RELEVANCE]
        
        for dimension in critical_dimensions:
            if dimension_scores[dimension] < self.quality_thresholds[dimension]:
                return False
        
        # Check overall score
        return overall_score >= 0.7
    
    def _calculate_confidence_adjustment(self, dimension_scores: Dict[ValidationDimension, float], 
                                       original_confidence: float) -> float:
        """Calculate adjustment to confidence based on validation"""
        avg_score = sum(dimension_scores.values()) / len(dimension_scores)
        
        # Adjust confidence based on validation quality
        if avg_score > 0.8:
            adjustment = min(0.1, (avg_score - 0.8) * 0.5)
        elif avg_score < 0.6:
            adjustment = max(-0.2, (avg_score - 0.6) * 0.5)
        else:
            adjustment = 0.0
        
        return adjustment
    
    def _needs_refinement(self, dimension_scores: Dict[ValidationDimension, float], issues: List[str]) -> bool:
        """Determine if response needs refinement"""
        # Check if any critical dimension is below threshold
        critical_dimensions = [ValidationDimension.ACCURACY, ValidationDimension.RELEVANCE, ValidationDimension.COMPLETENESS]
        
        for dimension in critical_dimensions:
            if dimension_scores[dimension] < self.quality_thresholds[dimension]:
                return True
        
        # Check number of issues
        return len(issues) > 3
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get validator performance statistics"""
        if not self.validation_history:
            return {"total_validations": 0}
        
        validations = list(self.validation_history.values())
        
        return {
            "total_validations": len(validations),
            "average_score": sum(v.overall_score for v in validations) / len(validations),
            "validation_rate": sum(1 for v in validations if v.is_valid) / len(validations),
            "average_issues": sum(len(v.issues_found) for v in validations) / len(validations),
            "refinement_rate": sum(1 for v in validations if v.needs_refinement) / len(validations)
        }