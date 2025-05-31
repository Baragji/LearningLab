#!/bin/bash

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Ingen farve

clear
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MCP Services - Automatisk Setup        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Dette script vil automatisk installere alt for dig!${NC}"
echo -e "${YELLOW}Du skal bare vente mens det kører...${NC}"
echo ""
echo -e "${GREEN}Tryk Enter for at starte${NC}"
read -r

# Find hvor vi er
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Tjek om vi har Python
echo -e "\n${YELLOW}[1/7] Tjekker om Python er installeret...${NC}"
if command -v python3 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Python er installeret!${NC}"
    PYTHON_CMD="python3"
else
    echo -e "${RED}✗ Python mangler!${NC}"
    echo -e "${YELLOW}Installer Python med Homebrew...${NC}"
    
    # Tjek om Homebrew er installeret
    if ! command -v brew >/dev/null 2>&1; then
        echo -e "${YELLOW}Homebrew mangler også. Installer det først...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Installer Python
    brew install python3
    PYTHON_CMD="python3"
fi

# Opret requirements.txt hvis den ikke findes
echo -e "\n${YELLOW}[2/7] Opretter requirements.txt...${NC}"
cat > "$SCRIPT_DIR/requirements.txt" << 'EOF'
flask
chromadb
sentence-transformers
numpy
scikit-learn
EOF
echo -e "${GREEN}✓ requirements.txt oprettet!${NC}"

# Opret virtuel miljø
echo -e "\n${YELLOW}[3/7] Opretter Python miljø...${NC}"
VENV_DIR="$PROJECT_ROOT/mcp-venv"
rm -rf "$VENV_DIR" 2>/dev/null
$PYTHON_CMD -m venv "$VENV_DIR"
echo -e "${GREEN}✓ Python miljø oprettet!${NC}"

# Aktiver miljø og installer pakker
echo -e "\n${YELLOW}[4/7] Installerer nødvendige pakker (dette kan tage et par minutter)...${NC}"
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip >/dev/null 2>&1
pip install -r "$SCRIPT_DIR/requirements.txt"
echo -e "${GREEN}✓ Alle pakker installeret!${NC}"

# Opret mapper
echo -e "\n${YELLOW}[5/7] Opretter nødvendige mapper...${NC}"
mkdir -p "$SCRIPT_DIR/rag_server/chroma_db"
mkdir -p "$SCRIPT_DIR/memory_server/prompt_history"
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/pids"
echo -e "${GREEN}✓ Mapper oprettet!${NC}"

# Opret start script
echo -e "\n${YELLOW}[6/7] Opretter start script...${NC}"
cat > "$PROJECT_ROOT/start-mcp.command" << 'EOF'
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
EOF

chmod +x "$PROJECT_ROOT/start-mcp.command"

# Opret stop script
cat > "$PROJECT_ROOT/stop-mcp.command" << 'EOF'
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
EOF

chmod +x "$PROJECT_ROOT/stop-mcp.command"

# Opret test script
echo -e "\n${YELLOW}[7/7] Opretter test script...${NC}"
cat > "$PROJECT_ROOT/test-mcp.command" << 'EOF'
#!/bin/bash

# Gå til projekt mappen
cd "$(dirname "$0")"

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
EOF

chmod +x "$PROJECT_ROOT/test-mcp.command"

# Afslutning
clear
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✓ Setup er færdig!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Jeg har oprettet 3 filer til dig:${NC}"
echo ""
echo -e "1. ${BLUE}start-mcp.command${NC} - Dobbeltklik for at starte alle servere"
echo -e "2. ${BLUE}stop-mcp.command${NC}  - Dobbeltklik for at stoppe alle servere"
echo -e "3. ${BLUE}test-mcp.command${NC}  - Dobbeltklik for at teste om serverne kører"
echo ""
echo -e "${GREEN}Sådan bruger du det:${NC}"
echo -e "1. Dobbeltklik på ${BLUE}start-mcp.command${NC} for at starte"
echo -e "2. Vent til den siger alle servere kører"
echo -e "3. Lad vinduet være åbent mens du arbejder"
echo -e "4. Luk vinduet når du er færdig (eller brug ${BLUE}stop-mcp.command${NC})"
echo ""
echo -e "${YELLOW}Vil du starte serverne nu? (j/n)${NC}"
read -r response

if [[ "$response" =~ ^[Jj]$ ]]; then
    echo -e "\n${GREEN}Starter serverne...${NC}"
    open "$PROJECT_ROOT/start-mcp.command"
fi

echo -e "\n${GREEN}Færdig! Tryk Enter for at lukke...${NC}"
read -r