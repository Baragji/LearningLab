#!/usr/bin/env python3
"""
Comprehensive Testing Suite for Agentic RAG

This script performs comprehensive testing of the Agentic RAG system,
including all components and their interactions.
"""

import os
import asyncio
import logging
import time
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

from src.agents.agentic_rag import AgenticRAG, RAGContext
from src.agents.planner.query_planner import QueryComplexity, RetrievalStrategy, SynthesisStrategy
from src.graph.query_engine import GraphQueryEngine
from src.graph.tigergraph_client import TigerGraphClient, GraphConfig
from src.core.rag_engine_openai import RAGEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("agentic_rag_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class TestCase:
    """Test case for Agentic RAG testing."""
    name: str
    query: str
    expected_complexity: Optional[QueryComplexity] = None
    expected_strategies: List[RetrievalStrategy] = field(default_factory=list)
    expected_synthesis: Optional[SynthesisStrategy] = None
    expected_keywords: List[str] = field(default_factory=list)
    min_confidence: float = 0.7
    max_time: float = 10.0
    category: str = "general"

# Test cases organized by complexity
TEST_CASES = [
    # Simple queries
    TestCase(
        name="Simple function search",
        query="Find functions that handle user authentication",
        expected_complexity=QueryComplexity.SIMPLE,
        expected_strategies=[RetrievalStrategy.DIRECT, RetrievalStrategy.SEMANTIC],
        expected_synthesis=SynthesisStrategy.SIMPLE,
        expected_keywords=["authenticate", "authentication", "login", "user"],
        category="function_search"
    ),
    TestCase(
        name="Simple code search",
        query="Show me code that handles database connections",
        expected_complexity=QueryComplexity.SIMPLE,
        expected_strategies=[RetrievalStrategy.SEMANTIC],
        expected_synthesis=SynthesisStrategy.SIMPLE,
        expected_keywords=["database", "connection", "connect", "MongoDB"],
        category="code_search"
    ),
    
    # Moderate complexity
    TestCase(
        name="Moderate explanation",
        query="Explain how user permissions are implemented across the system",
        expected_complexity=QueryComplexity.MODERATE,
        expected_strategies=[RetrievalStrategy.SEMANTIC, RetrievalStrategy.GRAPH],
        expected_synthesis=SynthesisStrategy.REASONING,
        expected_keywords=["permission", "access control", "roles", "check"],
        category="explanation"
    ),
    TestCase(
        name="Moderate analysis",
        query="Analyze the error handling approach in the authentication system",
        expected_complexity=QueryComplexity.MODERATE,
        expected_strategies=[RetrievalStrategy.SEMANTIC, RetrievalStrategy.HYBRID],
        expected_synthesis=SynthesisStrategy.REASONING,
        expected_keywords=["error", "exception", "handling", "try", "catch"],
        category="analysis"
    ),
    
    # Complex queries
    TestCase(
        name="Complex comparison",
        query="Compare the different caching mechanisms and their performance implications",
        expected_complexity=QueryComplexity.COMPLEX,
        expected_strategies=[RetrievalStrategy.SEMANTIC, RetrievalStrategy.HYBRID],
        expected_synthesis=SynthesisStrategy.COMPARATIVE,
        expected_keywords=["cache", "redis", "memory", "performance", "comparison"],
        category="comparison"
    ),
    TestCase(
        name="Complex architecture",
        query="Explain the security architecture and potential vulnerabilities in the authentication flow",
        expected_complexity=QueryComplexity.COMPLEX,
        expected_strategies=[RetrievalStrategy.HYBRID, RetrievalStrategy.GRAPH],
        expected_synthesis=SynthesisStrategy.COMPARATIVE,
        expected_keywords=["security", "vulnerability", "authentication", "protection"],
        category="security"
    ),
    
    # Expert queries
    TestCase(
        name="Expert refactoring",
        query="How would you refactor the user authentication system to improve security and maintainability?",
        expected_complexity=QueryComplexity.EXPERT,
        expected_strategies=[RetrievalStrategy.HYBRID, RetrievalStrategy.ITERATIVE],
        expected_synthesis=SynthesisStrategy.CREATIVE,
        expected_keywords=["refactor", "improve", "security", "maintainability", "authentication"],
        category="refactoring"
    ),
    TestCase(
        name="Expert architecture",
        query="Design a more scalable and secure authentication system based on the current implementation",
        expected_complexity=QueryComplexity.EXPERT,
        expected_strategies=[RetrievalStrategy.HYBRID, RetrievalStrategy.ITERATIVE],
        expected_synthesis=SynthesisStrategy.CREATIVE,
        expected_keywords=["design", "scalable", "secure", "authentication", "architecture"],
        category="architecture"
    )
]

async def initialize_test_environment():
    """Initialize test environment with sample data."""
    logger.info("Initializing test environment...")
    
    # Initialize RAG Engine
    logger.info("Initializing RAG Engine...")
    rag_engine = RAGEngine(
        embedding_model="text-embedding-3-small",
        llm_model="gpt-3.5-turbo",
        chromadb_path="data/chromadb_test/"
    )
    await rag_engine.initialize()
    
    # Add sample documents if needed
    stats = await rag_engine.get_codebase_stats()
    if stats.get('total_documents', 0) < 5:
        logger.info("Adding sample documents for testing...")
        
        # Sample documents
        sample_docs = [
            {
                "content": "def authenticate_user(username, password):\n    \"\"\"Authenticate a user with username and password.\n    \n    Args:\n        username: The username to authenticate\n        password: The password to verify\n        \n    Returns:\n        User object if authentication succeeds, None otherwise\n    \"\"\"\n    # Hash the password\n    hashed_password = hash_password(password)\n    \n    # Query the database\n    user = db.users.find_one({\"username\": username})\n    \n    if not user:\n        return None\n    \n    # Verify password\n    if user[\"password_hash\"] != hashed_password:\n        return None\n    \n    return user",
                "file_path": "auth/authentication.py",
                "file_type": "python"
            },
            {
                "content": "class UserManager:\n    \"\"\"Manage user operations including registration and profile updates.\"\"\"\n    \n    def __init__(self, db_connection):\n        self.db = db_connection\n    \n    def register_user(self, username, password, email):\n        \"\"\"Register a new user.\n        \n        Args:\n            username: The username for the new user\n            password: The password for the new user\n            email: The email for the new user\n            \n        Returns:\n            User ID if registration succeeds, None if username exists\n        \"\"\"\n        # Check if username exists\n        if self.db.users.find_one({\"username\": username}):\n            return None\n        \n        # Hash password\n        hashed_password = hash_password(password)\n        \n        # Create user\n        user_id = self.db.users.insert_one({\n            \"username\": username,\n            \"password_hash\": hashed_password,\n            \"email\": email,\n            \"created_at\": datetime.now(),\n            \"is_active\": True\n        }).inserted_id\n        \n        return user_id",
                "file_path": "auth/user_manager.py",
                "file_type": "python"
            },
            {
                "content": "class DatabaseConnection:\n    \"\"\"Database connection manager.\"\"\"\n    \n    _instance = None\n    \n    @classmethod\n    def get_instance(cls, config):\n        \"\"\"Get singleton instance of DatabaseConnection.\"\"\"\n        if cls._instance is None:\n            cls._instance = cls(config)\n        return cls._instance\n    \n    def __init__(self, config):\n        \"\"\"Initialize database connection.\n        \n        Args:\n            config: Database configuration dictionary\n        \"\"\"\n        self.host = config.get(\"DB_HOST\", \"localhost\")\n        self.port = config.get(\"DB_PORT\", 27017)\n        self.username = config.get(\"DB_USERNAME\")\n        self.password = config.get(\"DB_PASSWORD\")\n        self.database = config.get(\"DB_NAME\")\n        \n        self.client = None\n        self.db = None\n        self.connect()\n    \n    def connect(self):\n        \"\"\"Establish database connection.\"\"\"\n        connection_string = f\"mongodb://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}\"\n        self.client = MongoClient(connection_string)\n        self.db = self.client[self.database]\n        return self.db\n    \n    def close(self):\n        \"\"\"Close database connection.\"\"\"\n        if self.client:\n            self.client.close()",
                "file_path": "database/connection.py",
                "file_type": "python"
            },
            {
                "content": "class PermissionManager:\n    \"\"\"Manage user permissions and access control.\"\"\"\n    \n    def __init__(self, db_connection):\n        self.db = db_connection\n    \n    def has_permission(self, user_id, resource, action):\n        \"\"\"Check if user has permission to perform action on resource.\n        \n        Args:\n            user_id: The user ID to check\n            resource: The resource to access\n            action: The action to perform (read, write, delete)\n            \n        Returns:\n            True if user has permission, False otherwise\n        \"\"\"\n        # Get user roles\n        user = self.db.users.find_one({\"_id\": user_id})\n        if not user:\n            return False\n        \n        roles = user.get(\"roles\", [])\n        \n        # Check if user is admin (admins have all permissions)\n        if \"admin\" in roles:\n            return True\n        \n        # Check resource-specific permissions\n        permissions = self.db.permissions.find_one({\n            \"resource\": resource,\n            \"roles\": {\"$in\": roles}\n        })\n        \n        if not permissions:\n            return False\n        \n        # Check if action is allowed\n        return action in permissions.get(\"allowed_actions\", [])",
                "file_path": "auth/permissions.py",
                "file_type": "python"
            },
            {
                "content": "class CacheManager:\n    \"\"\"Manage application cache.\"\"\"\n    \n    def __init__(self, cache_type=\"memory\", config=None):\n        \"\"\"Initialize cache manager.\n        \n        Args:\n            cache_type: Type of cache (memory, redis)\n            config: Cache configuration\n        \"\"\"\n        self.config = config or {}\n        self.cache_type = cache_type\n        \n        if cache_type == \"memory\":\n            self.cache = {}\n            self.ttl = {}\n        elif cache_type == \"redis\":\n            import redis\n            self.redis = redis.Redis(\n                host=self.config.get(\"REDIS_HOST\", \"localhost\"),\n                port=self.config.get(\"REDIS_PORT\", 6379),\n                password=self.config.get(\"REDIS_PASSWORD\", None)\n            )\n        else:\n            raise ValueError(f\"Unsupported cache type: {cache_type}\")\n    \n    def get(self, key):\n        \"\"\"Get value from cache.\"\"\"\n        if self.cache_type == \"memory\":\n            # Check if key exists and not expired\n            if key in self.cache and (key not in self.ttl or self.ttl[key] > time.time()):\n                return self.cache[key]\n            return None\n        elif self.cache_type == \"redis\":\n            return self.redis.get(key)\n    \n    def set(self, key, value, ttl=None):\n        \"\"\"Set value in cache.\"\"\"\n        if self.cache_type == \"memory\":\n            self.cache[key] = value\n            if ttl:\n                self.ttl[key] = time.time() + ttl\n        elif self.cache_type == \"redis\":\n            self.redis.set(key, value, ex=ttl)",
                "file_path": "cache/manager.py",
                "file_type": "python"
            }
        ]
        
        for doc in sample_docs:
            await rag_engine.add_document(
            content=doc["content"],
            metadata={
            "file_path": doc["file_path"],
            "file_type": doc["file_type"],
            "project": "test"
            }
            )
        
        logger.info(f"Added {len(sample_docs)} sample documents for testing")
    
    # Initialize TigerGraph Client with mock capabilities if needed
    logger.info("Initializing TigerGraph Client...")
    graph_config = GraphConfig(
        host=os.getenv("TIGERGRAPH_HOST", "localhost"),
        port=int(os.getenv("TIGERGRAPH_PORT", "14240")),
        username=os.getenv("TIGERGRAPH_USERNAME", "tigergraph"),
        password=os.getenv("TIGERGRAPH_PASSWORD", "tigergraph123"),
        graph_name=os.getenv("TIGERGRAPH_GRAPH", "RAGKnowledgeGraph")
    )
    
    graph_client = TigerGraphClient(graph_config)
    
    # Try to connect, but continue with mock data if connection fails
    try:
        await graph_client.connect()
        logger.info("TigerGraph connection successful")
    except Exception as e:
        logger.warning(f"TigerGraph connection failed: {e}. Using mock data.")
        # We'll continue with mock data
    
    # Initialize Query Engine
    logger.info("Initializing Graph Query Engine...")
    query_engine = GraphQueryEngine(graph_client)
    
    # Create Agentic RAG system
    logger.info("Creating Agentic RAG system...")
    agentic_rag = await create_agentic_rag(
        graph_query_engine=query_engine,
        graph_client=graph_client,
        vector_rag_engine=rag_engine
    )
    
    logger.info("Test environment initialized successfully!")
    return agentic_rag, rag_engine

async def run_test_cases(agentic_rag, test_cases):
    """Run all test cases and collect results."""
    results = []
    
    for i, test_case in enumerate(test_cases):
        logger.info(f"Running test case {i+1}/{len(test_cases)}: {test_case.name}")
        
        # Create context
        context = RAGContext(
            query=test_case.query,
            query_type="test",
            user_context={"test": True, "test_case": test_case.name}
        )
        
        # Execute query
        start_time = time.time()
        try:
            response = await agentic_rag.query(context)
            execution_time = time.time() - start_time
            
            # Check if execution time is within limits
            time_ok = execution_time <= test_case.max_time
            
            # Check if confidence meets minimum
            confidence_ok = response.confidence >= test_case.min_confidence
            
            # Check if expected keywords are in the answer
            keywords_found = []
            for keyword in test_case.expected_keywords:
                if keyword.lower() in response.answer.lower():
                    keywords_found.append(keyword)
            
            keywords_ok = len(keywords_found) / len(test_case.expected_keywords) >= 0.7 if test_case.expected_keywords else True
            
            # Determine overall success
            success = time_ok and confidence_ok and keywords_ok
            
            # Store result
            result = {
                "test_case": test_case.name,
                "category": test_case.category,
                "query": test_case.query,
                "success": success,
                "execution_time": execution_time,
                "time_ok": time_ok,
                "confidence": response.confidence,
                "confidence_ok": confidence_ok,
                "keywords_found": keywords_found,
                "keywords_ok": keywords_ok,
                "answer_length": len(response.answer),
                "sources_count": len(response.sources),
                "has_graph_insights": bool(response.graph_insights)
            }
            
            logger.info(f"Test case {test_case.name} {'passed' if success else 'failed'}")
            if not success:
                logger.warning(f"Failure details: time_ok={time_ok}, confidence_ok={confidence_ok}, keywords_ok={keywords_ok}")
            
        except Exception as e:
            logger.error(f"Error executing test case {test_case.name}: {str(e)}")
            result = {
                "test_case": test_case.name,
                "category": test_case.category,
                "query": test_case.query,
                "success": False,
                "error": str(e)
            }
        
        results.append(result)
    
    return results

def analyze_results(results):
    """Analyze test results and generate summary statistics."""
    total_tests = len(results)
    successful_tests = sum(1 for r in results if r.get("success", False))
    success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
    
    # Calculate average metrics
    execution_times = [r.get("execution_time", 0) for r in results if "execution_time" in r]
    avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
    
    confidences = [r.get("confidence", 0) for r in results if "confidence" in r]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    answer_lengths = [r.get("answer_length", 0) for r in results if "answer_length" in r]
    avg_answer_length = sum(answer_lengths) / len(answer_lengths) if answer_lengths else 0
    
    sources_counts = [r.get("sources_count", 0) for r in results if "sources_count" in r]
    avg_sources_count = sum(sources_counts) / len(sources_counts) if sources_counts else 0
    
    # Calculate category success rates
    categories = {}
    for result in results:
        category = result.get("category", "unknown")
        if category not in categories:
            categories[category] = {"total": 0, "success": 0}
        
        categories[category]["total"] += 1
        if result.get("success", False):
            categories[category]["success"] += 1
    
    category_rates = {
        cat: {
            "success_rate": (stats["success"] / stats["total"]) * 100 if stats["total"] > 0 else 0,
            "count": stats["total"]
        }
        for cat, stats in categories.items()
    }
    
    # Generate summary
    summary = {
        "total_tests": total_tests,
        "successful_tests": successful_tests,
        "success_rate": success_rate,
        "avg_execution_time": avg_execution_time,
        "avg_confidence": avg_confidence,
        "avg_answer_length": avg_answer_length,
        "avg_sources_count": avg_sources_count,
        "category_performance": category_rates
    }
    
    return summary

async def main():
    """Main test function."""
    print("\n" + "="*80)
    print("AGENTIC RAG COMPREHENSIVE TESTING")
    print("="*80 + "\n")
    
    # Initialize test environment
    agentic_rag, rag_engine = await initialize_test_environment()
    
    # Run test cases
    print("\nRunning test cases...")
    results = await run_test_cases(agentic_rag, TEST_CASES)
    
    # Analyze results
    print("\nAnalyzing test results...")
    summary = analyze_results(results)
    
    # Print summary
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80 + "\n")
    
    print(f"Total tests: {summary['total_tests']}")
    print(f"Successful tests: {summary['successful_tests']}")
    print(f"Success rate: {summary['success_rate']:.2f}%")
    print(f"Average execution time: {summary['avg_execution_time']:.2f}s")
    print(f"Average confidence: {summary['avg_confidence']:.2f}")
    
    print("\nCategory Performance:")
    for category, stats in summary['category_performance'].items():
        print(f"  {category}: {stats['success_rate']:.2f}% ({stats['count']} tests)")
    
    # Save detailed results and summary
    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    with open("test_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    
    print("\nDetailed results saved to test_results.json")
    print("Summary saved to test_summary.json")
    
    # Get performance stats from the agentic RAG system
    print("\n" + "="*80)
    print("AGENTIC RAG PERFORMANCE STATISTICS")
    print("="*80 + "\n")
    
    stats = agentic_rag.get_performance_stats()
    print(f"Total Queries: {stats['total_queries']}")
    print(f"Successful Queries: {stats['successful_queries']}")
    print(f"Success Rate: {stats['success_rate']:.2f}%")
    print(f"Average Response Time: {stats['average_response_time']:.2f}s")
    print(f"Average Confidence: {stats['average_confidence']:.2f}")
    
    print("\nTesting completed!")

if __name__ == "__main__":
    asyncio.run(main())