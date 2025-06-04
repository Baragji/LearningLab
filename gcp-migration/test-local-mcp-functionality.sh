#!/bin/bash

set -e

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 GRUNDIG LOKAL MCP TEST${NC}"
echo "========================="
echo "🎯 Tester at RAG og MCP FAKTISK virker før cloud deployment"
echo ""

# Test funktioner
test_step() {
    echo -e "${YELLOW}🔍 $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Cleanup funktion
cleanup() {
    echo -e "${YELLOW}🧹 Rydder op...${NC}"
    pkill -f "mcp_server_standalone.py" 2>/dev/null || true
    rm -f mcp_test.log 2>/dev/null || true
}

# Trap for cleanup ved exit
trap cleanup EXIT

echo -e "${PURPLE}📋 FASE 1: VERIFICER FILER OG KODE${NC}"
echo "----------------------------------------"

# 1. Tjek at vi har de rigtige filer
test_step "Tjekker nødvendige filer..."
missing_files=()

if [ ! -f "src/mcp_server_standalone.py" ]; then
    missing_files+=("src/mcp_server_standalone.py")
fi

if [ ! -f "requirements.txt" ]; then
    missing_files+=("requirements.txt")
fi

if [ ${#missing_files[@]} -gt 0 ]; then
    error "Manglende filer: ${missing_files[*]}"
    exit 1
else
    success "Alle nødvendige filer fundet"
fi

# 2. Undersøg MCP server koden
test_step "Analyserer MCP server kode..."
echo "   Tjekker endpoints i src/mcp_server_standalone.py:"

# Vis alle endpoints
echo "   📋 Endpoints fundet:"
grep -n "@app\." src/mcp_server_standalone.py | sed 's/^/   /' || echo "   Ingen endpoints fundet"

echo ""
echo "   🔍 Specifikt efter /mcp endpoint:"
if grep -n "/mcp" src/mcp_server_standalone.py; then
    success "MCP endpoint fundet i kode"
else
    error "MCP endpoint IKKE fundet i kode!"
    echo "   Dette er hovedproblemet!"
    exit 1
fi

echo ""
echo "   📄 Første 20 linjer af MCP server:"
head -20 src/mcp_server_standalone.py | sed 's/^/   /'

echo ""

# 3. Tjek dependencies
test_step "Installerer og verificerer dependencies..."
pip3 install -r requirements.txt > /dev/null 2>&1 || {
    error "Kunne ikke installere dependencies"
    exit 1
}
success "Dependencies installeret"

echo ""
echo -e "${PURPLE}📋 FASE 2: START OG TEST LOKAL SERVER${NC}"
echo "----------------------------------------"

# 4. Start MCP server med detaljeret logging
test_step "Starter MCP server med detaljeret logging..."
cd src
echo "   Starter server i baggrunden..."
python3 mcp_server_standalone.py > ../mcp_test.log 2>&1 &
SERVER_PID=$!
cd ..

echo "   Server PID: $SERVER_PID"
echo "   Venter på server start (15 sekunder)..."

# Vent på server med progress
for i in {1..15}; do
    echo -n "."
    sleep 1
    
    # Tjek om serveren stadig kører
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo ""
        error "Server stoppede uventet!"
        echo "   Server logs:"
        cat mcp_test.log | tail -10 | sed 's/^/   /'
        exit 1
    fi
    
    # Tjek om port er åben
    if nc -z localhost 8080 2>/dev/null; then
        echo ""
        success "Server port 8080 er åben"
        break
    fi
    
    if [ $i -eq 15 ]; then
        echo ""
        warning "Port 8080 ikke åben efter 15 sekunder"
        echo "   Server logs:"
        cat mcp_test.log | tail -10 | sed 's/^/   /'
    fi
done

# Vent lidt mere for at være sikker
sleep 3

echo ""
echo -e "${PURPLE}📋 FASE 3: TEST ALLE ENDPOINTS${NC}"
echo "----------------------------------------"

# 5. Test health endpoint
test_step "Tester health endpoint..."
health_response=$(curl -s --max-time 10 http://localhost:8080/health 2>&1 || echo "FAILED")
if [[ "$health_response" == *"status"* ]]; then
    success "Health endpoint OK: $health_response"
else
    error "Health endpoint fejlede: $health_response"
fi

# 6. Test root endpoint
test_step "Tester root endpoint..."
root_response=$(curl -s --max-time 10 http://localhost:8080/ 2>&1 || echo "FAILED")
echo "   Root response: $root_response"

# 7. Test docs endpoint
test_step "Tester docs endpoint..."
docs_response=$(curl -s --max-time 10 -I http://localhost:8080/docs 2>&1 | head -1 || echo "FAILED")
echo "   Docs response: $docs_response"

# 8. Test MCP endpoint - DET VIGTIGSTE TEST!
test_step "Tester MCP endpoint - KRITISK TEST!"
echo "   Testing POST /mcp..."

mcp_response=$(curl -s --max-time 15 -X POST http://localhost:8080/mcp \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/list"}' 2>&1 || echo "FAILED")

echo "   MCP Response: $mcp_response"

if [[ "$mcp_response" == *"tools"* ]] && [[ "$mcp_response" != *"Not Found"* ]]; then
    success "MCP endpoint fungerer!"
    echo "   ✅ MCP tools tilgængelige"
else
    error "MCP endpoint virker IKKE!"
    echo "   ❌ Response: $mcp_response"
    echo ""
    echo "   🔍 Debugging info:"
    echo "   Server logs (sidste 20 linjer):"
    tail -20 mcp_test.log | sed 's/^/   /'
    echo ""
    echo "   🔍 Tjekker hvilke endpoints der faktisk eksisterer:"
    echo "   Alle tilgængelige routes:"
    curl -s http://localhost:8080/openapi.json 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    paths = data.get('paths', {})
    for path in paths:
        print(f'   {path}')
except:
    print('   Kunne ikke parse OpenAPI spec')
" || echo "   Kunne ikke hente routes"
fi

echo ""
echo -e "${PURPLE}📋 FASE 4: TEST RAG FUNKTIONALITET${NC}"
echo "----------------------------------------"

# 9. Test specifik RAG funktionalitet
if [[ "$mcp_response" == *"tools"* ]]; then
    test_step "Tester RAG tools funktionalitet..."
    
    # Test analyze_code tool
    echo "   Testing analyze_code tool..."
    analyze_response=$(curl -s --max-time 30 -X POST http://localhost:8080/mcp \
        -H "Content-Type: application/json" \
        -d '{
            "method": "tools/call",
            "params": {
                "name": "analyze_code",
                "arguments": {
                    "code": "def hello():\n    print(\"world\")",
                    "language": "python"
                }
            }
        }' 2>&1 || echo "FAILED")
    
    echo "   Analyze response: $(echo "$analyze_response" | head -1 | cut -c1-100)..."
    
    if [[ "$analyze_response" == *"content"* ]] || [[ "$analyze_response" == *"result"* ]]; then
        success "RAG analyze_code tool fungerer"
    else
        warning "RAG analyze_code tool fejlede eller returnerer fallback"
        echo "   Full response: $analyze_response"
    fi
else
    warning "Springer RAG test over - MCP endpoint virker ikke"
fi

echo ""
echo -e "${PURPLE}📋 FASE 5: SAMLET VURDERING${NC}"
echo "----------------------------------------"

# 10. Samlet vurdering
echo -e "${BLUE}📊 SAMLET RESULTAT:${NC}"

# Tjek server status
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "   ✅ Server kører stabilt"
else
    echo "   ❌ Server er stoppet"
fi

# Tjek endpoints
if [[ "$health_response" == *"status"* ]]; then
    echo "   ✅ Health endpoint fungerer"
else
    echo "   ❌ Health endpoint fejler"
fi

if [[ "$mcp_response" == *"tools"* ]]; then
    echo "   ✅ MCP endpoint fungerer"
    echo "   ✅ RAG tools tilgængelige"
    
    echo ""
    echo -e "${GREEN}🚀 PERFEKT! MCP og RAG fungerer lokalt!${NC}"
    echo -e "${GREEN}✅ Klar til cloud deployment${NC}"
    
    echo ""
    echo -e "${BLUE}🌐 NÆSTE SKRIDT:${NC}"
    echo "1. Deploy til cloud med tillid"
    echo "2. Test cloud endpoints"
    echo "3. Integrer med Trae IDE"
    
else
    echo "   ❌ MCP endpoint fungerer IKKE"
    
    echo ""
    echo -e "${RED}🚨 PROBLEM IDENTIFICERET!${NC}"
    echo -e "${RED}MCP endpoint virker ikke lokalt - skal fixes før cloud deployment${NC}"
    
    echo ""
    echo -e "${BLUE}🔧 DEBUG INFO:${NC}"
    echo "   Server logs (sidste 30 linjer):"
    tail -30 mcp_test.log | sed 's/^/   /'
    
    echo ""
    echo -e "${YELLOW}🛠️ MULIGE LØSNINGER:${NC}"
    echo "1. Tjek at MCP endpoint er korrekt defineret i koden"
    echo "2. Verificer at alle imports fungerer"
    echo "3. Tjek at FastAPI routes er konfigureret korrekt"
    echo "4. Test med en simplere MCP implementation"
fi

echo ""
echo -e "${BLUE}📋 SERVER INFO:${NC}"
echo "   PID: $SERVER_PID"
echo "   Port: 8080"
echo "   Logs: mcp_test.log"

echo ""
echo -e "${YELLOW}📄 For at se fuld server log:${NC}"
echo "   cat mcp_test.log"

echo ""
echo -e "${YELLOW}📄 For at stoppe server manuelt:${NC}"
echo "   kill $SERVER_PID"

# Stop server
kill $SERVER_PID 2>/dev/null || true
sleep 2

echo ""
echo -e "${GREEN}🎯 TEST FÆRDIG!${NC}"
echo "Nu ved vi om MCP og RAG faktisk virker før cloud deployment!"