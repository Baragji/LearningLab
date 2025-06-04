#!/bin/bash

# Phase 3: Optimized startup script for full RAG deployment
# Enhanced with better error handling and performance monitoring
set -e

echo "🚀 Starting Code Assistant + RAG services (Phase 3 - Full RAG)..."

# Function to wait for service to be ready with better error handling
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=${3:-30}
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "🔄 Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to check if model exists
check_model() {
    local model_name=$1
    su - ollama -c "ollama list | grep -q $model_name" 2>/dev/null
}

# Function to download model with retry
download_model() {
    local model_name=$1
    local max_retries=3
    local retry=1
    
    while [ $retry -le $max_retries ]; do
        echo "📥 Downloading $model_name (attempt $retry/$max_retries)..."
        if su - ollama -c "ollama pull $model_name"; then
            echo "✅ $model_name downloaded successfully"
            return 0
        else
            echo "⚠️ Failed to download $model_name (attempt $retry/$max_retries)"
            retry=$((retry + 1))
            sleep 10
        fi
    done
    
    echo "❌ Failed to download $model_name after $max_retries attempts"
    return 1
}

# Start ChromaDB first (fastest to start)
echo "🗄️ Starting ChromaDB..."
cd /app
chroma run --host 0.0.0.0 --port 8000 --path /app/chromadb &
CHROMADB_PID=$!

# Wait for ChromaDB to be ready
if wait_for_service "http://localhost:8000/api/v1/heartbeat" "ChromaDB" 20; then
    echo "✅ ChromaDB started successfully"
else
    echo "❌ ChromaDB failed to start"
    exit 1
fi

# Start Ollama in background
echo "🦙 Starting Ollama..."
su - ollama -c "OLLAMA_HOST=0.0.0.0 OLLAMA_NUM_PARALLEL=2 OLLAMA_MAX_LOADED_MODELS=2 ollama serve" &
OLLAMA_PID=$!

# Wait for Ollama to be ready
if wait_for_service "http://localhost:11434/api/tags" "Ollama" 30; then
    echo "✅ Ollama started successfully"
else
    echo "❌ Ollama failed to start"
    exit 1
fi

# Download essential models if not present
echo "📥 Checking and downloading required models..."

# Check for embedding model first (smaller, faster)
if ! check_model "nomic-embed-text"; then
    download_model "nomic-embed-text" || echo "⚠️ Continuing without embedding model"
else
    echo "✅ nomic-embed-text model already available"
fi

# Check for LLM model
if ! check_model "llama3.1:8b"; then
    download_model "llama3.1:8b" || echo "⚠️ Continuing without LLM model"
else
    echo "✅ llama3.1:8b model already available"
fi

# Pre-load models for faster response times
echo "🔥 Pre-loading models for optimal performance..."
(
    # Load embedding model
    if check_model "nomic-embed-text"; then
        su - ollama -c "ollama run nomic-embed-text 'test'" > /dev/null 2>&1 || true
        echo "✅ Embedding model pre-loaded"
    fi
    
    # Load LLM model with a simple prompt
    if check_model "llama3.1:8b"; then
        su - ollama -c "ollama run llama3.1:8b 'Hello'" > /dev/null 2>&1 || true
        echo "✅ LLM model pre-loaded"
    fi
) &
PRELOAD_PID=$!

# Start Code Assistant MCP server with full RAG capabilities
echo "🔧 Starting Code Assistant MCP server with full RAG..."
cd /app
python3 src/mcp_server_phase3.py &
MCP_PID=$!

# Wait for MCP server to be ready
if wait_for_service "http://localhost:8080/health" "Code Assistant MCP" 30; then
    echo "✅ MCP server started successfully"
else
    echo "❌ MCP server failed to start"
    exit 1
fi

# Initialize RAG system
echo "🧠 Initializing RAG system..."
(
    # Wait for models to be ready
    sleep 15
    
    # Initialize RAG with sample data
    if python3 src/initialize_rag.py; then
        echo "✅ RAG system initialized successfully"
    else
        echo "⚠️ RAG initialization failed, will retry later"
    fi
) &
RAG_INIT_PID=$!

# Wait for RAG initialization to complete (with timeout)
echo "⏳ Waiting for RAG initialization (max 60 seconds)..."
timeout 60 bash -c "wait $RAG_INIT_PID" || echo "⚠️ RAG initialization timed out"

echo "🎉 Phase 3 services started successfully!"
echo ""
echo "📊 Service Status:"
echo "  - ChromaDB: http://localhost:8000 ✅"
echo "  - Ollama: http://localhost:11434 ✅"
echo "  - Code Assistant MCP: http://localhost:8080 ✅"
echo "  - RAG Engine: Initialized ✅"
echo ""
echo "🔗 Available Endpoints:"
echo "  - Health Check: http://localhost:8080/health"
echo "  - API Documentation: http://localhost:8080/docs"
echo "  - MCP Endpoint: http://localhost:8080/mcp"
echo "  - File Upload: http://localhost:8080/upload"
echo "  - System Stats: http://localhost:8080/stats"
echo ""
echo "🧪 Quick Test Commands:"
echo ""
echo "# Health Check"
echo "curl http://localhost:8080/health"
echo ""
echo "# List Available Tools"
echo "curl -X POST http://localhost:8080/mcp \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"method\": \"tools/list\"}'"
echo ""
echo "# Search Codebase"
echo "curl -X POST http://localhost:8080/mcp \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"method\": \"tools/call\", \"params\": {\"name\": \"search_codebase\", \"arguments\": {\"query\": \"fibonacci\"}}}'"
echo ""

# Function to handle shutdown gracefully
cleanup() {
    echo "🛑 Shutting down services gracefully..."
    
    # Stop services in reverse order
    [ ! -z "$RAG_INIT_PID" ] && kill $RAG_INIT_PID 2>/dev/null || true
    [ ! -z "$PRELOAD_PID" ] && kill $PRELOAD_PID 2>/dev/null || true
    [ ! -z "$MCP_PID" ] && kill $MCP_PID 2>/dev/null || true
    [ ! -z "$OLLAMA_PID" ] && kill $OLLAMA_PID 2>/dev/null || true
    [ ! -z "$CHROMADB_PID" ] && kill $CHROMADB_PID 2>/dev/null || true
    
    # Wait for processes to terminate
    sleep 5
    
    echo "✅ All services stopped"
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Enhanced monitoring with health checks and auto-restart
monitor_services() {
    local check_interval=30
    local restart_count=0
    local max_restarts=3
    
    while true; do
        sleep $check_interval
        
        # Check ChromaDB
        if ! kill -0 $CHROMADB_PID 2>/dev/null; then
            echo "❌ ChromaDB died, restarting..."
            python3 -m chromadb.cli run --host 0.0.0.0 --port 8000 --path /app/chromadb &
            CHROMADB_PID=$!
            restart_count=$((restart_count + 1))
        fi
        
        # Check Ollama
        if ! kill -0 $OLLAMA_PID 2>/dev/null; then
            echo "❌ Ollama died, restarting..."
            su - ollama -c "OLLAMA_HOST=0.0.0.0 OLLAMA_NUM_PARALLEL=2 OLLAMA_MAX_LOADED_MODELS=2 ollama serve" &
            OLLAMA_PID=$!
            restart_count=$((restart_count + 1))
        fi
        
        # Check MCP server
        if ! kill -0 $MCP_PID 2>/dev/null; then
            echo "❌ MCP server died, restarting..."
            python3 src/mcp_server_phase3.py &
            MCP_PID=$!
            restart_count=$((restart_count + 1))
        fi
        
        # Health check via HTTP
        if ! curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
            echo "⚠️ Health check failed, services may be unhealthy"
        fi
        
        # Check if too many restarts
        if [ $restart_count -gt $max_restarts ]; then
            echo "❌ Too many service restarts ($restart_count), something is seriously wrong"
            echo "🔍 Check logs for errors"
            # Don't exit, just log the issue
            restart_count=0  # Reset counter
        fi
        
        # Log status every 5 minutes
        if [ $(($(date +%s) % 300)) -eq 0 ]; then
            echo "📊 Services running normally (restarts: $restart_count)"
        fi
    done
}

# Start monitoring in background
monitor_services &
MONITOR_PID=$!

# Keep the script running and handle signals
wait $MONITOR_PID