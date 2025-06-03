#!/bin/bash

# Startup script for Code Assistant + Ollama + ChromaDB services
set -e

echo "🚀 Starting Code Assistant + Ollama + ChromaDB services..."

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "🔄 Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Start Ollama in background
echo "🦙 Starting Ollama..."
su - ollama -c "OLLAMA_HOST=0.0.0.0 ollama serve" &
OLLAMA_PID=$!

# Wait for Ollama to be ready
wait_for_service "http://localhost:11434/api/tags" "Ollama"

# Pull required models if not already present
echo "📥 Ensuring required models are available..."

# Check if models exist, pull if not
if ! su - ollama -c "ollama list" | grep -q "llama3.1:8b"; then
    echo "📥 Pulling llama3.1:8b model..."
    su - ollama -c "ollama pull llama3.1:8b"
else
    echo "✅ llama3.1:8b model already available"
fi

if ! su - ollama -c "ollama list" | grep -q "nomic-embed-text"; then
    echo "📥 Pulling nomic-embed-text model..."
    su - ollama -c "ollama pull nomic-embed-text"
else
    echo "✅ nomic-embed-text model already available"
fi

# Start ChromaDB in background
echo "🗄️ Starting ChromaDB..."
cd /app
python3 -m chromadb.cli run --host 0.0.0.0 --port 8000 --path /app/chromadb &
CHROMADB_PID=$!

# Wait for ChromaDB to be ready
wait_for_service "http://localhost:8000/api/v1/heartbeat" "ChromaDB"

# Initialize RAG system
echo "🧠 Initializing RAG system..."
python3 src/initialize_rag.py

# Start Code Assistant MCP server
echo "🔧 Starting Code Assistant MCP server..."
cd /app
python3 src/mcp_server.py &
MCP_PID=$!

# Wait for MCP server to be ready
wait_for_service "http://localhost:8080/health" "Code Assistant MCP"

echo "🎉 All services started successfully!"
echo "📊 Service status:"
echo "  - Ollama: http://localhost:11434"
echo "  - ChromaDB: http://localhost:8000"
echo "  - Code Assistant MCP: http://localhost:8080"

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $OLLAMA_PID $CHROMADB_PID $MCP_PID 2>/dev/null || true
    wait
    echo "✅ All services stopped"
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Keep the script running and monitor services
while true; do
    # Check if any service died
    if ! kill -0 $OLLAMA_PID 2>/dev/null; then
        echo "❌ Ollama died, restarting..."
        su - ollama -c "OLLAMA_HOST=0.0.0.0 ollama serve" &
        OLLAMA_PID=$!
    fi
    
    if ! kill -0 $CHROMADB_PID 2>/dev/null; then
        echo "❌ ChromaDB died, restarting..."
        python3 -m chromadb.cli run --host 0.0.0.0 --port 8000 --path /app/chromadb &
        CHROMADB_PID=$!
    fi
    
    if ! kill -0 $MCP_PID 2>/dev/null; then
        echo "❌ MCP server died, restarting..."
        python3 src/mcp_server.py &
        MCP_PID=$!
    fi
    
    sleep 10
done