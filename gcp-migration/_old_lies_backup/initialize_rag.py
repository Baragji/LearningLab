#!/usr/bin/env python3
"""
RAG System Initialization Script
Sets up ChromaDB collections and initial data
"""

import asyncio
import logging
import os
import sys
from pathlib import Path
from rag_engine import RAGEngine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def initialize_rag_system():
    """Initialize the RAG system with default collections and data"""
    try:
        logger.info("🧠 Initializing RAG system...")
        
        # Initialize RAG engine
        rag_engine = RAGEngine()
        await rag_engine.initialize()
        
        # Check if collections already exist
        collections = await rag_engine.list_collections()
        
        if not collections:
            logger.info("📚 Creating default collections...")
            
            # Create default collection for code
            await rag_engine.create_collection("codebase", {
                "description": "Main codebase collection",
                "embedding_model": "nomic-embed-text",
                "chunk_size": 1000,
                "chunk_overlap": 200
            })
            
            # Create collection for documentation
            await rag_engine.create_collection("documentation", {
                "description": "Documentation and README files",
                "embedding_model": "nomic-embed-text",
                "chunk_size": 1500,
                "chunk_overlap": 300
            })
            
            logger.info("✅ Default collections created")
        else:
            logger.info(f"✅ Found existing collections: {collections}")
        
        # Add sample data if collections are empty
        codebase_count = await rag_engine.get_collection_count("codebase")
        if codebase_count == 0:
            logger.info("📝 Adding sample code snippets...")
            
            sample_code = [
                {
                    "content": """
def fibonacci(n):
    '''Calculate fibonacci number using dynamic programming'''
    if n <= 1:
        return n
    
    dp = [0] * (n + 1)
    dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    return dp[n]
""",
                    "metadata": {
                        "language": "python",
                        "type": "function",
                        "topic": "algorithms",
                        "file": "examples/fibonacci.py"
                    }
                },
                {
                    "content": """
class DatabaseConnection:
    '''Manages database connections with connection pooling'''
    
    def __init__(self, host, port, database, username, password):
        self.host = host
        self.port = port
        self.database = database
        self.username = username
        self.password = password
        self.pool = None
    
    async def connect(self):
        '''Establish connection pool'''
        # Implementation here
        pass
    
    async def execute_query(self, query, params=None):
        '''Execute SQL query with parameters'''
        # Implementation here
        pass
""",
                    "metadata": {
                        "language": "python",
                        "type": "class",
                        "topic": "database",
                        "file": "examples/database.py"
                    }
                },
                {
                    "content": """
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`/api/users/${userId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }
                const userData = await response.json();
                setUser(userData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUser();
    }, [userId]);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div className="user-profile">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
        </div>
    );
};

export default UserProfile;
""",
                    "metadata": {
                        "language": "javascript",
                        "type": "component",
                        "topic": "react",
                        "file": "examples/UserProfile.jsx"
                    }
                }
            ]
            
            for i, code_snippet in enumerate(sample_code):
                await rag_engine.add_document_to_collection(
                    collection_name="codebase",
                    document_id=f"sample_{i}",
                    content=code_snippet["content"],
                    metadata=code_snippet["metadata"]
                )
            
            logger.info("✅ Sample code snippets added")
        
        # Add documentation samples
        doc_count = await rag_engine.get_collection_count("documentation")
        if doc_count == 0:
            logger.info("📖 Adding sample documentation...")
            
            sample_docs = [
                {
                    "content": """
# Code Assistant + RAG Setup Guide

This guide explains how to set up and use the Code Assistant with RAG capabilities.

## Features

- **Semantic Code Search**: Find relevant code snippets using natural language
- **Code Analysis**: Get insights and suggestions for your code
- **Code Generation**: Generate code based on requirements
- **Documentation**: Automatic documentation generation

## Usage

1. Index your codebase using the RAG engine
2. Use the MCP interface to interact with the assistant
3. Ask questions about your code in natural language
4. Get contextual suggestions and explanations

## Performance

- **Local Setup**: 2-3 minutes per query
- **Cloud Setup**: <5 seconds per query
- **Models**: llama3.1:8b + nomic-embed-text
""",
                    "metadata": {
                        "type": "documentation",
                        "topic": "setup",
                        "file": "docs/setup.md"
                    }
                },
                {
                    "content": """
# API Reference

## MCP Methods

### tools/list
Returns available tools for code analysis and generation.

### tools/call
Executes a specific tool with provided arguments.

Available tools:
- `analyze_code`: Analyze code and provide insights
- `search_codebase`: Search through indexed code
- `generate_code`: Generate code from requirements
- `explain_code`: Explain how code works

### resources/list
Lists available resources (codebase, documentation).

### resources/read
Reads content from a specific resource.
""",
                    "metadata": {
                        "type": "documentation",
                        "topic": "api",
                        "file": "docs/api.md"
                    }
                }
            ]
            
            for i, doc in enumerate(sample_docs):
                await rag_engine.add_document_to_collection(
                    collection_name="documentation",
                    document_id=f"doc_{i}",
                    content=doc["content"],
                    metadata=doc["metadata"]
                )
            
            logger.info("✅ Sample documentation added")
        
        # Test the system
        logger.info("🧪 Testing RAG system...")
        
        # Test search
        search_results = await rag_engine.search_codebase("fibonacci algorithm", limit=1)
        if search_results:
            logger.info("✅ Search functionality working")
        else:
            logger.warning("⚠️ Search returned no results")
        
        # Test code analysis
        test_code = "def hello_world(): print('Hello, World!')"
        analysis = await rag_engine.analyze_code(test_code, "python")
        if analysis:
            logger.info("✅ Code analysis working")
        else:
            logger.warning("⚠️ Code analysis failed")
        
        logger.info("🎉 RAG system initialization completed successfully!")
        
        # Print statistics
        stats = await rag_engine.get_codebase_stats()
        logger.info(f"📊 System statistics: {stats}")
        
    except Exception as e:
        logger.error(f"❌ RAG initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(initialize_rag_system())