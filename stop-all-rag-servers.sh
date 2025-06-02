#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

# Function to kill process running on a specific port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i :$port)
    if [ -n "$pid" ]; then
        echo "Stopping process on port $port (PID: $pid)..."
        kill $pid
        sleep 1
        # Verify process is stopped
        if ps -p $pid > /dev/null; then
            echo "Process still running, forcing termination..."
            kill -9 $pid
        fi
        return 0
    else
        echo "No process found on port $port"
        return 1
    fi
}

# Check for PID file first
if [ -f "logs/rag_server.pid" ]; then
    pid=$(cat logs/rag_server.pid)
    if ps -p $pid > /dev/null; then
        echo "Stopping RAG server with PID $pid..."
        kill $pid
        sleep 1
        # Verify process is stopped
        if ps -p $pid > /dev/null; then
            echo "Process still running, forcing termination..."
            kill -9 $pid
        fi
        echo "✅ Vector Search Server stopped (PID: $pid)"
        rm logs/rag_server.pid
    else
        echo "⚠️ PID file exists but process is not running"
        rm logs/rag_server.pid
    fi
# Fallback to port-based detection
elif kill_port 5004; then
    echo "✅ Vector Search Server stopped"
else
    echo "⚠️ Vector Search Server was not running"
fi

# Clean up any Python cache files
echo "🧹 Cleaning up Python cache files..."
find mcp_services/rag_server -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

echo "✅ All RAG servers have been stopped."
echo "🔄 To restart the server, run: ./start-rag-server.sh"