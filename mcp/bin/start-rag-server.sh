#!/bin/bash

# Gå til projektets rodmappe
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

# Aktiver virtual environment hvis det findes
if [ -d "mcp-venv" ]; then
    source mcp-venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Ryd Python cache for at sikre friske imports
find "${PROJECT_ROOT}/mcp/services/rag_server" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Tjek om Ollama kører
if ! curl -s http://localhost:11434/api/tags >/dev/null; then
    echo "⚠️ Advarsel: Ollama ser ikke ud til at køre på http://localhost:11434"
    echo "Start Ollama før du fortsætter for optimal ydeevne."
    read -p "Tryk Enter for at fortsætte alligevel, eller Ctrl+C for at afbryde..."
fi

# Kør indekseringsscript hvis nødvendigt
if [ ! -d "${PROJECT_ROOT}/mcp/data/chroma_db" ] || [ -z "$(ls -A ${PROJECT_ROOT}/mcp/data/chroma_db 2>/dev/null)" ]; then
    echo "ChromaDB directory is empty or doesn't exist. Running indexing script..."
    python "${PROJECT_ROOT}/mcp/services/rag_server/index_code_chunks.py"
fi

# Opret log-mappe hvis den ikke findes
mkdir -p "${PROJECT_ROOT}/mcp/logs"

# Start RAG-serveren med optimerede indstillinger
echo "🚀 Starter RAG-server med optimerede indstillinger..."
echo "📝 Log gemmes i mcp/logs/rag_server.log"

# Kør serveren i baggrunden og log output
python -u "${PROJECT_ROOT}/mcp/services/rag_server/vector_search_server.py" > "${PROJECT_ROOT}/mcp/logs/rag_server.log" 2>&1 &

# Gem PID for nem reference
echo $! > "${PROJECT_ROOT}/mcp/logs/rag_server.pid"
echo "✅ RAG-server startet med PID $(cat ${PROJECT_ROOT}/mcp/logs/rag_server.pid)"
echo "🌐 Server kører på http://localhost:5021"
echo "📊 Test serveren med: curl -X POST http://localhost:5021/search -H \"Content-Type: application/json\" -d '{\"query\": \"authentication\", \"n_results\": 3}'"
echo "🛑 Stop serveren med: ${PROJECT_ROOT}/mcp/bin/stop-rag-server.sh"