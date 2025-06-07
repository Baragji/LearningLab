#!/usr/bin/env python3
"""
RAG Integration with TigerGraph
Provides graph-enhanced RAG capabilities for code assistance
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from enum import Enum

from .tigergraph_client import TigerGraphClient, GraphConfig
from .query_engine import GraphQueryEngine, QueryType, GraphSearchResult
from .schema_manager import GraphSchemaManager

logger = logging.getLogger(__name__)

class RAGQueryType(Enum):
    """Types of RAG queries enhanced with graph data"""
    CODE_SEARCH = "code_search"
    FUNCTION_EXPLANATION = "function_explanation"
    DEPENDENCY_ANALYSIS = "dependency_analysis"
    SIMILAR_CODE = "similar_code"
    CODE_GENERATION = "code_generation"
    DEBUGGING_HELP = "debugging_help"
    REFACTORING_SUGGESTIONS = "refactoring_suggestions"
    DOCUMENTATION_LOOKUP = "documentation_lookup"

@dataclass
class RAGContext:
    """Context for RAG queries"""
    query: str
    query_type: RAGQueryType
    user_context: Dict[str, Any]
    graph_context: Optional[Dict[str, Any]] = None
    vector_context: Optional[Dict[str, Any]] = None
    max_results: int = 10
    include_explanations: bool = True

@dataclass
class RAGResponse:
    """Enhanced RAG response with graph insights"""
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    graph_insights: Dict[str, Any]
    execution_time: float
    query_type: RAGQueryType
    metadata: Optional[Dict[str, Any]] = None

class GraphEnhancedRAG:
    """
    Graph-enhanced RAG system that combines vector search with graph analytics
    Provides richer context and better code understanding
    """
    
    def __init__(self, graph_client: TigerGraphClient, vector_rag_engine=None):
        self.graph_client = graph_client
        self.query_engine = GraphQueryEngine(graph_client)
        self.vector_rag = vector_rag_engine
        self.schema_manager = GraphSchemaManager(graph_client)
        
        # Query routing configuration
        self.query_routing = {
            RAGQueryType.CODE_SEARCH: self._handle_code_search,
            RAGQueryType.FUNCTION_EXPLANATION: self._handle_function_explanation,
            RAGQueryType.DEPENDENCY_ANALYSIS: self._handle_dependency_analysis,
            RAGQueryType.SIMILAR_CODE: self._handle_similar_code,
            RAGQueryType.CODE_GENERATION: self._handle_code_generation,
            RAGQueryType.DEBUGGING_HELP: self._handle_debugging_help,
            RAGQueryType.REFACTORING_SUGGESTIONS: self._handle_refactoring_suggestions,
            RAGQueryType.DOCUMENTATION_LOOKUP: self._handle_documentation_lookup
        }
    
    async def query(self, rag_context: RAGContext) -> RAGResponse:
        """Main query interface for graph-enhanced RAG"""
        start_time = time.time()
        
        try:
            logger.info(f"Processing RAG query: {rag_context.query_type.value}")
            
            # Route query to appropriate handler
            handler = self.query_routing.get(rag_context.query_type)
            if not handler:
                raise ValueError(f"Unsupported query type: {rag_context.query_type}")
            
            # Execute query with graph enhancement
            response = await handler(rag_context)
            
            # Add execution time
            response.execution_time = time.time() - start_time
            
            logger.info(f"RAG query completed in {response.execution_time:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            return RAGResponse(
                answer=f"Sorry, I encountered an error: {str(e)}",
                confidence=0.0,
                sources=[],
                graph_insights={},
                execution_time=time.time() - start_time,
                query_type=rag_context.query_type,
                metadata={"error": str(e)}
            )
    
    async def _handle_code_search(self, context: RAGContext) -> RAGResponse:
        """Handle code search queries with graph enhancement"""
        try:
            # Step 1: Extract search terms and intent
            search_terms = self._extract_search_terms(context.query)
            
            # Step 2: Perform graph-based search
            graph_results = await self._multi_modal_search(search_terms, context)
            
            # Step 3: Enhance with vector search if available
            if self.vector_rag:
                vector_results = await self._get_vector_context(context.query)
                combined_results = self._combine_search_results(graph_results, vector_results)
            else:
                combined_results = graph_results
            
            # Step 4: Generate response
            answer = await self._generate_code_search_response(combined_results, context)
            
            return RAGResponse(
                answer=answer,
                confidence=self._calculate_confidence(combined_results),
                sources=self._format_sources(combined_results),
                graph_insights=self._extract_graph_insights(graph_results),
                execution_time=0.0,  # Will be set by caller
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Code search failed: {e}")
            raise e
    
    async def _handle_function_explanation(self, context: RAGContext) -> RAGResponse:
        """Handle function explanation with graph context"""
        try:
            # Extract function identifier
            function_id = self._extract_function_identifier(context.query)
            
            if not function_id:
                return await self._handle_general_explanation(context)
            
            # Get function details from graph
            function_details = await self._get_function_details(function_id)
            
            # Get function neighborhood for context
            neighborhood = await self.query_engine.get_neighborhood(function_id, hops=2)
            
            # Get similar functions
            similar_functions = await self.query_engine.similarity_search(function_id, limit=5)
            
            # Generate comprehensive explanation
            answer = await self._generate_function_explanation(
                function_details, neighborhood, similar_functions, context
            )
            
            graph_insights = {
                "function_complexity": function_details.get("complexity", 0),
                "dependencies": len(neighborhood.results),
                "similar_functions": len(similar_functions.results),
                "call_patterns": self._analyze_call_patterns(neighborhood.results)
            }
            
            return RAGResponse(
                answer=answer,
                confidence=0.9 if function_details else 0.3,
                sources=[function_details] if function_details else [],
                graph_insights=graph_insights,
                execution_time=0.0,
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Function explanation failed: {e}")
            raise e
    
    async def _handle_dependency_analysis(self, context: RAGContext) -> RAGResponse:
        """Handle dependency analysis queries"""
        try:
            # Extract target for dependency analysis
            target_id = self._extract_target_identifier(context.query)
            
            if not target_id:
                return RAGResponse(
                    answer="Please specify a function or module for dependency analysis.",
                    confidence=0.0,
                    sources=[],
                    graph_insights={},
                    execution_time=0.0,
                    query_type=context.query_type
                )
            
            # Perform dependency analysis
            dependencies = await self.query_engine.find_dependencies(target_id, depth=3)
            
            # Analyze dependency patterns
            dependency_analysis = self._analyze_dependencies(dependencies.results)
            
            # Generate analysis report
            answer = await self._generate_dependency_report(dependency_analysis, context)
            
            return RAGResponse(
                answer=answer,
                confidence=0.8 if dependencies.results else 0.2,
                sources=dependencies.results,
                graph_insights=dependency_analysis,
                execution_time=0.0,
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Dependency analysis failed: {e}")
            raise e
    
    async def _handle_similar_code(self, context: RAGContext) -> RAGResponse:
        """Handle similar code search"""
        try:
            # Extract code context
            code_context = self._extract_code_context(context.query)
            
            # Find similar functions/patterns
            if code_context.get("function_id"):
                similar_results = await self.query_engine.similarity_search(
                    code_context["function_id"], 
                    limit=context.max_results
                )
            else:
                # Use semantic search with query embedding
                query_embedding = await self._get_query_embedding(context.query)
                similar_results = await self.query_engine.semantic_search(
                    query_embedding,
                    threshold=0.7,
                    limit=context.max_results
                )
            
            # Extract results from GraphSearchResult
            results_list = similar_results.results if hasattr(similar_results, 'results') else []
            
            # Generate similarity report
            answer = await self._generate_similarity_report(results_list, context)
            
            return RAGResponse(
                answer=answer,
                confidence=self._calculate_similarity_confidence(results_list),
                sources=self._format_sources(results_list),
                graph_insights=self._extract_similarity_insights(results_list),
                execution_time=0.0,
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Similar code search failed: {e}")
            raise e
    
    async def _handle_code_generation(self, context: RAGContext) -> RAGResponse:
        """Handle code generation with graph context"""
        try:
            # Get relevant code examples from graph
            examples = await self._get_relevant_examples(context.query)
            
            # Get patterns and best practices
            patterns = await self._get_code_patterns(context.query)
            
            # Generate code with context
            if self.vector_rag:
                # Use vector RAG for generation with graph context
                enhanced_context = {
                    "examples": examples,
                    "patterns": patterns,
                    "query": context.query
                }
                answer = await self._generate_with_vector_rag(enhanced_context)
            else:
                # Generate based on graph patterns only
                answer = await self._generate_from_patterns(patterns, context)
            
            return RAGResponse(
                answer=answer,
                confidence=0.7,
                sources=examples + patterns,
                graph_insights={"patterns_used": len(patterns), "examples_found": len(examples)},
                execution_time=0.0,
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Code generation failed: {e}")
            raise e
    
    async def _handle_debugging_help(self, context: RAGContext) -> RAGResponse:
        """Handle debugging assistance"""
        try:
            # Extract error context
            error_context = self._extract_error_context(context.query)
            
            # Find related code and common issues
            related_code = await self._find_related_debugging_code(error_context)
            
            # Get debugging patterns
            debugging_patterns = await self._get_debugging_patterns(error_context)
            
            # Generate debugging advice
            answer = await self._generate_debugging_advice(
                error_context, related_code, debugging_patterns, context
            )
            
            return RAGResponse(
                answer=answer,
                confidence=0.6,
                sources=related_code + debugging_patterns,
                graph_insights={"related_issues": len(related_code)},
                execution_time=0.0,
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Debugging help failed: {e}")
            raise e
    
    async def _handle_refactoring_suggestions(self, context: RAGContext) -> RAGResponse:
        """Handle refactoring suggestions"""
        try:
            # Extract code to refactor
            target_code = self._extract_refactoring_target(context.query)
            
            # Analyze code structure
            structure_analysis = await self._analyze_code_structure(target_code)
            
            # Find refactoring opportunities
            opportunities = await self._find_refactoring_opportunities(structure_analysis)
            
            # Generate refactoring suggestions
            answer = await self._generate_refactoring_suggestions(opportunities, context)
            
            return RAGResponse(
                answer=answer,
                confidence=0.7,
                sources=opportunities,
                graph_insights=structure_analysis,
                execution_time=0.0,
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Refactoring suggestions failed: {e}")
            raise e
    
    async def _handle_documentation_lookup(self, context: RAGContext) -> RAGResponse:
        """Handle documentation lookup"""
        try:
            # Search documentation in graph
            doc_query = f"""
            SELECT d FROM Documentation:d
            WHERE d.content LIKE "%{context.query}%" OR d.title LIKE "%{context.query}%"
            ORDER BY d.relevance_score DESC
            LIMIT {context.max_results}
            """
            
            doc_results = await self.graph_client.execute_query(doc_query)
            
            # Find related code elements
            related_code = await self._find_documented_code(doc_results.data if doc_results.success else [])
            
            # Generate documentation response
            answer = await self._generate_documentation_response(doc_results, related_code, context)
            
            return RAGResponse(
                answer=answer,
                confidence=0.8 if doc_results.success else 0.2,
                sources=doc_results.data if doc_results.success else [],
                graph_insights={"related_code_elements": len(related_code)},
                execution_time=0.0,
                query_type=context.query_type
            )
            
        except Exception as e:
            logger.error(f"Documentation lookup failed: {e}")
            raise e
    
    # Helper methods
    def _extract_search_terms(self, query: str) -> List[str]:
        """Extract search terms from query"""
        # Simple implementation - can be enhanced with NLP
        import re
        terms = re.findall(r'\b\w+\b', query.lower())
        return [term for term in terms if len(term) > 2]
    
    def _extract_function_identifier(self, query: str) -> Optional[str]:
        """Extract function identifier from query"""
        # Look for function names or IDs in the query
        import re
        
        # Pattern for function names
        func_pattern = r'function\s+(\w+)|(\w+)\s*\('
        matches = re.findall(func_pattern, query, re.IGNORECASE)
        
        if matches:
            return matches[0][0] or matches[0][1]
        
        return None
    
    def _extract_target_identifier(self, query: str) -> Optional[str]:
        """Extract target identifier for analysis"""
        # Similar to function identifier but more general
        return self._extract_function_identifier(query)
    
    def _extract_code_context(self, query: str) -> Dict[str, Any]:
        """Extract code context from query"""
        return {
            "function_id": self._extract_function_identifier(query),
            "language": self._detect_language(query),
            "keywords": self._extract_search_terms(query)
        }
    
    def _detect_language(self, query: str) -> Optional[str]:
        """Detect programming language from query"""
        query_lower = query.lower()
        
        # Check for explicit language mentions first
        if "python" in query_lower:
            return "python"
        elif "javascript" in query_lower or " js " in query_lower:
            return "javascript"
        elif "java" in query_lower and "javascript" not in query_lower:
            return "java"
        elif "cpp" in query_lower or "c++" in query_lower:
            return "cpp"
        
        # Check for language-specific patterns
        if "def " in query_lower or "import " in query_lower:
            return "python"
        elif "const " in query_lower or "let " in query_lower or "var " in query_lower:
            return "javascript"
        elif "public class" in query_lower or "private class" in query_lower:
            return "java"
        elif "#include" in query_lower or "namespace" in query_lower:
            return "cpp"
        
        return None
    
    async def _multi_modal_search(self, search_terms: List[str], context: RAGContext) -> List[Dict[str, Any]]:
        """Perform multi-modal search across graph"""
        results = []
        
        # Search functions
        for term in search_terms:
            func_query = f"""
            SELECT f FROM Function:f
            WHERE f.function_name LIKE "%{term}%" OR f.docstring LIKE "%{term}%"
            LIMIT 5
            """
            func_result = await self.graph_client.execute_query(func_query)
            if func_result.success:
                results.extend(func_result.data if isinstance(func_result.data, list) else [func_result.data])
        
        return results
    
    async def _get_vector_context(self, query: str) -> List[Dict[str, Any]]:
        """Get context from vector RAG if available"""
        if not self.vector_rag:
            return []
        
        try:
            # This would call your existing vector RAG system
            # Implementation depends on your vector RAG interface
            return []
        except Exception as e:
            logger.warning(f"Vector context retrieval failed: {e}")
            return []
    
    def _combine_search_results(self, graph_results: List[Dict[str, Any]], 
                               vector_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Combine graph and vector search results"""
        # Simple combination - can be enhanced with ranking
        combined = graph_results + vector_results
        
        # Remove duplicates based on ID
        seen_ids = set()
        unique_results = []
        for result in combined:
            result_id = result.get("id")
            if result_id and result_id not in seen_ids:
                seen_ids.add(result_id)
                unique_results.append(result)
        
        return unique_results
    
    async def _generate_code_search_response(self, results: List[Dict[str, Any]], 
                                           context: RAGContext) -> str:
        """Generate response for code search"""
        if not results:
            return "No relevant code found for your search query."
        
        response_parts = ["Here are the relevant code elements I found:\n"]
        
        for i, result in enumerate(results[:context.max_results], 1):
            name = result.get("function_name") or result.get("class_name") or result.get("file_name", "Unknown")
            description = result.get("docstring") or result.get("summary", "No description available")
            
            response_parts.append(f"{i}. **{name}**")
            response_parts.append(f"   {description[:200]}...")
            response_parts.append("")
        
        return "\n".join(response_parts)
    
    def _calculate_confidence(self, results: List[Dict[str, Any]]) -> float:
        """Calculate confidence score for results"""
        if not results:
            return 0.0
        
        # Simple confidence calculation based on result count and quality
        base_confidence = min(len(results) / 10.0, 1.0)  # More results = higher confidence
        
        # Adjust based on result quality (if available)
        quality_scores = []
        for result in results:
            if "confidence" in result:
                quality_scores.append(result["confidence"])
            elif "similarity_score" in result:
                quality_scores.append(result["similarity_score"])
        
        if quality_scores:
            avg_quality = sum(quality_scores) / len(quality_scores)
            return (base_confidence + avg_quality) / 2.0
        
        return base_confidence
    
    def _format_sources(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format results as sources"""
        sources = []
        for result in results:
            source = {
                "id": result.get("id"),
                "type": result.get("type", "unknown"),
                "name": result.get("function_name") or result.get("class_name") or result.get("file_name"),
                "description": result.get("docstring") or result.get("summary"),
                "confidence": result.get("confidence", 0.5)
            }
            sources.append(source)
        
        return sources
    
    def _extract_graph_insights(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract insights from graph results"""
        insights = {
            "total_results": len(results),
            "result_types": {},
            "complexity_distribution": {},
            "language_distribution": {}
        }
        
        for result in results:
            # Count result types
            result_type = result.get("type", "unknown")
            insights["result_types"][result_type] = insights["result_types"].get(result_type, 0) + 1
            
            # Complexity distribution
            complexity = result.get("complexity", 0)
            if complexity > 0:
                complexity_bucket = "low" if complexity < 5 else "medium" if complexity < 15 else "high"
                insights["complexity_distribution"][complexity_bucket] = \
                    insights["complexity_distribution"].get(complexity_bucket, 0) + 1
        
        return insights
    
    async def _get_function_details(self, function_id: str) -> Dict[str, Any]:
        """Get detailed function information"""
        try:
            query = f"""
            SELECT f FROM Function:f
            WHERE f.id == "{function_id}"
            """
            result = await self.graph_client.execute_query(query)
            
            if result.success and result.data:
                function_data = result.data[0] if isinstance(result.data, list) else result.data
                return {
                    "id": function_data.get("id"),
                    "name": function_data.get("function_name"),
                    "signature": function_data.get("signature"),
                    "docstring": function_data.get("docstring"),
                    "complexity": function_data.get("complexity", 0),
                    "lines_of_code": function_data.get("lines_of_code", 0)
                }
            else:
                return {"error": "Function not found"}
                
        except Exception as e:
            logger.error(f"Failed to get function details: {e}")
            return {"error": str(e)}
    
    def _analyze_dependencies(self, dependencies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze dependency relationships"""
        analysis = {
            "total_dependencies": len(dependencies),
            "dependency_types": {},
            "complexity_impact": "low",
            "recommendations": []
        }
        
        # Categorize dependencies
        for dep in dependencies:
            dep_type = dep.get("type", "unknown")
            analysis["dependency_types"][dep_type] = analysis["dependency_types"].get(dep_type, 0) + 1
        
        # Determine complexity impact
        if len(dependencies) > 10:
            analysis["complexity_impact"] = "high"
            analysis["recommendations"].append("Consider refactoring to reduce dependencies")
        elif len(dependencies) > 5:
            analysis["complexity_impact"] = "medium"
            analysis["recommendations"].append("Monitor dependency growth")
        else:
            analysis["recommendations"].append("Dependency count is manageable")
        
        return analysis
    
    async def _generate_similarity_report(self, similar_results: List[Dict[str, Any]], 
                                        context: RAGContext) -> str:
        """Generate similarity analysis report"""
        if not similar_results:
            return "No similar code found."
        
        report_parts = ["## Similar Code Analysis\n"]
        
        for i, result in enumerate(similar_results[:5], 1):
            name = result.get("function_name", "Unknown")
            similarity = result.get("similarity_score", 0.0)
            description = result.get("docstring", "No description available")
            
            report_parts.append(f"### {i}. {name} (Similarity: {similarity:.2f})")
            report_parts.append(f"{description[:150]}...")
            report_parts.append("")
        
        # Add insights
        avg_similarity = sum(r.get("similarity_score", 0) for r in similar_results) / len(similar_results)
        report_parts.append(f"**Average Similarity:** {avg_similarity:.2f}")
        
        if avg_similarity > 0.8:
            report_parts.append("**Insight:** High similarity detected - consider code deduplication.")
        elif avg_similarity > 0.6:
            report_parts.append("**Insight:** Moderate similarity - potential for refactoring.")
        else:
            report_parts.append("**Insight:** Low similarity - code appears unique.")
        
        return "\n".join(report_parts)
    
    async def _generate_function_explanation(self, function_details: Dict[str, Any], 
                                           neighborhood: Any, similar_functions: Any,
                                           context: RAGContext) -> str:
        """Generate detailed function explanation"""
        if "error" in function_details:
            return f"Could not retrieve function details: {function_details['error']}"
        
        explanation_parts = [f"## Function: {function_details.get('name', 'Unknown')}"]
        
        # Add signature
        if function_details.get('signature'):
            explanation_parts.append(f"**Signature:** `{function_details['signature']}`")
        
        # Add description
        if function_details.get('docstring'):
            explanation_parts.append(f"**Description:** {function_details['docstring']}")
        else:
            explanation_parts.append("**Description:** No documentation available")
        
        # Add complexity info
        complexity = function_details.get('complexity', 0)
        if complexity > 0:
            complexity_level = "Low" if complexity < 5 else "Medium" if complexity < 15 else "High"
            explanation_parts.append(f"**Complexity:** {complexity_level} ({complexity})")
        
        # Add size info
        loc = function_details.get('lines_of_code', 0)
        if loc > 0:
            explanation_parts.append(f"**Size:** {loc} lines of code")
        
        # Add neighborhood info
        if hasattr(neighborhood, 'results') and neighborhood.results:
            explanation_parts.append(f"**Dependencies:** {len(neighborhood.results)} related functions")
        
        # Add similarity info
        if hasattr(similar_functions, 'results') and similar_functions.results:
            explanation_parts.append(f"**Similar Functions:** {len(similar_functions.results)} found")
        
        return "\n\n".join(explanation_parts)
    
    async def _generate_dependency_report(self, dependency_analysis: Dict[str, Any], 
                                        context: RAGContext) -> str:
        """Generate dependency analysis report"""
        report_parts = ["## Dependency Analysis"]
        
        total_deps = dependency_analysis.get('total_dependencies', 0)
        report_parts.append(f"**Total Dependencies:** {total_deps}")
        
        # Dependency types breakdown
        dep_types = dependency_analysis.get('dependency_types', {})
        if dep_types:
            report_parts.append("**Dependency Types:**")
            for dep_type, count in dep_types.items():
                report_parts.append(f"- {dep_type}: {count}")
        
        # Complexity impact
        impact = dependency_analysis.get('complexity_impact', 'unknown')
        report_parts.append(f"**Complexity Impact:** {impact.title()}")
        
        # Recommendations
        recommendations = dependency_analysis.get('recommendations', [])
        if recommendations:
            report_parts.append("**Recommendations:**")
            for rec in recommendations:
                report_parts.append(f"- {rec}")
        
        return "\n\n".join(report_parts)
    
    def _calculate_similarity_confidence(self, results: List[Dict[str, Any]]) -> float:
        """Calculate confidence for similarity results"""
        if not results:
            return 0.0
        
        # Use similarity scores if available
        similarity_scores = [r.get('similarity_score', 0.5) for r in results]
        avg_similarity = sum(similarity_scores) / len(similarity_scores)
        
        # Adjust based on number of results
        result_factor = min(len(results) / 5.0, 1.0)
        
        return avg_similarity * result_factor
    
    def _extract_similarity_insights(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract insights from similarity results"""
        if not results:
            return {"total_similar": 0}
        
        insights = {
            "total_similar": len(results),
            "avg_similarity": 0.0,
            "high_similarity_count": 0,
            "similarity_distribution": {"high": 0, "medium": 0, "low": 0}
        }
        
        similarity_scores = [r.get('similarity_score', 0.0) for r in results]
        if similarity_scores:
            insights["avg_similarity"] = sum(similarity_scores) / len(similarity_scores)
            
            for score in similarity_scores:
                if score > 0.8:
                    insights["similarity_distribution"]["high"] += 1
                    insights["high_similarity_count"] += 1
                elif score > 0.6:
                    insights["similarity_distribution"]["medium"] += 1
                else:
                    insights["similarity_distribution"]["low"] += 1
        
        return insights
    
    def _analyze_call_patterns(self, neighborhood_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze call patterns from neighborhood results"""
        if not neighborhood_results:
            return {"total_calls": 0, "pattern": "isolated"}
        
        patterns = {
            "total_calls": len(neighborhood_results),
            "incoming_calls": 0,
            "outgoing_calls": 0,
            "pattern": "unknown"
        }
        
        # Simple pattern analysis
        for result in neighborhood_results:
            if result.get("relationship_type") == "calls":
                patterns["outgoing_calls"] += 1
            elif result.get("relationship_type") == "called_by":
                patterns["incoming_calls"] += 1
        
        # Determine pattern
        if patterns["incoming_calls"] > patterns["outgoing_calls"]:
            patterns["pattern"] = "utility_function"
        elif patterns["outgoing_calls"] > patterns["incoming_calls"]:
            patterns["pattern"] = "orchestrator"
        else:
            patterns["pattern"] = "balanced"
        
        return patterns
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            graph_stats = await self.graph_client.get_graph_stats()
            query_stats = self.query_engine.get_query_stats()
            
            return {
                "graph_stats": graph_stats,
                "query_stats": query_stats,
                "supported_query_types": [qt.value for qt in RAGQueryType],
                "system_status": "healthy" if graph_stats.get("connected") else "unhealthy"
            }
        except Exception as e:
            return {"error": str(e), "system_status": "unhealthy"}

# Factory function for easy setup
async def create_graph_enhanced_rag(graph_config: GraphConfig = None, 
                                   vector_rag_engine=None) -> GraphEnhancedRAG:
    """Create and initialize graph-enhanced RAG system"""
    if graph_config is None:
        graph_config = GraphConfig()
    
    # Create and connect graph client
    graph_client = TigerGraphClient(graph_config)
    await graph_client.connect()
    
    # Create RAG system
    rag_system = GraphEnhancedRAG(graph_client, vector_rag_engine)
    
    return rag_system