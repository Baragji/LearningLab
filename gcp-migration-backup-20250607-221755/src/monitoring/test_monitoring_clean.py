"""
Test suite for Enhanced Monitoring Pipeline
Validates GPU triggers, SLO tracking, and predictive monitoring
"""

import asyncio
import pytest
import json
import tempfile
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock

from .monitoring_setup import (
    EnhancedMonitoringPipeline,
    GPUTier,
    PerformanceTrigger,
    GPUUpgradeTrigger,
    SLOTarget,
    PredictiveAlert,
    setup_enhanced_monitoring
)
from .integration_example import IntegratedMonitoringSystem

class TestEnhancedMonitoringPipeline:
    """Test the core monitoring pipeline functionality"""
    
    @pytest.fixture
    def config_file(self):
        """Create a temporary config file for testing"""
        config = {
            "prometheus": {"host": "localhost", "port": 9090},
            "gpu_monitoring": {"enabled": True, "check_interval_seconds": 1},
            "predictive_monitoring": {"enabled": True}
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config, f)
            return f.name
    
    @pytest.fixture
    def monitoring_pipeline(self, config_file):
        """Create a monitoring pipeline for testing"""
        return EnhancedMonitoringPipeline(config_file)
    
    def test_gpu_tier_enum(self):
        """Test GPU tier enumeration"""
        assert GPUTier.CPU_ONLY.value == "cpu_only"
        assert GPUTier.A100_2X.value == "a100_2x"
        assert GPUTier.H100_4X.value == "h100_4x"
    
    def test_performance_trigger_enum(self):
        """Test performance trigger enumeration"""
        assert PerformanceTrigger.QPS_THRESHOLD.value == "qps_threshold"
        assert PerformanceTrigger.LATENCY_P95.value == "latency_p95"
        assert PerformanceTrigger.GPU_UTILIZATION.value == "gpu_utilization"
        assert PerformanceTrigger.MEMORY_PRESSURE.value == "memory_pressure"
    
    def test_gpu_upgrade_trigger_creation(self):
        """Test GPU upgrade trigger configuration"""
        trigger = GPUUpgradeTrigger(
            trigger_type=PerformanceTrigger.QPS_THRESHOLD,
            threshold_value=50.0,
            current_tier=GPUTier.CPU_ONLY,
            target_tier=GPUTier.A100_2X,
            grace_period_hours=48,
            consecutive_violations=3
        )
        
        assert trigger.trigger_type == PerformanceTrigger.QPS_THRESHOLD
        assert trigger.threshold_value == 50.0
        assert trigger.current_tier == GPUTier.CPU_ONLY
        assert trigger.target_tier == GPUTier.A100_2X
        assert trigger.grace_period_hours == 48
        assert trigger.consecutive_violations == 3
        assert trigger.violation_count == 0
        assert trigger.first_violation_time is None
    
    def test_monitoring_pipeline_initialization(self, monitoring_pipeline):
        """Test monitoring pipeline initialization"""
        assert monitoring_pipeline.current_gpu_tier == GPUTier.CPU_ONLY
        assert not monitoring_pipeline.upgrade_in_progress
        assert monitoring_pipeline.last_upgrade_time is None
        assert len(monitoring_pipeline.gpu_triggers) > 0
        assert len(monitoring_pipeline.slo_targets) > 0
        assert len(monitoring_pipeline.predictive_alerts) > 0
    
    def test_check_trigger_violation(self, monitoring_pipeline):
        """Test trigger violation checking logic"""
        trigger = GPUUpgradeTrigger(
            trigger_type=PerformanceTrigger.QPS_THRESHOLD,
            threshold_value=50.0,
            current_tier=GPUTier.CPU_ONLY,
            target_tier=GPUTier.A100_2X
        )
        
        # Test QPS threshold violation
        metrics = {"qps_threshold": 60.0}  # Above threshold
        assert monitoring_pipeline._check_trigger_violation(trigger, metrics) == True
        
        metrics = {"qps_threshold": 40.0}  # Below threshold
        assert monitoring_pipeline._check_trigger_violation(trigger, metrics) == False
    
    def test_calculate_cost_increase(self, monitoring_pipeline):
        """Test cost calculation for GPU upgrades"""
        trigger = GPUUpgradeTrigger(
            trigger_type=PerformanceTrigger.QPS_THRESHOLD,
            threshold_value=50.0,
            current_tier=GPUTier.CPU_ONLY,
            target_tier=GPUTier.A100_2X
        )
        
        cost_increase = monitoring_pipeline._calculate_cost_increase(trigger)
        assert cost_increase == 7500  # $8000 - $500

class TestIntegratedMonitoringSystem:
    """Test the integrated monitoring system"""
    
    @pytest.fixture
    def integrated_system(self):
        """Create an integrated monitoring system for testing"""
        return IntegratedMonitoringSystem()
    
    def test_query_type_classification(self, integrated_system):
        """Test query type classification"""
        assert integrated_system._classify_query_type("Show me the code for this function") == "code_analysis"
        assert integrated_system._classify_query_type("Explain how this works") == "explanation"
        assert integrated_system._classify_query_type("Find all references to this variable") == "search"
        assert integrated_system._classify_query_type("Generate a new function") == "generation"
        assert integrated_system._classify_query_type("Random question") == "general"
    
    def test_query_complexity_assessment(self, integrated_system):
        """Test query complexity assessment"""
        simple_query = "What is this?"
        medium_query = "Can you explain how this function works and what parameters it takes?"
        complex_query = " ".join(["This is a very long and complex query"] * 20)
        
        assert integrated_system._assess_query_complexity(simple_query) == "simple"
        assert integrated_system._assess_query_complexity(medium_query) == "medium"
        assert integrated_system._assess_query_complexity(complex_query) == "complex"

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])