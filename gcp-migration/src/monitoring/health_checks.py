"""Health checks and monitoring for MCP Enterprise server."""

import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class HealthStatus(Enum):
    """Health check status enumeration"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

@dataclass
class HealthCheckResult:
    """Result of a health check"""
    name: str
    status: HealthStatus
    message: str
    duration_ms: float
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        result['status'] = self.status.value
        result['timestamp'] = self.timestamp.isoformat()
        return result

@dataclass
class SystemMetrics:
    """System performance metrics"""
    timestamp: datetime
    cpu_usage_percent: float
    memory_usage_mb: float
    memory_usage_percent: float
    disk_usage_percent: float
    active_connections: int
    request_count_1min: int
    request_count_1hour: int
    avg_response_time_ms: float
    error_rate_percent: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        return result

class HealthChecker:
    """
    Enterprise health checking system for MCP server
    """
    
    def __init__(self):
        self.checks = {}
        self.last_results = {}
        self.metrics_history = []
        self.max_history_size = 1000
        
        # Performance tracking
        self.request_times = []
        self.error_count = 0
        self.request_count = 0
        self.start_time = time.time()
        
        logger.info("Health checker initialized")
    
    def register_check(self, name: str, check_func, timeout_seconds: float = 5.0):
        """
        Register a health check function
        """
        self.checks[name] = {
            'func': check_func,
            'timeout': timeout_seconds
        }
        logger.info(f"Registered health check: {name}")
    
    async def run_check(self, name: str) -> HealthCheckResult:
        """
        Run a specific health check
        """
        if name not in self.checks:
            return HealthCheckResult(
                name=name,
                status=HealthStatus.UNKNOWN,
                message=f"Health check '{name}' not found",
                duration_ms=0.0,
                timestamp=datetime.utcnow()
            )
        
        check_config = self.checks[name]
        start_time = time.time()
        
        try:
            # Run check with timeout
            result = await asyncio.wait_for(
                check_config['func'](),
                timeout=check_config['timeout']
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            if isinstance(result, HealthCheckResult):
                result.duration_ms = duration_ms
                result.timestamp = datetime.utcnow()
                return result
            elif isinstance(result, bool):
                return HealthCheckResult(
                    name=name,
                    status=HealthStatus.HEALTHY if result else HealthStatus.UNHEALTHY,
                    message="Check passed" if result else "Check failed",
                    duration_ms=duration_ms,
                    timestamp=datetime.utcnow()
                )
            else:
                return HealthCheckResult(
                    name=name,
                    status=HealthStatus.HEALTHY,
                    message=str(result),
                    duration_ms=duration_ms,
                    timestamp=datetime.utcnow()
                )
                
        except asyncio.TimeoutError:
            duration_ms = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Health check timed out after {check_config['timeout']}s",
                duration_ms=duration_ms,
                timestamp=datetime.utcnow()
            )
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Health check '{name}' failed: {e}")
            return HealthCheckResult(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Health check failed: {str(e)}",
                duration_ms=duration_ms,
                timestamp=datetime.utcnow()
            )
    
    async def run_all_checks(self) -> Dict[str, HealthCheckResult]:
        """
        Run all registered health checks
        """
        results = {}
        
        # Run all checks concurrently
        tasks = [self.run_check(name) for name in self.checks.keys()]
        check_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, name in enumerate(self.checks.keys()):
            result = check_results[i]
            if isinstance(result, Exception):
                results[name] = HealthCheckResult(
                    name=name,
                    status=HealthStatus.UNHEALTHY,
                    message=f"Check execution failed: {str(result)}",
                    duration_ms=0.0,
                    timestamp=datetime.utcnow()
                )
            else:
                results[name] = result
        
        # Store results
        self.last_results = results
        
        return results
    
    def get_overall_status(self) -> HealthStatus:
        """
        Get overall system health status
        """
        if not self.last_results:
            return HealthStatus.UNKNOWN
        
        statuses = [result.status for result in self.last_results.values()]
        
        if any(status == HealthStatus.UNHEALTHY for status in statuses):
            return HealthStatus.UNHEALTHY
        elif any(status == HealthStatus.DEGRADED for status in statuses):
            return HealthStatus.DEGRADED
        elif all(status == HealthStatus.HEALTHY for status in statuses):
            return HealthStatus.HEALTHY
        else:
            return HealthStatus.UNKNOWN
    
    def record_request(self, duration_ms: float, is_error: bool = False):
        """
        Record a request for metrics tracking
        """
        self.request_count += 1
        self.request_times.append((time.time(), duration_ms))
        
        if is_error:
            self.error_count += 1
        
        # Keep only recent request times (last hour)
        cutoff_time = time.time() - 3600  # 1 hour
        self.request_times = [(t, d) for t, d in self.request_times if t > cutoff_time]
    
    def get_metrics(self) -> SystemMetrics:
        """
        Get current system metrics
        """
        now = time.time()
        
        # Calculate request rates
        minute_ago = now - 60
        hour_ago = now - 3600
        
        requests_1min = len([t for t, _ in self.request_times if t > minute_ago])
        requests_1hour = len([t for t, _ in self.request_times if t > hour_ago])
        
        # Calculate average response time
        recent_times = [d for t, d in self.request_times if t > minute_ago]
        avg_response_time = sum(recent_times) / len(recent_times) if recent_times else 0.0
        
        # Calculate error rate
        error_rate = (self.error_count / max(self.request_count, 1)) * 100
        
        # Get system metrics (simplified - would use psutil in production)
        try:
            import psutil
            cpu_usage = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            memory_usage_mb = (memory.total - memory.available) / 1024 / 1024
            memory_usage_percent = memory.percent
            disk_usage_percent = disk.percent
        except ImportError:
            # Fallback values if psutil not available
            cpu_usage = 0.0
            memory_usage_mb = 0.0
            memory_usage_percent = 0.0
            disk_usage_percent = 0.0
        
        metrics = SystemMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage_percent=cpu_usage,
            memory_usage_mb=memory_usage_mb,
            memory_usage_percent=memory_usage_percent,
            disk_usage_percent=disk_usage_percent,
            active_connections=0,  # Would be tracked by server
            request_count_1min=requests_1min,
            request_count_1hour=requests_1hour,
            avg_response_time_ms=avg_response_time,
            error_rate_percent=error_rate
        )
        
        # Store in history
        self.metrics_history.append(metrics)
        if len(self.metrics_history) > self.max_history_size:
            self.metrics_history.pop(0)
        
        return metrics
    
    def get_health_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive health summary
        """
        overall_status = self.get_overall_status()
        metrics = self.get_metrics()
        
        return {
            "status": overall_status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {name: result.to_dict() for name, result in self.last_results.items()},
            "metrics": metrics.to_dict(),
            "uptime_seconds": time.time() - self.start_time
        }

# Default health check functions
async def check_openai_connection(openai_client) -> HealthCheckResult:
    """
    Check OpenAI API connection
    """
    try:
        models = openai_client.models.list()
        return HealthCheckResult(
            name="openai_connection",
            status=HealthStatus.HEALTHY,
            message=f"OpenAI API accessible - {len(models.data)} models available",
            duration_ms=0.0,  # Will be set by health checker
            timestamp=datetime.utcnow(),
            details={"model_count": len(models.data)}
        )
    except Exception as e:
        return HealthCheckResult(
            name="openai_connection",
            status=HealthStatus.UNHEALTHY,
            message=f"OpenAI API connection failed: {str(e)}",
            duration_ms=0.0,
            timestamp=datetime.utcnow()
        )

async def check_chromadb_connection(chroma_client) -> HealthCheckResult:
    """
    Check ChromaDB connection
    """
    try:
        # Try to list collections
        collections = chroma_client.list_collections()
        return HealthCheckResult(
            name="chromadb_connection",
            status=HealthStatus.HEALTHY,
            message=f"ChromaDB accessible - {len(collections)} collections",
            duration_ms=0.0,
            timestamp=datetime.utcnow(),
            details={"collection_count": len(collections)}
        )
    except Exception as e:
        return HealthCheckResult(
            name="chromadb_connection",
            status=HealthStatus.UNHEALTHY,
            message=f"ChromaDB connection failed: {str(e)}",
            duration_ms=0.0,
            timestamp=datetime.utcnow()
        )

async def check_rag_engine_ready(rag_engine) -> HealthCheckResult:
    """
    Check if RAG engine is ready
    """
    try:
        is_ready = rag_engine.is_ready()
        cache_stats = rag_engine.get_cache_stats()
        
        if is_ready:
            return HealthCheckResult(
                name="rag_engine_ready",
                status=HealthStatus.HEALTHY,
                message="RAG engine is ready and operational",
                duration_ms=0.0,
                timestamp=datetime.utcnow(),
                details=cache_stats
            )
        else:
            return HealthCheckResult(
                name="rag_engine_ready",
                status=HealthStatus.UNHEALTHY,
                message="RAG engine is not ready",
                duration_ms=0.0,
                timestamp=datetime.utcnow()
            )
    except Exception as e:
        return HealthCheckResult(
            name="rag_engine_ready",
            status=HealthStatus.UNHEALTHY,
            message=f"RAG engine check failed: {str(e)}",
            duration_ms=0.0,
            timestamp=datetime.utcnow()
        )
