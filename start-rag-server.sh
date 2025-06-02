#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

# Activate the virtual environment if it exists
if [ -d "mcp-venv" ]; then
    source mcp-venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Optimering: Ryd Python cache for at sikre friske imports
find mcp_services/rag_server -name "__pycache__" -type d -exec rm -rf {} +

# Tjek om Ollama kører
if ! curl -s http://localhost:11434/api/tags >/dev/null; then
    echo "⚠️ Advarsel: Ollama ser ikke ud til at køre på http://localhost:11434"
    echo "Start Ollama før du fortsætter for optimal ydeevne."
    read -p "Tryk Enter for at fortsætte alligevel, eller Ctrl+C for at afbryde..."
fi

# Run the indexing script if needed
if [ ! -d "chroma_db" ] || [ -z "$(ls -A chroma_db 2>/dev/null)" ]; then
    echo "ChromaDB directory is empty or doesn't exist. Running indexing script..."
    python mcp_services/rag_server/index_code_chunks.py
fi

# Optimering: Opret log-mappe hvis den ikke findes
mkdir -p logs

# Start the vector search server with optimized settings
echo "🚀 Starter RAG-server med optimerede indstillinger..."
echo "📝 Log gemmes i logs/rag_server.log"

# Kør serveren i baggrunden og log output
python -u mcp_services/rag_server/vector_search_server.py > logs/rag_server.log 2>&1 &

# Gem PID for nem reference
echo $! > logs/rag_server.pid
echo "✅ RAG-server startet med PID $(cat logs/rag_server.pid)"
echo "🌐 Server kører på http://localhost:5021"
echo "📊 Test serveren med: curl -X POST http://localhost:5021/search -H \"Content-Type: application/json\" -d '{\"query\": \"authentication\", \"n_results\": 3}'"
echo "🛑 Stop serveren med: ./stop-all-rag-servers.sh"