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
        return 0
    else
        echo "No process found on port $port"
        return 1
    fi
}

# Stop the Vector Search Server
if kill_port 5004; then
    echo "✅ Vector Search Server stopped"
else
    echo "⚠️ Vector Search Server was not running"
fi

# Denne del er fjernet, da vi ikke bruger rag-docs-ollama i den nye implementering

echo "All RAG servers have been stopped."