#!/bin/bash

# Farver
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Automatisk Trae MCP Konfiguration        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Find Trae config fil
TRAE_CONFIG="$HOME/.trae/config.json"
PROJECT_ROOT="/Users/yousef/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab"

echo -e "${YELLOW}Tjekker Trae konfiguration...${NC}"

# Tjek om Trae config eksisterer
if [ ! -f "$TRAE_CONFIG" ]; then
    echo -e "${YELLOW}Trae config findes ikke. Opretter den...${NC}"
    mkdir -p "$HOME/.trae"
    echo '{}' > "$TRAE_CONFIG"
fi

# Backup original config
cp "$TRAE_CONFIG" "$TRAE_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Backup af original config gemt${NC}"

# Tjek om serverne kører
echo -e "\n${YELLOW}Tjekker om MCP servere kører...${NC}"
servers_running=true

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

if ! check_port 5005; then
    echo -e "${RED}✗ RAG Server kører ikke på port 5005${NC}"
    servers_running=false
else
    echo -e "${GREEN}✓ RAG Server kører${NC}"
fi

if ! check_port 5007; then
    echo -e "${RED}✗ Memory Server kører ikke på port 5007${NC}"
    servers_running=false
else
    echo -e "${GREEN}✓ Memory Server kører${NC}"
fi

if ! check_port 5006; then
    echo -e "${RED}✗ Code Lens Server kører ikke på port 5006${NC}"
    servers_running=false
else
    echo -e "${GREEN}✓ Code Lens Server kører${NC}"
fi

if [ "$servers_running" = false ]; then
    echo -e "\n${YELLOW}Starter manglende servere...${NC}"
    
    # Start serverne
    cd "$PROJECT_ROOT"
    if [ -f "start-mcp.command" ]; then
        echo -e "${YELLOW}Starter MCP servere...${NC}"
        osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT' && ./start-mcp.command\""
        echo -e "${YELLOW}Venter på at serverne starter (10 sekunder)...${NC}"
        sleep 10
    else
        echo -e "${RED}start-mcp.command ikke fundet!${NC}"
        echo -e "${YELLOW}Start serverne manuelt først${NC}"
        exit 1
    fi
fi

# Opret ny Trae config med MCP servere
echo -e "\n${YELLOW}Opdaterer Trae konfiguration...${NC}"

# Læs eksisterende config
if [ -f "$TRAE_CONFIG" ]; then
    EXISTING_CONFIG=$(cat "$TRAE_CONFIG")
else
    EXISTING_CONFIG='{}'
fi

# Opret Python script til at merge JSON
cat > /tmp/merge_trae_config.py << 'EOF'
import json
import sys

# Læs eksisterende config
try:
    with open(sys.argv[1], 'r') as f:
        config = json.load(f)
except:
    config = {}

# Sørg for at mcpServers eksisterer
if 'mcpServers' not in config:
    config['mcpServers'] = {}

# Definer MCP servere
project_root = sys.argv[2]

mcp_servers = {
    "rag-search": {
        "command": "python3",
        "args": [f"{project_root}/mcp_services/rag_server/vector_search_server.py"],
        "env": {
            "PYTHONPATH": f"{project_root}/mcp_services",
            "MCP_SERVER_NAME": "rag-search"
        }
    },
    "memory-assistant": {
        "command": "python3",
        "args": [f"{project_root}/mcp_services/memory_server/prompt_history_server.py"],
        "env": {
            "PYTHONPATH": f"{project_root}/mcp_services",
            "MCP_SERVER_NAME": "memory-assistant"
        }
    },
    "code-lens": {
        "command": "python3",
        "args": [f"{project_root}/mcp_services/code_lens_server/code_lens_server.py"],
        "env": {
            "PYTHONPATH": f"{project_root}/mcp_services",
            "MCP_SERVER_NAME": "code-lens"
        }
    }
}

# Opdater config
config['mcpServers'].update(mcp_servers)

# Gem opdateret config
with open(sys.argv[1], 'w') as f:
    json.dump(config, f, indent=2)

print("Config opdateret!")
EOF

# Kør Python script
python3 /tmp/merge_trae_config.py "$TRAE_CONFIG" "$PROJECT_ROOT"
rm /tmp/merge_trae_config.py

echo -e "${GREEN}✓ Trae konfiguration opdateret${NC}"

# Indekser kodebase hvis det ikke allerede er gjort
echo -e "\n${YELLOW}Tjekker om kodebase er indekseret...${NC}"
if [ -d "$PROJECT_ROOT/mcp_services/rag_server/chroma_db" ] && [ "$(ls -A $PROJECT_ROOT/mcp_services/rag_server/chroma_db)" ]; then
    echo -e "${GREEN}✓ Kodebase allerede indekseret${NC}"
else
    echo -e "${YELLOW}Indekserer kodebase...${NC}"
    cd "$PROJECT_ROOT/mcp_services/rag_server"
    source "$PROJECT_ROOT/mcp-venv/bin/activate" 2>/dev/null
    python index_code_chunks.py "$PROJECT_ROOT"
    echo -e "${GREEN}✓ Kodebase indekseret${NC}"
fi

# Opret standard agent
echo -e "\n${YELLOW}Opretter agent konfiguration...${NC}"

cat > "$PROJECT_ROOT/mcp_services/ai_assistant_agent.json" << 'EOF'
{
  "name": "AI Assistant med Hukommelse",
  "prompt": "Du er en intelligent udviklingsassistent med adgang til avancerede værktøjer:\n\n1. **RAG Search**: Du kan søge i hele kodebasen for at finde relevant kode\n2. **Memory**: Du kan huske tidligere samtaler og bruge templates\n3. **Code Lens**: Du kan analysere kode for problemer og foreslå forbedringer\n\nBrug disse værktøjer aktivt for at give de bedste svar. Husk altid at:\n- Søge i kodebasen før du svarer på spørgsmål om eksisterende kode\n- Gemme vigtige samtaler til hukommelsen\n- Analysere kode for potentielle problemer\n\nDu arbejder på LearningLab projektet - en Next.js baseret learning platform.",
  "tools": [
    "rag-search",
    "memory-assistant", 
    "code-lens",
    "filesystem",
    "terminal"
  ],
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.7
}
EOF

echo -e "${GREEN}✓ Agent konfiguration oprettet${NC}"

# Test at alt virker
echo -e "\n${YELLOW}Tester MCP integration...${NC}"

# Test RAG
echo -n "RAG Server: "
if curl -s http://localhost:5005/stats > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ Fejl${NC}"
fi

# Test Memory
echo -n "Memory Server: "
if curl -s http://localhost:5007/last?n=1 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ Fejl${NC}"
fi

# Test Code Lens
echo -n "Code Lens Server: "
if curl -s -X POST http://localhost:5006/analyze \
    -H "Content-Type: application/json" \
    -d '{"code": "test", "language": "python"}' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ Fejl${NC}"
fi

# Afslutning
echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✓ Automatisk setup færdig!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Hvad der er blevet gjort:${NC}"
echo -e "✓ Trae config opdateret med alle MCP servere"
echo -e "✓ Servere startet (hvis de ikke kørte)"
echo -e "✓ Kodebase indekseret"
echo -e "✓ Agent konfiguration oprettet"
echo ""
echo -e "${BLUE}Næste skridt:${NC}"
echo -e "1. ${YELLOW}Genstart Trae IDE${NC} (hvis den kører)"
echo -e "2. Gå til ${YELLOW}MCP fanen${NC} - du skulle se alle 3 servere med grøn flueben ✅"
echo -e "3. Gå til ${YELLOW}Agents fanen${NC} og importer: ${BLUE}ai_assistant_agent.json${NC}"
echo -e "4. Start en ny chat med din AI Assistant!"
echo ""
echo -e "${GREEN}Tip:${NC} Hvis serverne ikke vises i Trae, klik på opdater-knappen (↻) i MCP fanen"
echo ""
echo -e "${YELLOW}Vil du åbne Trae IDE nu? (j/n)${NC}"
read -r response

if [[ "$response" =~ ^[Jj]$ ]]; then
    echo -e "${GREEN}Åbner Trae IDE...${NC}"
    open -a "Trae" 2>/dev/null || echo -e "${RED}Kunne ikke åbne Trae automatisk. Åbn den manuelt.${NC}"
fi

echo -e "\n${GREEN}Færdig! Tryk Enter for at lukke...${NC}"
read -r