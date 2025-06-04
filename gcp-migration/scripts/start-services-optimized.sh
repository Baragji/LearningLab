#!/bin/bash

# Optimized startup script for Phase 2 deployment
set -e

echo "🚀 Starting Code Assistant + RAG services (Phase 2)..."

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=60
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

# Start ChromaDB first (lighter service)
echo "🗄️ Starting ChromaDB..."
cd /app
python3 -m chromadb.cli run --host 0.0.0.0 --port 8000 --path /app/chromadb &
CHROMADB_PID=$!

# Wait for ChromaDB to be ready
wait_for_service "http://localhost:8000/api/v1/heartbeat" "ChromaDB"

# Start Ollama in background
echo "🦙 Starting Ollama..."
su - ollama -c "OLLAMA_HOST=0.0.0.0 ollama serve" &
OLLAMA_PID=$!

# Wait for Ollama to be ready
wait_for_service "http://localhost:11434/api/tags" "Ollama"

# Download models in background to speed up startup
echo "📥 Starting model downloads in background..."
(
    echo "📥 Downloading llama3.1:8b model..."
    su - ollama -c "ollama pull llama3.1:8b" || echo "⚠️ Failed to download llama3.1:8b"
    
    echo "📥 Downloading nomic-embed-text model..."
    su - ollama -c "ollama pull nomic-embed-text" || echo "⚠️ Failed to download nomic-embed-text"
    
    echo "✅ Model downloads completed"
) &
MODEL_DOWNLOAD_PID=$!

# Start Code Assistant MCP server (can work with basic models)
echo "🔧 Starting Code Assistant MCP server..."
cd /app
python3 src/mcp_server.py &
MCP_PID=$!

# Wait for MCP server to be ready
wait_for_service "http://localhost:8080/health" "Code Assistant MCP"

# Initialize RAG system in background
echo "🧠 Initializing RAG system in background..."
(
    sleep 30  # Give models time to download
    python3 src/initialize_rag.py || echo "⚠️ RAG initialization failed, will retry later"
) &
RAG_INIT_PID=$!

echo "🎉 Core services started successfully!"
echo "📊 Service status:"
echo "  - ChromaDB: http://localhost:8000 ✅"
echo "  - Ollama: http://localhost:11434 ✅"
echo "  - Code Assistant MCP: http://localhost:8080 ✅"
echo "  - Model downloads: In progress..."
echo "  - RAG initialization: In progress..."

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $OLLAMA_PID $CHROMADB_PID $MCP_PID $MODEL_DOWNLOAD_PID $RAG_INIT_PID 2>/dev/null || true
    wait
    echo "✅ All services stopped"
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Monitor services and restart if needed
while true; do
    # Check if core services are running
    if ! kill -0 $CHROMADB_PID 2>/dev/null; then
        echo "❌ ChromaDB died, restarting..."
        python3 -m chromadb.cli run --host 0.0.0.0 --port 8000 --path /app/chromadb &
        CHROMADB_PID=$!
    fi
    
    if ! kill -0 $OLLAMA_PID 2>/dev/null; then
        echo "❌ Ollama died, restarting..."
        su - ollama -c "OLLAMA_HOST=0.0.0.0 ollama serve" &
        OLLAMA_PID=$!
    fi
    
    if ! kill -0 $MCP_PID 2>/dev/null; then
        echo "❌ MCP server died, restarting..."
        python3 src/mcp_server.py &
        MCP_PID=$!
    fi
    
    sleep 30
done