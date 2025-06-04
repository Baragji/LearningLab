#!/bin/bash

# MCP Server with RAG - Startup Script
# This script starts the MCP server with full RAG functionality

echo "🚀 Starting MCP Server with RAG Engine..."
echo "============================================"

# Check if we're in the right directory
if [ ! -f "src/mcp_server_with_rag.py" ]; then
    echo "❌ Error: Please run this script from the gcp-migration directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: src/mcp_server_with_rag.py"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ Please edit .env and add your OPENAI_API_KEY"
        echo "   Then run this script again"
        exit 1
    else
        echo "❌ Error: No .env.example file found"
        echo "   Please create a .env file with OPENAI_API_KEY=your_key_here"
        exit 1
    fi
fi

# Check if OPENAI_API_KEY is set
source .env
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not set in .env file"
    echo "   Please add: OPENAI_API_KEY=your_openai_api_key_here"
    exit 1
fi

# Check if Python dependencies are installed
echo "🔍 Checking Python dependencies..."
python3 -c "import fastapi, uvicorn, chromadb, openai" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
fi

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data/chromadb
fi

# Check if port 8080 is available
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Warning: Port 8080 is already in use"
    echo "   Checking if it's our MCP server..."
    
    # Test if it's our server
    curl -s http://localhost:8080/health >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ MCP Server is already running on port 8080"
        echo "🧪 Running E2E tests to verify functionality..."
        python3 test_e2e.py
        exit $?
    else
        echo "❌ Error: Port 8080 is occupied by another service"
        echo "   Please stop the other service or change the port"
        exit 1
    fi
fi

echo "✅ All checks passed!"
echo ""
echo "🚀 Starting MCP Server with RAG..."
echo "   Port: 8080"
echo "   RAG Engine: OpenAI (text-embedding-3-small + gpt-3.5-turbo)"
echo "   Vector DB: ChromaDB (local storage)"
echo ""
echo "📊 Endpoints:"
echo "   Health: http://localhost:8080/health"
echo "   MCP: http://localhost:8080/mcp"
echo "   Docs: http://localhost:8080/docs"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "============================================"

# Start the server
cd src
python3 mcp_server_with_rag.py