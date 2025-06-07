"""Metrics collection and export for MCP Enterprise server."""

import time
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, deque
from threading import Lock
import json

logger = logging.getLogger(__name__)

@dataclass
class MetricPoint:
    """A single metric data point"""
    timestamp: float
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'timestamp': self.timestamp,
            'value': self.value,
            'labels': self.labels
        }

class Counter:
    """Thread-safe counter metric"""
    
    def __init__(self, name: str, description: str = "", labels: Optional[List[str]] = None):
        self.name = name
        self.description = description
        self.labels = labels or []
        self._values = defaultdict(float)
        self._lock = Lock()
    
    def inc(self, amount: float = 1.0, **label_values):
        """Increment counter"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            self._values[label_key] += amount
    
    def get(self, **label_values) -> float:
        """Get current counter value"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            return self._values[label_key]
    
    def get_all(self) -> Dict[str, float]:
        """Get all counter values"""
        with self._lock:
            return dict(self._values)
    
    def _make_label_key(self, label_values: Dict[str, str]) -> str:
        """Create a key from label values"""
        if not self.labels:
            return "default"
        return "|".join(f"{k}={label_values.get(k, '')}" for k in sorted(self.labels))

class Gauge:
    """Thread-safe gauge metric"""
    
    def __init__(self, name: str, description: str = "", labels: Optional[List[str]] = None):
        self.name = name
        self.description = description
        self.labels = labels or []
        self._values = defaultdict(float)
        self._lock = Lock()
    
    def set(self, value: float, **label_values):
        """Set gauge value"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            self._values[label_key] = value
    
    def inc(self, amount: float = 1.0, **label_values):
        """Increment gauge"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            self._values[label_key] += amount
    
    def dec(self, amount: float = 1.0, **label_values):
        """Decrement gauge"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            self._values[label_key] -= amount
    
    def get(self, **label_values) -> float:
        """Get current gauge value"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            return self._values[label_key]
    
    def get_all(self) -> Dict[str, float]:
        """Get all gauge values"""
        with self._lock:
            return dict(self._values)
    
    def _make_label_key(self, label_values: Dict[str, str]) -> str:
        """Create a key from label values"""
        if not self.labels:
            return "default"
        return "|".join(f"{k}={label_values.get(k, '')}" for k in sorted(self.labels))

class Histogram:
    """Thread-safe histogram metric"""
    
    def __init__(self, name: str, description: str = "", 
                 buckets: Optional[List[float]] = None, labels: Optional[List[str]] = None):
        self.name = name
        self.description = description
        self.labels = labels or []
        self.buckets = buckets or [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
        
        self._counts = defaultdict(lambda: defaultdict(int))
        self._sums = defaultdict(float)
        self._lock = Lock()
    
    def observe(self, value: float, **label_values):
        """Observe a value"""
        label_key = self._make_label_key(label_values)
        
        with self._lock:
            self._sums[label_key] += value
            
            for bucket in self.buckets:
                if value <= bucket:
                    self._counts[label_key][bucket] += 1
            
            # +Inf bucket
            self._counts[label_key][float('inf')] += 1
    
    def get_buckets(self, **label_values) -> Dict[float, int]:
        """Get bucket counts"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            return dict(self._counts[label_key])
    
    def get_sum(self, **label_values) -> float:
        """Get sum of all observed values"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            return self._sums[label_key]
    
    def get_count(self, **label_values) -> int:
        """Get total count of observations"""
        label_key = self._make_label_key(label_values)
        with self._lock:
            return self._counts[label_key][float('inf')]
    
    def _make_label_key(self, label_values: Dict[str, str]) -> str:
        """Create a key from label values"""
        if not self.labels:
            return "default"
        return "|".join(f"{k}={label_values.get(k, '')}" for k in sorted(self.labels))

class MetricsRegistry:
    """Central registry for all metrics"""
    
    def __init__(self):
        self._metrics = {}
        self._lock = Lock()
        logger.info("Metrics registry initialized")
    
    def counter(self, name: str, description: str = "", labels: Optional[List[str]] = None) -> Counter:
        """Get or create a counter metric"""
        with self._lock:
            if name not in self._metrics:
                self._metrics[name] = Counter(name, description, labels)
                logger.debug(f"Created counter metric: {name}")
            return self._metrics[name]
    
    def gauge(self, name: str, description: str = "", labels: Optional[List[str]] = None) -> Gauge:
        """Get or create a gauge metric"""
        with self._lock:
            if name not in self._metrics:
                self._metrics[name] = Gauge(name, description, labels)
                logger.debug(f"Created gauge metric: {name}")
            return self._metrics[name]
    
    def histogram(self, name: str, description: str = "", 
                  buckets: Optional[List[float]] = None, labels: Optional[List[str]] = None) -> Histogram:
        """Get or create a histogram metric"""
        with self._lock:
            if name not in self._metrics:
                self._metrics[name] = Histogram(name, description, buckets, labels)
                logger.debug(f"Created histogram metric: {name}")
            return self._metrics[name]
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all metrics data"""
        result = {}
        
        with self._lock:
            for name, metric in self._metrics.items():
                if isinstance(metric, Counter):
                    result[name] = {
                        'type': 'counter',
                        'description': metric.description,
                        'values': metric.get_all()
                    }
                elif isinstance(metric, Gauge):
                    result[name] = {
                        'type': 'gauge',
                        'description': metric.description,
                        'values': metric.get_all()
                    }
                elif isinstance(metric, Histogram):
                    # For histograms, we need to get data for each label combination
                    histogram_data = {}
                    # This is simplified - in production you'd track label combinations
                    histogram_data['default'] = {
                        'buckets': metric.get_buckets(),
                        'sum': metric.get_sum(),
                        'count': metric.get_count()
                    }
                    result[name] = {
                        'type': 'histogram',
                        'description': metric.description,
                        'values': histogram_data
                    }
        
        return result
    
    def export_prometheus(self) -> str:
        """Export metrics in Prometheus format"""
        lines = []
        
        with self._lock:
            for name, metric in self._metrics.items():
                # Add help text
                if metric.description:
                    lines.append(f"# HELP {name} {metric.description}")
                
                if isinstance(metric, Counter):
                    lines.append(f"# TYPE {name} counter")
                    for label_key, value in metric.get_all().items():
                        if label_key == "default":
                            lines.append(f"{name} {value}")
                        else:
                            labels_str = "{" + label_key.replace("|", ",") + "}"
                            lines.append(f"{name}{labels_str} {value}")
                
                elif isinstance(metric, Gauge):
                    lines.append(f"# TYPE {name} gauge")
                    for label_key, value in metric.get_all().items():
                        if label_key == "default":
                            lines.append(f"{name} {value}")
                        else:
                            labels_str = "{" + label_key.replace("|", ",") + "}"
                            lines.append(f"{name}{labels_str} {value}")
                
                elif isinstance(metric, Histogram):
                    lines.append(f"# TYPE {name} histogram")
                    # Simplified histogram export
                    buckets = metric.get_buckets()
                    for bucket, count in buckets.items():
                        if bucket == float('inf'):
                            lines.append(f"{name}_bucket{{le=\"+Inf\"}} {count}")
                        else:
                            lines.append(f"{name}_bucket{{le=\"{bucket}\"}} {count}")
                    lines.append(f"{name}_sum {metric.get_sum()}")
                    lines.append(f"{name}_count {metric.get_count()}")
                
                lines.append("")  # Empty line between metrics
        
        return "\n".join(lines)

class MCPMetrics:
    """MCP-specific metrics collection"""
    
    def __init__(self, registry: MetricsRegistry):
        self.registry = registry
        
        # Request metrics
        self.request_total = registry.counter(
            "mcp_requests_total",
            "Total number of MCP requests",
            ["method", "status"]
        )
        
        self.request_duration = registry.histogram(
            "mcp_request_duration_seconds",
            "MCP request duration in seconds",
            buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
            labels=["method"]
        )
        
        # RAG metrics
        self.rag_queries_total = registry.counter(
            "rag_queries_total",
            "Total number of RAG queries",
            ["status"]
        )
        
        self.rag_query_duration = registry.histogram(
            "rag_query_duration_seconds",
            "RAG query duration in seconds",
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
        )
        
        self.rag_cache_hits = registry.counter(
            "rag_cache_hits_total",
            "Total number of RAG cache hits"
        )
        
        self.rag_cache_misses = registry.counter(
            "rag_cache_misses_total",
            "Total number of RAG cache misses"
        )
        
        # OpenAI API metrics
        self.openai_requests_total = registry.counter(
            "openai_requests_total",
            "Total number of OpenAI API requests",
            ["endpoint", "status"]
        )
        
        self.openai_tokens_total = registry.counter(
            "openai_tokens_total",
            "Total number of OpenAI tokens used",
            ["type"]  # prompt, completion
        )
        
        # System metrics
        self.active_connections = registry.gauge(
            "mcp_active_connections",
            "Number of active MCP connections"
        )
        
        self.memory_usage_bytes = registry.gauge(
            "process_memory_usage_bytes",
            "Process memory usage in bytes"
        )
        
        logger.info("MCP metrics initialized")
    
    def record_request(self, method: str, status: str, duration_seconds: float):
        """Record an MCP request"""
        self.request_total.inc(method=method, status=status)
        self.request_duration.observe(duration_seconds, method=method)
    
    def record_rag_query(self, status: str, duration_seconds: float, cache_hit: bool = False):
        """Record a RAG query"""
        self.rag_queries_total.inc(status=status)
        self.rag_query_duration.observe(duration_seconds)
        
        if cache_hit:
            self.rag_cache_hits.inc()
        else:
            self.rag_cache_misses.inc()
    
    def record_openai_request(self, endpoint: str, status: str, 
                             prompt_tokens: int = 0, completion_tokens: int = 0):
        """Record an OpenAI API request"""
        self.openai_requests_total.inc(endpoint=endpoint, status=status)
        
        if prompt_tokens > 0:
            self.openai_tokens_total.inc(prompt_tokens, type="prompt")
        if completion_tokens > 0:
            self.openai_tokens_total.inc(completion_tokens, type="completion")
    
    def update_system_metrics(self):
        """Update system metrics"""
        try:
            import psutil
            import os
            
            # Memory usage
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            self.memory_usage_bytes.set(memory_info.rss)
            
        except ImportError:
            logger.warning("psutil not available, skipping system metrics")
        except Exception as e:
            logger.error(f"Error updating system metrics: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all metrics data"""
        # Update system metrics before returning
        self.update_system_metrics()
        
        # Get all metrics from registry
        all_metrics = self.registry.get_all_metrics()
        
        # Calculate some summary statistics
        total_requests = 0
        total_rag_operations = 0
        
        if "mcp_requests_total" in all_metrics:
            for value in all_metrics["mcp_requests_total"]["values"].values():
                total_requests += value
        
        if "rag_queries_total" in all_metrics:
            for value in all_metrics["rag_queries_total"]["values"].values():
                total_rag_operations += value
        
        return {
            "message": "Enterprise metrics available",
            "request_count": total_requests,
            "rag_operations": total_rag_operations,
            "uptime_seconds": int(time.time() - getattr(self, '_start_time', time.time())),
            "detailed_metrics": all_metrics,
            "timestamp": datetime.utcnow().isoformat()
        }

# Global metrics registry
metrics_registry = MetricsRegistry()
mcp_metrics = MCPMetrics(metrics_registry)
# Set start time for uptime calculation
mcp_metrics._start_time = time.time()

def get_metrics_summary() -> Dict[str, Any]:
    """Get a summary of all metrics"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": metrics_registry.get_all_metrics()
    }

def export_metrics_prometheus() -> str:
    """Export metrics in Prometheus format"""
    return metrics_registry.export_prometheus()

class MetricsMiddleware:
    """Middleware to automatically collect request metrics"""
    
    def __init__(self, metrics: MCPMetrics):
        self.metrics = metrics
    
    async def __call__(self, request, call_next):
        """Process request and collect metrics"""
        start_time = time.time()
        method = getattr(request, 'method', 'unknown')
        
        try:
            response = await call_next(request)
            status = 'success'
            duration = time.time() - start_time
            
            self.metrics.record_request(method, status, duration)
            return response
            
        except Exception as e:
            status = 'error'
            duration = time.time() - start_time
            
            self.metrics.record_request(method, status, duration)
            raise
