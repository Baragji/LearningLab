#!/bin/bash

# Start services for Code Assistant with OpenAI + ChromaDB
set -e

echo "🚀 Starting Code Assistant services..."

# Function to check if a service is running
check_service() {
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
        
        echo "⏳ Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Start ChromaDB in background
echo "🔵 Starting ChromaDB..."
chroma run --host 0.0.0.0 --port 8000 --path /app/chromadb &
CHROMADB_PID=$!

# Wait for ChromaDB to be ready
check_service "http://localhost:8000/api/v1/heartbeat" "ChromaDB"

# Load environment variables from .env file
if [ -f "../.env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env file not found. Checking for OPENAI_API_KEY..."
fi

# Verify OpenAI API Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY is not set"
    echo "Please create a .env file in the gcp-migration directory with:"
    echo "OPENAI_API_KEY=your-api-key-here"
    exit 1
fi

# Start Code Assistant MCP Server
echo "🟢 Starting Code Assistant MCP Server..."
cd /app
python3 -m uvicorn src.mcp_server:app --host 0.0.0.0 --port 8080 &
MCP_PID=$!

# Wait for MCP Server to be ready
check_service "http://localhost:8080/health" "Code Assistant MCP Server"

echo "🎉 All services are running!"
echo "📊 Health check: http://localhost:8080/health"
echo "🔵 ChromaDB: http://localhost:8000"
echo "🟢 MCP Server: http://localhost:8080"

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    kill $MCP_PID $CHROMADB_PID 2>/dev/null || true
    wait $MCP_PID $CHROMADB_PID 2>/dev/null || true
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Keep the script running and monitor processes
while true; do
    # Check if processes are still running
    if ! kill -0 $CHROMADB_PID 2>/dev/null; then
        echo "❌ ChromaDB process died, restarting..."
        chroma run --host 0.0.0.0 --port 8000 --path /app/chromadb &
        CHROMADB_PID=$!
    fi
    
    if ! kill -0 $MCP_PID 2>/dev/null; then
        echo "❌ MCP Server process died, restarting..."
        python3 -m uvicorn src.mcp_server:app --host 0.0.0.0 --port 8080 &
        MCP_PID=$!
    fi
    
    sleep 10
done
