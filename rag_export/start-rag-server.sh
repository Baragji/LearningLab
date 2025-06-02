#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

# Activate the virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Run the indexing script if needed
if [ ! -d "chroma_db" ] || [ -z "$(ls -A chroma_db 2>/dev/null)" ]; then
    echo "ChromaDB directory is empty or doesn't exist. Running indexing script..."
    python rag_server/index_code_chunks.py
fi

# Start the vector search server
python rag_server/vector_search_server.py