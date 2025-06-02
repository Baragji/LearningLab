#!/bin/bash

# Gå til projektets rodmappe
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

# Stop RAG server
echo "🛑 Stopper RAG-server..."
pkill -f "python.*mcp/services/rag_server/vector_search_server.py"

# Tjek om serveren er stoppet
if lsof -i :5021 > /dev/null 2>&1; then
    echo "⚠️ RAG-server kører stadig, tvinger afslutning..."
    pkill -9 -f "python.*mcp/services/rag_server/vector_search_server.py"
else
    echo "✅ RAG-server stoppet."
fi

# Fjern PID-fil hvis den findes
if [ -f "${PROJECT_ROOT}/mcp/logs/rag_server.pid" ]; then
    rm "${PROJECT_ROOT}/mcp/logs/rag_server.pid"
fi

echo "🔄 For at starte RAG-serveren igen, kør: ${PROJECT_ROOT}/mcp/bin/start-rag-server.sh"