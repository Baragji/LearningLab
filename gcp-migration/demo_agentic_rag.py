#!/usr/bin/env python3
"""
Agentic RAG Demonstration Script

This script demonstrates the functionality of the Agentic RAG system
with realistic examples.
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import json

from src.agents.agentic_rag import create_agentic_rag, RAGContext
from src.graph.query_engine import GraphQueryEngine
from src.graph.tigergraph_client import TigerGraphClient, GraphConfig
from src.rag_engine_openai import RAGEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Sample queries to demonstrate
SAMPLE_QUERIES = [
    # Simple queries
    "What are the main functions in the authentication module?",
    "Find code that handles user registration",
    "Show me how database connections are managed",
    
    # Moderate complexity
    "Explain how user permissions are checked throughout the codebase",
    "Find all functions that perform data validation and explain their approach",
    "How is error handling implemented in the API endpoints?",
    
    # Complex queries
    "Analyze the security implications of the current authentication approach",
    "Compare the different cache implementations and their performance characteristics",
    "What are the potential race conditions in the thread handling code?",
    
    # Expert queries
    "Identify code that might have memory leaks and suggest improvements",
    "How would you refactor the error handling to be more consistent across modules?",
    "Analyze the potential scaling bottlenecks in the current architecture"
]

async def initialize_components():
    """Initialize all required components for the Agentic RAG system."""
    logger.info("Initializing components for Agentic RAG demo...")
    
    # Initialize RAG Engine
    logger.info("Initializing RAG Engine...")
    rag_engine = RAGEngine(
        embedding_model="text-embedding-3-small",
        llm_model="gpt-3.5-turbo",
        chromadb_path="data/chromadb/"
    )
    await rag_engine.initialize()
    
    # Initialize TigerGraph Client
    logger.info("Initializing TigerGraph Client...")
    graph_config = GraphConfig(
        host=os.getenv("TIGERGRAPH_HOST", "localhost"),
        port=int(os.getenv("TIGERGRAPH_PORT", "14240")),
        username=os.getenv("TIGERGRAPH_USERNAME", "tigergraph"),
        password=os.getenv("TIGERGRAPH_PASSWORD", "tigergraph123"),
        graph_name=os.getenv("TIGERGRAPH_GRAPH", "RAGKnowledgeGraph")
    )
    
    graph_client = TigerGraphClient(graph_config)
    
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
    
    logger.info("All components initialized successfully!")
    return agentic_rag, rag_engine

async def run_demo_queries(agentic_rag, queries, save_results=True):
    """Run demonstration queries through the Agentic RAG system."""
    results = []
    
    for i, query in enumerate(queries):
        logger.info(f"Query {i+1}/{len(queries)}: {query}")
        print(f"\n\n{'='*80}\nQUERY: {query}\n{'='*80}\n")
        
        # Create context
        context = RAGContext(
            query=query,
            query_type="demo",
            user_context={"demo": True, "timestamp": datetime.now().isoformat()}
        )
        
        # Execute query
        start_time = datetime.now()
        response = await agentic_rag.query(context)
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Print results
        print(f"\nANSWER:\n{response.answer}\n")
        print(f"Confidence: {response.confidence:.2f}")
        print(f"Execution Time: {execution_time:.2f}s")
        
        if response.sources:
            print(f"\nSOURCES ({len(response.sources)}):")
            for idx, source in enumerate(response.sources[:3]):  # Show top 3
                print(f"{idx+1}. {source.get('metadata', {}).get('file', 'Unknown')} - " 
                      f"{source.get('metadata', {}).get('function', 'Unknown')}")
        
        if response.graph_insights:
            print("\nGRAPH INSIGHTS:")
            for key, value in response.graph_insights.items():
                print(f"- {key}: {value}")
        
        # Save results
        results.append({
            "query": query,
            "answer": response.answer,
            "confidence": response.confidence,
            "execution_time": execution_time,
            "sources_count": len(response.sources),
            "has_graph_insights": bool(response.graph_insights),
            "metadata": response.metadata
        })
    
    # Save results to file
    if save_results:
        with open("demo_results.json", "w") as f:
            json.dump(results, f, indent=2)
        logger.info("Demo results saved to demo_results.json")
    
    return results

async def interactive_demo(agentic_rag):
    """Run an interactive demo allowing user to input queries."""
    print("\n\n" + "="*80)
    print("INTERACTIVE AGENTIC RAG DEMO")
    print("="*80)
    print("Type your queries below. Enter 'exit' to quit.")
    print("="*80 + "\n")
    
    while True:
        query = input("\nYour query: ")
        if query.lower() in ('exit', 'quit', 'q'):
            break
        
        if not query.strip():
            continue
        
        # Create context
        context = RAGContext(
            query=query,
            query_type="interactive",
            user_context={"interactive": True}
        )
        
        # Execute query
        print("\nProcessing...")
        start_time = datetime.now()
        try:
            response = await agentic_rag.query(context)
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Print results
            print(f"\nANSWER:\n{response.answer}\n")
            print(f"Confidence: {response.confidence:.2f}")
            print(f"Execution Time: {execution_time:.2f}s")
            
            if response.sources:
                print(f"\nSOURCES ({len(response.sources)}):")
                for idx, source in enumerate(response.sources[:3]):  # Show top 3
                    print(f"{idx+1}. {source.get('metadata', {}).get('file', 'Unknown')} - " 
                          f"{source.get('metadata', {}).get('function', 'Unknown')}")
            
            if response.graph_insights:
                print("\nGRAPH INSIGHTS:")
                for key, value in response.graph_insights.items():
                    print(f"- {key}: {value}")
        
        except Exception as e:
            print(f"Error processing query: {str(e)}")

async def main():
    """Main demo function."""
    print("\n" + "="*80)
    print("AGENTIC RAG DEMONSTRATION")
    print("="*80 + "\n")
    
    # Initialize components
    agentic_rag, rag_engine = await initialize_components()
    
    # Check for demo documents
    if rag_engine.document_count() < 5:
        print("\nAdding sample documents for demonstration...")
        
        # Add some sample documents
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
                file_path=doc["file_path"],
                file_type=doc["file_type"],
                project="demo"
            )
        
        print(f"Added {len(sample_docs)} sample documents for demonstration\n")
    
    # Run demo mode based on arguments
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        # Run interactive demo
        await interactive_demo(agentic_rag)
    else:
        # Run predefined queries
        await run_demo_queries(agentic_rag, SAMPLE_QUERIES)
    
    # Print performance stats
    print("\n" + "="*80)
    print("PERFORMANCE STATISTICS")
    print("="*80 + "\n")
    
    stats = agentic_rag.get_performance_stats()
    print(f"Total Queries: {stats['total_queries']}")
    print(f"Successful Queries: {stats['successful_queries']}")
    print(f"Success Rate: {stats['success_rate']:.2f}%")
    print(f"Average Response Time: {stats['average_response_time']:.2f}s")
    print(f"Average Confidence: {stats['average_confidence']:.2f}")
    
    print("\nDemo completed!")

if __name__ == "__main__":
    asyncio.run(main())