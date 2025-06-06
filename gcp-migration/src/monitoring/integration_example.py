"""
Integration example for Enhanced Monitoring Pipeline
Shows how to integrate monitoring_setup.py with existing RAG-MCP system
"""

import asyncio
import logging
from typing import Optional
from pathlib import Path

# Import existing components
from .monitoring_setup import setup_enhanced_monitoring, EnhancedMonitoringPipeline
from .health_checks import HealthChecker
from .metrics import MCPMetrics, MetricsRegistry

# Import RAG components (adjust imports based on actual structure)
try:
    from ..core.rag_engine_openai import RAGEngine
except ImportError:
    # Mock RAG engine for testing
    class RAGEngine:
        def __init__(self):
            pass
        async def health_check(self):
            return True
        async def check_vector_db_connection(self):
            return True
        async def check_embedding_model(self):
            return True
        async def check_llm_connection(self):
            return True
        async def get_cache_stats(self):
            return {"hits": 80, "total": 100}

logger = logging.getLogger(__name__)

class IntegratedMonitoringSystem:
    """
    Integrated monitoring system that combines enhanced monitoring
    with existing RAG-MCP components
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path
        self.enhanced_monitoring: Optional[EnhancedMonitoringPipeline] = None
        self.rag_engine: Optional[RAGEngine] = None
        self.mcp_server: Optional[Any] = None  # FastAPI app or similar
        
    async def initialize(self):
        """Initialize all monitoring components"""
        logger.info("Initializing integrated monitoring system")
        
        # Setup enhanced monitoring pipeline
        self.enhanced_monitoring = await setup_enhanced_monitoring(self.config_path)
        
        # Register health checks for RAG components
        await self._register_rag_health_checks()
        
        # Setup custom metrics for business logic
        await self._setup_business_metrics()
        
        logger.info("Integrated monitoring system initialized")
    
    async def _register_rag_health_checks(self):
        """Register health checks for RAG-specific components"""
        health_checker = self.enhanced_monitoring.health_checker
        
        # RAG Engine health check
        async def check_rag_engine():
            if not self.rag_engine:
                return False
            return await self.rag_engine.health_check()
        
        health_checker.register_check("rag_engine", check_rag_engine, timeout_seconds=10.0)
        
        # Vector database health check
        async def check_vector_db():
            if not self.rag_engine:
                return False
            return await self.rag_engine.check_vector_db_connection()
        
        health_checker.register_check("vector_database", check_vector_db, timeout_seconds=5.0)
        
        # Embedding model health check
        async def check_embedding_model():
            if not self.rag_engine:
                return False
            return await self.rag_engine.check_embedding_model()
        
        health_checker.register_check("embedding_model", check_embedding_model, timeout_seconds=15.0)
        
        # LLM health check
        async def check_llm():
            if not self.rag_engine:
                return False
            return await self.rag_engine.check_llm_connection()
        
        health_checker.register_check("llm_connection", check_llm, timeout_seconds=20.0)
        
        logger.info("RAG health checks registered")
    
    async def _setup_business_metrics(self):
        """Setup business-specific metrics"""
        metrics_registry = self.enhanced_monitoring.metrics_registry
        
        # Query quality metrics
        self.query_quality_histogram = metrics_registry.histogram(
            "rag_query_quality_score",
            "Quality score of RAG responses",
            labels=["query_type", "model_used"],
            buckets=[0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 1.0]
        )
        
        # User satisfaction metrics
        self.user_satisfaction_gauge = metrics_registry.gauge(
            "rag_user_satisfaction",
            "User satisfaction score",
            labels=["feedback_type"]
        )
        
        # Cost tracking metrics
        self.cost_per_query_gauge = metrics_registry.gauge(
            "rag_cost_per_query_usd",
            "Cost per query in USD",
            labels=["model_tier", "query_complexity"]
        )
        
        # Cache hit rate
        self.cache_hit_rate_gauge = metrics_registry.gauge(
            "rag_cache_hit_rate",
            "Cache hit rate percentage"
        )
        
        logger.info("Business metrics setup completed")
    
    async def record_query_metrics(self, query: str, response: str, 
                                 duration_ms: float, success: bool,
                                 model_used: str = "gpt-4", 
                                 quality_score: Optional[float] = None):
        """Record metrics for a RAG query"""
        
        # Record basic metrics through existing MCP metrics
        status = "success" if success else "error"
        self.enhanced_monitoring.mcp_metrics.record_rag_query(
            status=status,
            duration_seconds=duration_ms / 1000.0
        )
        
        # Record quality score if available
        if quality_score is not None:
            query_type = self._classify_query_type(query)
            self.query_quality_histogram.observe(
                quality_score,
                query_type=query_type,
                model_used=model_used
            )
        
        # Record cost metrics
        cost = self._calculate_query_cost(query, response, model_used)
        complexity = self._assess_query_complexity(query)
        self.cost_per_query_gauge.set(
            cost,
            model_tier=model_used,
            query_complexity=complexity
        )
        
        # Update cache hit rate
        cache_stats = await self._get_cache_stats()
        if cache_stats:
            hit_rate = (cache_stats["hits"] / max(cache_stats["total"], 1)) * 100
            self.cache_hit_rate_gauge.set(hit_rate)
    
    def _classify_query_type(self, query: str) -> str:
        """Classify query type for metrics"""
        query_lower = query.lower()
        
        # Check generation first as it's more specific
        if any(word in query_lower for word in ["generate", "create", "write"]):
            return "generation"
        elif any(word in query_lower for word in ["find", "search", "locate"]):
            return "search"
        elif any(word in query_lower for word in ["explain", "what", "how", "why"]):
            return "explanation"
        elif any(word in query_lower for word in ["code", "function", "class", "method"]):
            return "code_analysis"
        else:
            return "general"
    
    def _calculate_query_cost(self, query: str, response: str, model: str) -> float:
        """Calculate cost for a query (simplified)"""
        # Simplified cost calculation
        # In production, use actual token counts and pricing
        
        input_tokens = len(query.split()) * 1.3  # Rough estimate
        output_tokens = len(response.split()) * 1.3
        
        # GPT-4 pricing (approximate)
        if "gpt-4" in model.lower():
            input_cost = input_tokens * 0.00003  # $0.03 per 1K tokens
            output_cost = output_tokens * 0.00006  # $0.06 per 1K tokens
        else:
            input_cost = input_tokens * 0.000001  # Cheaper model
            output_cost = output_tokens * 0.000002
        
        return input_cost + output_cost
    
    def _assess_query_complexity(self, query: str) -> str:
        """Assess query complexity"""
        word_count = len(query.split())
        
        if word_count < 10:
            return "simple"
        elif word_count < 50:
            return "medium"
        else:
            return "complex"
    
    async def _get_cache_stats(self) -> Optional[dict]:
        """Get cache statistics"""
        if not self.rag_engine:
            return None
        
        try:
            return await self.rag_engine.get_cache_stats()
        except:
            return None
    
    async def record_user_feedback(self, satisfaction_score: float, feedback_type: str = "rating"):
        """Record user satisfaction feedback"""
        self.user_satisfaction_gauge.set(
            satisfaction_score,
            feedback_type=feedback_type
        )
        
        logger.info(f"User feedback recorded: {satisfaction_score} ({feedback_type})")
    
    async def start_monitoring(self):
        """Start the integrated monitoring system"""
        logger.info("Starting integrated monitoring system")
        
        # Start enhanced monitoring loop
        monitoring_task = asyncio.create_task(
            self.enhanced_monitoring.start_monitoring_loop()
        )
        
        # Start periodic health checks
        health_check_task = asyncio.create_task(
            self._periodic_health_checks()
        )
        
        # Start business metrics collection
        business_metrics_task = asyncio.create_task(
            self._periodic_business_metrics()
        )
        
        # Wait for all tasks
        await asyncio.gather(
            monitoring_task,
            health_check_task,
            business_metrics_task,
            return_exceptions=True
        )
    
    async def _periodic_health_checks(self):
        """Run periodic health checks"""
        while True:
            try:
                # Run all health checks
                results = await self.enhanced_monitoring.health_checker.run_all_checks()
                
                # Log any unhealthy components
                for name, result in results.items():
                    if result.status != "healthy":
                        logger.warning(f"Health check failed: {name} - {result.message}")
                
                # Wait 30 seconds before next check
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Health check loop error: {e}")
                await asyncio.sleep(60)
    
    async def _periodic_business_metrics(self):
        """Collect business metrics periodically"""
        while True:
            try:
                # Update cache hit rate
                cache_stats = await self._get_cache_stats()
                if cache_stats:
                    hit_rate = (cache_stats["hits"] / max(cache_stats["total"], 1)) * 100
                    self.cache_hit_rate_gauge.set(hit_rate)
                
                # Wait 5 minutes before next collection
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"Business metrics collection error: {e}")
                await asyncio.sleep(300)
    
    def get_monitoring_dashboard_data(self) -> dict:
        """Get data for monitoring dashboard"""
        if not self.enhanced_monitoring:
            return {}
        
        # Get enhanced monitoring status
        monitoring_status = self.enhanced_monitoring.get_monitoring_status()
        
        # Get health check results
        health_summary = self.enhanced_monitoring.health_checker.get_health_summary()
        
        # Get metrics summary
        metrics_summary = self.enhanced_monitoring.metrics_registry.get_all_metrics()
        
        return {
            "monitoring_status": monitoring_status,
            "health_summary": health_summary,
            "metrics_summary": metrics_summary,
            "timestamp": asyncio.get_event_loop().time()
        }

# Example usage and integration
async def setup_integrated_monitoring(rag_engine, mcp_server=None, config_path: Optional[str] = None):
    """Setup integrated monitoring for RAG-MCP system"""
    
    # Create integrated monitoring system
    monitoring_system = IntegratedMonitoringSystem(config_path)
    
    # Set RAG components
    monitoring_system.rag_engine = rag_engine
    monitoring_system.mcp_server = mcp_server
    
    # Initialize monitoring
    await monitoring_system.initialize()
    
    return monitoring_system

# FastAPI integration example
def add_monitoring_endpoints(app, monitoring_system: IntegratedMonitoringSystem):
    """Add monitoring endpoints to FastAPI app"""
    
    @app.get("/monitoring/status")
    async def get_monitoring_status():
        """Get comprehensive monitoring status"""
        return monitoring_system.get_monitoring_dashboard_data()
    
    @app.get("/monitoring/health")
    async def get_health_status():
        """Get health check status"""
        if not monitoring_system.enhanced_monitoring:
            return {"status": "not_initialized"}
        
        return monitoring_system.enhanced_monitoring.health_checker.get_health_summary()
    
    @app.get("/monitoring/metrics")
    async def get_metrics():
        """Get Prometheus metrics"""
        if not monitoring_system.enhanced_monitoring:
            return {"error": "monitoring not initialized"}
        
        return monitoring_system.enhanced_monitoring.metrics_registry.export_prometheus()
    
    @app.post("/monitoring/feedback")
    async def record_feedback(satisfaction_score: float, feedback_type: str = "rating"):
        """Record user feedback"""
        await monitoring_system.record_user_feedback(satisfaction_score, feedback_type)
        return {"status": "recorded"}
    
    @app.get("/monitoring/gpu-status")
    async def get_gpu_status():
        """Get GPU tier and upgrade status"""
        if not monitoring_system.enhanced_monitoring:
            return {"error": "monitoring not initialized"}
        
        status = monitoring_system.enhanced_monitoring.get_monitoring_status()
        return {
            "current_gpu_tier": status["current_gpu_tier"],
            "upgrade_in_progress": status["upgrade_in_progress"],
            "last_upgrade_time": status["last_upgrade_time"],
            "active_triggers": status["active_triggers"]
        }

if __name__ == "__main__":
    # Example of how to use the integrated monitoring
    async def main():
        # Initialize your RAG engine and MCP server here
        # rag_engine = RAGEngine(...)
        # mcp_server = MCPServer(...)
        
        # Setup monitoring
        config_path = "configs/monitoring_config.json"
        # monitoring = await setup_integrated_monitoring(rag_engine, mcp_server, config_path)
        
        # Start monitoring
        # await monitoring.start_monitoring()
        
        print("Integrated monitoring example - see code for actual implementation")
    
    asyncio.run(main())