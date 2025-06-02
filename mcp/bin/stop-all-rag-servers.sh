#!/bin/bash

# Gå til projektets rodmappe
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

# Funktion til at dræbe proces på en specifik port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i :$port)
    if [ -n "$pid" ]; then
        echo "Stopper proces på port $port (PID: $pid)..."
        kill $pid
        sleep 1
        # Verificer at processen er stoppet
        if ps -p $pid > /dev/null; then
            echo "Processen kører stadig, tvinger afslutning..."
            kill -9 $pid
        fi
        return 0
    else
        echo "Ingen proces fundet på port $port"
        return 1
    fi
}

# Tjek først for PID-fil
if [ -f "${PROJECT_ROOT}/mcp/logs/rag_server.pid" ]; then
    pid=$(cat "${PROJECT_ROOT}/mcp/logs/rag_server.pid")
    if ps -p $pid > /dev/null; then
        echo "Stopper RAG-server med PID $pid..."
        kill $pid
        sleep 1
        # Verificer at processen er stoppet
        if ps -p $pid > /dev/null; then
            echo "Processen kører stadig, tvinger afslutning..."
            kill -9 $pid
        fi
        echo "✅ Vector Search Server stoppet (PID: $pid)"
        rm "${PROJECT_ROOT}/mcp/logs/rag_server.pid"
    else
        echo "⚠️ PID-fil eksisterer, men processen kører ikke"
        rm "${PROJECT_ROOT}/mcp/logs/rag_server.pid"
    fi
# Fallback til port-baseret detektion
elif kill_port 5021; then
    echo "✅ Vector Search Server stoppet"
elif kill_port 5004; then
    echo "✅ Vector Search Server (gammel port) stoppet"
else
    echo "⚠️ Vector Search Server kørte ikke"
fi

# Ryd Python cache-filer
echo "🧹 Rydder Python cache-filer..."
find "${PROJECT_ROOT}/mcp/services/rag_server" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

echo "✅ Alle RAG-servere er blevet stoppet."
echo "🔄 For at genstarte serveren, kør: ${PROJECT_ROOT}/mcp/bin/start-rag-server.sh"