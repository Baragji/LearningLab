#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

# Function to check if a process is running on a specific port
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Start the vector search server in the background
if ! check_port 5004; then
    echo "Starting Vector Search Server on port 5004..."
    ./start-rag-server.sh > logs/vector_search.log 2>&1 &
    echo "✅ Vector Search Server started (PID: $!)"
else
    echo "⚠️ Port 5004 is already in use. Vector Search Server may already be running."
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo "❌ Ollama is not running. Please start Ollama first."
    exit 1
fi

# Check if Qdrant is running
if ! curl -s http://localhost:6333/health > /dev/null; then
    echo "❌ Qdrant is not running. Starting Qdrant container..."
    docker run -d -p 6333:6333 qdrant/qdrant
    
    # Wait for Qdrant to start
    echo "Waiting for Qdrant to start..."
    for i in {1..10}; do
        if curl -s http://localhost:6333/health > /dev/null; then
            echo "✅ Qdrant is now running."
            break
        fi
        if [ $i -eq 10 ]; then
            echo "❌ Failed to start Qdrant. Please check Docker and try again."
            exit 1
        fi
        sleep 2
    done
fi

# Start the rag-docs-ollama MCP server
echo "Starting rag-docs-ollama MCP server..."
npx -y @sanderkooger/mcp-server-ragdocs > logs/rag_docs_ollama.log 2>&1 &
echo "✅ RAG Docs Ollama server started (PID: $!)"

echo ""
echo "All RAG servers are now running!"
echo "To view logs:"
echo "  - Vector Search Server: tail -f logs/vector_search.log"
echo "  - RAG Docs Ollama: tail -f logs/rag_docs_ollama.log"
echo ""
echo "To stop all servers, run: ./stop-all-rag-servers.sh"