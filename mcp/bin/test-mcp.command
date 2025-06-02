#!/bin/bash

# Gå til projekt mappen
cd "$(dirname "$0")/../.."

# Farver
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${YELLOW}Tester MCP Services...${NC}\n"

# Test hver server
servers=(
    "RAG Server|http://localhost:5005/stats"
    "Memory Server|http://localhost:5007/last?n=1"
    "Code Lens Server|http://localhost:5006/analyze"
)

for server_info in "${servers[@]}"; do
    IFS='|' read -r name url <<< "$server_info"
    
    if [[ "$name" == "Code Lens Server" ]]; then
        # Code Lens kræver POST
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d '{"code": "test", "language": "python"}' 2>/dev/null | tail -n 1)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null | tail -n 1)
    fi
    
    if [[ "$response" == "200" ]]; then
        echo -e "${GREEN}✓ $name kører!${NC}"
    else
        echo -e "${RED}✗ $name kører ikke${NC}"
    fi
done

echo -e "\nTryk Enter for at lukke..."
read -r