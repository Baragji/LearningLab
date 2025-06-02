#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

# Ensure logs directory exists
mkdir -p logs

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags >/dev/null; then
    echo "⚠️ Warning: Ollama does not appear to be running on http://localhost:11434"
    echo "Start Ollama before continuing for optimal performance."
    read -p "Press Enter to continue anyway, or Ctrl+C to abort..."
fi

# Start RAG server if not already running
if ! curl -s http://localhost:5004/health >/dev/null 2>&1; then
    echo "🚀 Starting RAG server..."
    ./start-rag-server.sh
    # Give it a moment to start up
    sleep 3
else
    echo "✅ RAG server is already running."
fi

# Start MCP with optimized configuration
echo "🚀 Starting MCP with optimized configuration..."
npx @anthropic-ai/mcp-server --config mcp_services/configs/mcp-config-optimized.json > logs/mcp.log 2>&1 &

# Save PID for easy reference
echo $! > logs/mcp.pid
echo "✅ MCP started with PID $(cat logs/mcp.pid)"
echo "📝 Logs are being saved to logs/mcp.log"
echo "🛑 To stop MCP, run: ./stop-mcp-optimized.sh"