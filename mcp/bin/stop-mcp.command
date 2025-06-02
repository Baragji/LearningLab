#!/bin/bash

# Farver
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${YELLOW}Stopper alle MCP Services...${NC}"

# Stop alle servere
pkill -f "vector_search_server.py"
pkill -f "prompt_history_server.py"
pkill -f "code_lens_server.py"

echo -e "\n${GREEN}✓ Alle servere er stoppet!${NC}"
echo -e "\nTryk Enter for at lukke..."
read -r