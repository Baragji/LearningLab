#!/bin/bash

# Gå til projekt mappen
cd "$(dirname "$0")"

# Farver
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${GREEN}Starter MCP Services...${NC}"

# Aktiver Python miljø
source mcp-venv/bin/activate

# Stop eksisterende servere
pkill -f "vector_search_server.py" 2>/dev/null
pkill -f "prompt_history_server.py" 2>/dev/null
pkill -f "code_lens_server.py" 2>/dev/null
sleep 1

# Start alle servere
echo -e "\n${YELLOW}Starter RAG Server...${NC}"
cd mcp_services/rag_server && python vector_search_server.py > ../logs/rag.log 2>&1 &

echo -e "${YELLOW}Starter Memory Server...${NC}"
cd ../memory_server && python prompt_history_server.py > ../logs/memory.log 2>&1 &

echo -e "${YELLOW}Starter Code Lens Server...${NC}"
cd ../code_lens_server && python code_lens_server.py > ../logs/lens.log 2>&1 &

sleep 3

echo -e "\n${GREEN}✓ Alle servere kører nu!${NC}"
echo -e "\nServere kører på:"
echo -e "  • RAG Server:       http://localhost:5005"
echo -e "  • Memory Server:    http://localhost:5007"
echo -e "  • Code Lens Server: http://localhost:5006"
echo -e "\n${YELLOW}Luk dette vindue for at stoppe alle servere${NC}"
echo -e "\nTryk Enter for at fortsætte..."
read -r

# Hold vinduet åbent
while true; do
    sleep 1
done
