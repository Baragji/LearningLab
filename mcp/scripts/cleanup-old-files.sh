#!/bin/bash

# Gå til projektets rodmappe
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

# Opret legacy-mappe hvis den ikke findes
mkdir -p "${PROJECT_ROOT}/mcp/legacy"

# Liste over filer der skal flyttes til legacy-mappen
files_to_move=(
  "start-mcp.command"
  "start-mcp-optimized.sh"
  "stop-mcp.command"
  "stop-mcp-optimized.sh"
  "test-mcp.command"
  "stop-all-rag-servers.sh"
  "stop-rag-server.sh"
  "test-rag-pipeline.py"
  "test-rag-performance.py"
  "README.mcp.md"
  "README-RAG.md"
  "MCPtools.md"
  "docker-compose.mcp.yml"
)

echo "Flytter gamle filer til legacy-mappen..."

for file in "${files_to_move[@]}"; do
  if [ -f "${PROJECT_ROOT}/${file}" ]; then
    echo "Flytter ${file} til mcp/legacy/"
    mv "${PROJECT_ROOT}/${file}" "${PROJECT_ROOT}/mcp/legacy/"
  else
    echo "Fil ikke fundet: ${file}"
  fi
done

# Flyt rag_export til legacy
if [ -d "${PROJECT_ROOT}/rag_export" ]; then
  echo "Flytter rag_export til mcp/legacy/"
  mv "${PROJECT_ROOT}/rag_export" "${PROJECT_ROOT}/mcp/legacy/"
fi

# Flyt backup_old_rag til legacy
if [ -d "${PROJECT_ROOT}/backup_old_rag" ]; then
  echo "Flytter backup_old_rag til mcp/legacy/"
  mv "${PROJECT_ROOT}/backup_old_rag" "${PROJECT_ROOT}/mcp/legacy/"
fi

# Flyt mcp_services_backup til legacy
if [ -d "${PROJECT_ROOT}/mcp_services_backup_20250601_142849" ]; then
  echo "Flytter mcp_services_backup_20250601_142849 til mcp/legacy/"
  mv "${PROJECT_ROOT}/mcp_services_backup_20250601_142849" "${PROJECT_ROOT}/mcp/legacy/"
fi

echo "Oprydning fuldført!"
echo "Alle gamle MCP-relaterede filer er nu flyttet til mcp/legacy/ mappen."