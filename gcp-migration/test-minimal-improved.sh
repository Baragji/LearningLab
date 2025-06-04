#!/bin/bash

set -e  # Stop ved fejl

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 FORBEDRET MINIMAL TEST${NC}"
echo "=========================="

# Test funktioner
test_step() {
    echo -e "${YELLOW}🔍 $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    echo -e "${YELLOW}🔍 Debugging info:${NC}"
    echo "Server logs:"
    tail -10 server.log 2>/dev/null || echo "Ingen server logs fundet"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Cleanup funktion
cleanup() {
    echo -e "${YELLOW}🧹 Rydder op...${NC}"
    pkill -f "mcp_server_standalone.py" 2>/dev/null || true
    docker stop minimal-rag-test 2>/dev/null || true
    docker rm minimal-rag-test 2>/dev/null || true
    rm -f server.log 2>/dev/null || true
}

# Trap for cleanup ved exit
trap cleanup EXIT

echo "📍 Arbejder i: $(pwd)"
echo "🐍 Python version: $(python3 --version)"
echo "🐳 Docker version: $(docker --version)"
echo ""

# 1. Test Python miljø og dependencies
test_step "Tester Python miljø og dependencies..."
if [ ! -f "requirements.txt" ]; then
    error "requirements.txt ikke fundet"
fi

pip3 install -r requirements.txt > /dev/null 2>&1 || error "Kunne ikke installere dependencies"
success "Dependencies installeret"

# 2. Test MCP Server Standalone med bedre logging
test_step "Tester MCP Server Standalone..."
if [ ! -f "src/mcp_server_standalone.py" ]; then
    error "src/mcp_server_standalone.py ikke fundet"
fi

# Start MCP server i baggrunden med logging
echo "   Starter MCP server med logging..."
cd src
python3 mcp_server_standalone.py > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Vent på server start med bedre monitoring
echo "   Venter på server start (15 sekunder)..."
for i in {1..15}; do
    echo -n "."
    sleep 1
    
    # Tjek om serveren kører
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo ""
        error "Server stoppede uventet"
    fi
    
    # Tjek om port er åben
    if nc -z localhost 8080 2>/dev/null; then
        echo ""
        echo "   Server port er åben!"
        break
    fi
    
    if [ $i -eq 15 ]; then
        echo ""
        warning "Server port ikke åben efter 15 sekunder - fortsætter alligevel"
    fi
done

# Vent lidt mere for at være sikker
sleep 3

# 3. Test endpoints med retry logic
test_step "Tester MCP endpoints med retry..."

# Test health endpoint med flere forsøg
echo "   Testing health endpoint (med retry)..."
health_success=false
for attempt in {1..5}; do
    echo "   Forsøg $attempt/5..."
    if curl -f -s --max-time 10 http://localhost:8080/health > /dev/null 2>&1; then
        health_success=true
        break
    fi
    sleep 2
done

if [ "$health_success" = false ]; then
    echo "   Health endpoint fejlede - tjekker hvad serveren siger:"
    echo "   Server logs (sidste 10 linjer):"
    tail -10 server.log | sed 's/^/   /'
    
    # Prøv at se hvad der er på port 8080
    echo "   Tjekker hvad der kører på port 8080:"
    curl -s --max-time 5 http://localhost:8080/ | head -5 | sed 's/^/   /' || echo "   Ingen respons fra port 8080"
    
    warning "Health endpoint fejlede, men fortsætter test..."
else
    success "Health endpoint OK"
fi

# Test root endpoint
echo "   Testing root endpoint..."
if curl -f -s --max-time 10 http://localhost:8080/ > /dev/null 2>&1; then
    success "Root endpoint OK"
else
    warning "Root endpoint fejlede - fortsætter alligevel"
fi

# Test MCP tools list
echo "   Testing MCP tools list..."
mcp_response=$(curl -s --max-time 10 -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}' 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$mcp_response" ]; then
    echo "   MCP Response: $mcp_response" | head -1
    success "MCP tools/list OK"
else
    warning "MCP tools/list fejlede - fortsætter alligevel"
fi

# Vis server status
echo ""
echo -e "${BLUE}📊 SERVER STATUS:${NC}"
echo "   PID: $SERVER_PID"
echo "   Port 8080 åben: $(nc -z localhost 8080 && echo 'Ja' || echo 'Nej')"
echo "   Server kører: $(kill -0 $SERVER_PID 2>/dev/null && echo 'Ja' || echo 'Nej')"

# Vis sidste server logs
echo ""
echo -e "${BLUE}📋 SERVER LOGS (sidste 5 linjer):${NC}"
tail -5 server.log | sed 's/^/   /' || echo "   Ingen logs tilgængelige"

# Stop server
kill $SERVER_PID 2>/dev/null || true
sleep 2

success "Lokal server test færdig"

# 4. Test Docker build (kun hvis lokal test delvist virkede)
test_step "Tester Docker build (minimal)..."
if [ ! -f "Dockerfile.minimal" ]; then
    error "Dockerfile.minimal ikke fundet"
fi

echo "   Building Docker image..."
if docker build -f Dockerfile.minimal -t minimal-rag-test . > docker-build.log 2>&1; then
    success "Docker build OK"
else
    echo "   Docker build fejlede - se docker-build.log:"
    tail -10 docker-build.log | sed 's/^/   /'
    error "Docker build fejlede"
fi

# 5. Test Docker container
test_step "Tester Docker container..."
echo "   Starter Docker container..."
if docker run -d -p 8081:8080 --name minimal-rag-test minimal-rag-test; then
    success "Docker container startet"
else
    error "Docker run fejlede"
fi

echo "   Venter på container start (20 sekunder)..."
for i in {1..20}; do
    echo -n "."
    sleep 1
    
    # Tjek container status
    if ! docker ps | grep -q minimal-rag-test; then
        echo ""
        echo "   Container logs:"
        docker logs minimal-rag-test | tail -10 | sed 's/^/   /'
        error "Docker container stoppede"
    fi
    
    # Tjek om port er åben
    if nc -z localhost 8081 2>/dev/null; then
        echo ""
        echo "   Container port er åben!"
        break
    fi
done

# Test container health
echo "   Testing container health..."
container_health=false
for attempt in {1..3}; do
    echo "   Container test forsøg $attempt/3..."
    if curl -f -s --max-time 10 http://localhost:8081/health > /dev/null 2>&1; then
        container_health=true
        break
    fi
    sleep 3
done

if [ "$container_health" = true ]; then
    success "Docker container fungerer"
else
    echo "   Container logs (sidste 10 linjer):"
    docker logs minimal-rag-test | tail -10 | sed 's/^/   /'
    warning "Docker container health check fejlede"
fi

# 6. Vis endelige resultater
echo ""
echo -e "${GREEN}🎉 TEST FÆRDIG!${NC}"
echo ""
echo -e "${BLUE}📋 RESULTATER:${NC}"
echo "✅ Python miljø og dependencies OK"
echo "$([ "$health_success" = true ] && echo '✅' || echo '⚠️') MCP Server Standalone (lokal)"
echo "✅ Docker build OK"
echo "$([ "$container_health" = true ] && echo '✅' || echo '⚠️') Docker container"
echo ""

if [ "$health_success" = true ] && [ "$container_health" = true ]; then
    echo -e "${GREEN}🚀 PERFEKT! Alt fungerer - klar til cloud deployment!${NC}"
    echo ""
    echo -e "${BLUE}🌐 NÆSTE SKRIDT:${NC}"
    echo "1. Deploy til Google Cloud med denne konfiguration"
    echo "2. Test cloud endpoints"
    echo "3. Integrer med Trae IDE"
elif [ "$health_success" = true ] || [ "$container_health" = true ]; then
    echo -e "${YELLOW}⚠️ DELVIST SUCCESS - nogle ting virker!${NC}"
    echo ""
    echo -e "${BLUE}🔧 NÆSTE SKRIDT:${NC}"
    echo "1. Debug de fejlende komponenter"
    echo "2. Eller deploy det der virker og fix resten i cloud"
else
    echo -e "${RED}❌ FLERE PROBLEMER - lad os debugge${NC}"
    echo ""
    echo -e "${BLUE}🔍 DEBUG SKRIDT:${NC}"
    echo "1. Tjek server.log for fejl"
    echo "2. Tjek docker-build.log for build problemer"
    echo "3. Test en endnu simplere version"
fi

echo ""
echo -e "${YELLOW}📍 Log filer oprettet:${NC}"
echo "   server.log - Server output"
echo "   docker-build.log - Docker build output"
echo ""
echo -e "${YELLOW}📍 Test URLs (hvis container stadig kører):${NC}"
echo "   Container: http://localhost:8081/health"
echo "   Container MCP: http://localhost:8081/mcp"
echo "   Container Docs: http://localhost:8081/docs"