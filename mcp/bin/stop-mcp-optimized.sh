#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")/../.."

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

# Stop MCP
if [ -f "mcp/logs/mcp.pid" ]; then
    pid=$(cat mcp/logs/mcp.pid)
    if ps -p $pid > /dev/null; then
        echo "Stopping MCP with PID $pid..."
        kill $pid
        sleep 1
        # Verify process is stopped
        if ps -p $pid > /dev/null; then
            echo "Process still running, forcing termination..."
            kill -9 $pid
        fi
        echo "✅ MCP stopped (PID: $pid)"
        rm mcp/logs/mcp.pid
    else
        echo "⚠️ PID file exists but process is not running"
        rm mcp/logs/mcp.pid
    fi
else
    echo "⚠️ No MCP PID file found"
fi

# Stop RAG server
./mcp/bin/stop-all-rag-servers.sh

echo "✅ All services have been stopped."
echo "🔄 To restart the services, run: ./mcp/bin/start-mcp-optimized.sh"