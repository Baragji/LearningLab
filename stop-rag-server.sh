#!/bin/bash

# Stop RAG server
echo "🛑 Stopper RAG-server..."
pkill -f "python3 mcp_services/rag_server/vector_search_server.py"

# Tjek om serveren er stoppet
if lsof -i :5021 > /dev/null 2>&1; then
    echo "⚠️ RAG-server kører stadig, tvinger afslutning..."
    pkill -9 -f "python3 mcp_services/rag_server/vector_search_server.py"
else
    echo "✅ RAG-server stoppet."
fi

# Fjern PID-fil hvis den findes
if [ -f "logs/rag_server.pid" ]; then
    rm logs/rag_server.pid
fi

echo "🔄 For at starte RAG-serveren igen, kør: python3 mcp_services/rag_server/vector_search_server.py"