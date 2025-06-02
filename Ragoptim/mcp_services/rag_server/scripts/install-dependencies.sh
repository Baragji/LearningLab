#!/bin/bash

# Gå til projektets rodmappe
cd "$(dirname "$0")/../../../"
PROJECT_ROOT=$(pwd)

# Aktiver virtual environment hvis det findes
if [ -d "mcp-venv" ]; then
    source mcp-venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Installer afhængigheder
echo "🔄 Installerer afhængigheder..."
pip install -r "${PROJECT_ROOT}/mcp_services/rag_server/requirements.txt"

echo "✅ Afhængigheder installeret."