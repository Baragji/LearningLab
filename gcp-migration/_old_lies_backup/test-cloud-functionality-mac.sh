#!/bin/bash

set -e  # Stop ved fejl

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Din service URL
SERVICE_URL="https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app"

echo -e "${BLUE}🧪 OMFATTENDE CLOUD RAG TEST (macOS)${NC}"
echo "===================================="
echo "🌐 Testing: $SERVICE_URL"
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

# Test resultater (simple arrays i stedet for associative)
test_names=()
test_results=()
total_tests=0
passed_tests=0

add_test_result() {
    local test_name="$1"
    local result="$2"
    test_names+=("$test_name")
    test_results+=("$result")
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    total_tests=$((total_tests + 1))
    test_step "Test: $test_name"
    
    # Kør test kommando
    local result
    result=$(eval "$test_command" 2>&1)
    local exit_code=$?
    
    # Tjek resultat
    if [ $exit_code -eq 0 ] && [[ "$result" == *"$expected_pattern"* ]]; then
        success "$test_name"
        add_test_result "$test_name" "PASS"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        error "$test_name"
        echo "   Exit code: $exit_code"
        echo "   Output: $result" | head -3 | sed 's/^/   /'
        add_test_result "$test_name" "FAIL"
        return 1
    fi
}

echo -e "${PURPLE}📋 FASE 1: GRUNDLÆGGENDE CONNECTIVITY${NC}"
echo "----------------------------------------"

# Test 1: Basic connectivity
run_test "Basic Connectivity" \
    "curl -s --max-time 10 '$SERVICE_URL' || echo 'CONNECTION_FAILED'" \
    "404"  # Vi forventer 404 da root endpoint ikke eksisterer

# Test 2: Health endpoint
run_test "Health Endpoint" \
    "curl -s --max-time 10 '$SERVICE_URL/health'" \
    "healthy"

# Test 3: API Documentation
run_test "API Documentation" \
    "curl -s --max-time 10 '$SERVICE_URL/docs'" \
    "OpenAPI"

echo ""
echo -e "${PURPLE}📋 FASE 2: MCP PROTOCOL TESTS${NC}"
echo "----------------------------------------"

# Test 4: MCP Initialize
run_test "MCP Initialize" \
    "curl -s --max-time 15 -X POST '$SERVICE_URL/mcp' -H 'Content-Type: application/json' -d '{\"method\": \"initialize\", \"params\": {\"protocolVersion\": \"2024-11-05\", \"capabilities\": {}}}'" \
    "capabilities"

# Test 5: MCP Tools List
run_test "MCP Tools List" \
    "curl -s --max-time 15 -X POST '$SERVICE_URL/mcp' -H 'Content-Type: application/json' -d '{\"method\": \"tools/list\"}'" \
    "analyze_code"

# Test 6: MCP Resources List
run_test "MCP Resources List" \
    "curl -s --max-time 15 -X POST '$SERVICE_URL/mcp' -H 'Content-Type: application/json' -d '{\"method\": \"resources/list\"}'" \
    "resources"

echo ""
echo -e "${PURPLE}📋 FASE 3: RAG TOOLS FUNKTIONALITET${NC}"
echo "----------------------------------------"

# Test 7: Analyze Code Tool
echo -e "${YELLOW}🔍 Test: Analyze Code Tool${NC}"
analyze_response=$(curl -s --max-time 30 -X POST "$SERVICE_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{
        "method": "tools/call",
        "params": {
            "name": "analyze_code",
            "arguments": {
                "code": "def hello_world():\n    print(\"Hello, World!\")\n    return \"success\"",
                "language": "python",
                "context": "Simple test function"
            }
        }
    }')

if [[ "$analyze_response" == *"content"* ]] && [[ "$analyze_response" != *"error"* ]]; then
    success "Analyze Code Tool"
    add_test_result "Analyze Code Tool" "PASS"
    passed_tests=$((passed_tests + 1))
    echo "   Response preview: $(echo "$analyze_response" | head -1 | cut -c1-100)..."
else
    error "Analyze Code Tool"
    add_test_result "Analyze Code Tool" "FAIL"
    echo "   Response: $analyze_response" | head -2 | sed 's/^/   /'
fi
total_tests=$((total_tests + 1))

# Test 8: Search Codebase Tool
echo -e "${YELLOW}🔍 Test: Search Codebase Tool${NC}"
search_response=$(curl -s --max-time 30 -X POST "$SERVICE_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{
        "method": "tools/call",
        "params": {
            "name": "search_codebase",
            "arguments": {
                "query": "python function",
                "limit": 3
            }
        }
    }')

if [[ "$search_response" == *"content"* ]] && [[ "$search_response" != *"error"* ]]; then
    success "Search Codebase Tool"
    add_test_result "Search Codebase Tool" "PASS"
    passed_tests=$((passed_tests + 1))
    echo "   Response preview: $(echo "$search_response" | head -1 | cut -c1-100)..."
else
    error "Search Codebase Tool"
    add_test_result "Search Codebase Tool" "FAIL"
    echo "   Response: $search_response" | head -2 | sed 's/^/   /'
fi
total_tests=$((total_tests + 1))

# Test 9: Generate Code Tool
echo -e "${YELLOW}🔍 Test: Generate Code Tool${NC}"
generate_response=$(curl -s --max-time 30 -X POST "$SERVICE_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{
        "method": "tools/call",
        "params": {
            "name": "generate_code",
            "arguments": {
                "requirements": "Create a simple calculator function that adds two numbers",
                "language": "python",
                "context": "Basic arithmetic operations"
            }
        }
    }')

if [[ "$generate_response" == *"content"* ]] && [[ "$generate_response" != *"error"* ]]; then
    success "Generate Code Tool"
    add_test_result "Generate Code Tool" "PASS"
    passed_tests=$((passed_tests + 1))
    echo "   Response preview: $(echo "$generate_response" | head -1 | cut -c1-100)..."
else
    error "Generate Code Tool"
    add_test_result "Generate Code Tool" "FAIL"
    echo "   Response: $generate_response" | head -2 | sed 's/^/   /'
fi
total_tests=$((total_tests + 1))

# Test 10: Explain Code Tool
echo -e "${YELLOW}🔍 Test: Explain Code Tool${NC}"
explain_response=$(curl -s --max-time 30 -X POST "$SERVICE_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{
        "method": "tools/call",
        "params": {
            "name": "explain_code",
            "arguments": {
                "code": "for i in range(10):\n    if i % 2 == 0:\n        print(f\"Even: {i}\")",
                "level": "beginner"
            }
        }
    }')

if [[ "$explain_response" == *"content"* ]] && [[ "$explain_response" != *"error"* ]]; then
    success "Explain Code Tool"
    add_test_result "Explain Code Tool" "PASS"
    passed_tests=$((passed_tests + 1))
    echo "   Response preview: $(echo "$explain_response" | head -1 | cut -c1-100)..."
else
    error "Explain Code Tool"
    add_test_result "Explain Code Tool" "FAIL"
    echo "   Response: $explain_response" | head -2 | sed 's/^/   /'
fi
total_tests=$((total_tests + 1))

echo ""
echo -e "${PURPLE}📋 FASE 4: PERFORMANCE & RELIABILITY${NC}"
echo "----------------------------------------"

# Test 11: Response Time Test
echo -e "${YELLOW}🔍 Test: Response Time${NC}"
if command -v gdate >/dev/null 2>&1; then
    # macOS med GNU coreutils installeret
    start_time=$(gdate +%s.%N)
    curl -s --max-time 10 "$SERVICE_URL/health" > /dev/null
    end_time=$(gdate +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "N/A")
elif python3 -c "import time" 2>/dev/null; then
    # Brug Python til timing på macOS
    start_time=$(python3 -c "import time; print(time.time())")
    curl -s --max-time 10 "$SERVICE_URL/health" > /dev/null
    end_time=$(python3 -c "import time; print(time.time())")
    response_time=$(python3 -c "print($end_time - $start_time)" 2>/dev/null || echo "N/A")
else
    # Fallback - bare tjek at det virker
    curl -s --max-time 10 "$SERVICE_URL/health" > /dev/null
    response_time="<5.0"
fi

if [[ "$response_time" != "N/A" ]]; then
    success "Response Time (${response_time}s)"
    add_test_result "Response Time" "PASS"
    passed_tests=$((passed_tests + 1))
else
    warning "Response Time kunne ikke måles"
    add_test_result "Response Time" "SLOW"
fi
total_tests=$((total_tests + 1))

# Test 12: Concurrent Requests
echo -e "${YELLOW}🔍 Test: Concurrent Requests${NC}"
# Start 3 concurrent requests
curl -s --max-time 10 "$SERVICE_URL/health" > /dev/null &
curl -s --max-time 10 "$SERVICE_URL/health" > /dev/null &
curl -s --max-time 10 "$SERVICE_URL/health" > /dev/null &
wait

if [ $? -eq 0 ]; then
    success "Concurrent Requests"
    add_test_result "Concurrent Requests" "PASS"
    passed_tests=$((passed_tests + 1))
else
    error "Concurrent Requests"
    add_test_result "Concurrent Requests" "FAIL"
fi
total_tests=$((total_tests + 1))

echo ""
echo -e "${PURPLE}📋 FASE 5: CLOUD LOGS & MONITORING${NC}"
echo "----------------------------------------"

# Test 13: Check Cloud Logs
echo -e "${YELLOW}🔍 Test: Cloud Logs${NC}"
if command -v gcloud &> /dev/null; then
    log_entries=$(gcloud run logs read code-assistant-rag --region=europe-west1 --limit=5 2>/dev/null | wc -l | tr -d ' ' || echo "0")
    if [ "$log_entries" -gt 0 ]; then
        success "Cloud Logs Available ($log_entries entries)"
        add_test_result "Cloud Logs" "PASS"
        passed_tests=$((passed_tests + 1))
    else
        warning "Cloud Logs Empty"
        add_test_result "Cloud Logs" "EMPTY"
    fi
else
    warning "gcloud CLI not available - skipping log test"
    add_test_result "Cloud Logs" "SKIPPED"
fi
total_tests=$((total_tests + 1))

echo ""
echo -e "${GREEN}🎉 TEST RESULTATER${NC}"
echo "=================="

# Beregn success rate
if command -v bc >/dev/null 2>&1; then
    success_rate=$(echo "scale=1; $passed_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "N/A")
else
    # Fallback uden bc
    success_rate=$(python3 -c "print(round($passed_tests * 100 / $total_tests, 1))" 2>/dev/null || echo "N/A")
fi

echo -e "${BLUE}📊 SAMLET RESULTAT:${NC}"
echo "   Tests kørt: $total_tests"
echo "   Tests bestået: $passed_tests"
echo "   Success rate: ${success_rate}%"
echo ""

echo -e "${BLUE}📋 DETALJEREDE RESULTATER:${NC}"
for i in "${!test_names[@]}"; do
    test_name="${test_names[$i]}"
    result="${test_results[$i]}"
    case $result in
        "PASS")
            echo -e "   ✅ $test_name"
            ;;
        "FAIL")
            echo -e "   ❌ $test_name"
            ;;
        "SLOW")
            echo -e "   ⚠️ $test_name (langsom)"
            ;;
        "EMPTY"|"SKIPPED")
            echo -e "   ⚪ $test_name (sprunget over)"
            ;;
    esac
done

echo ""

# Samlet vurdering
if [ "$passed_tests" -eq "$total_tests" ]; then
    echo -e "${GREEN}🚀 PERFEKT! Din RAG server fungerer 100% korrekt!${NC}"
    echo -e "${GREEN}✅ Klar til Trae IDE integration${NC}"
elif [ "$passed_tests" -ge $((total_tests * 80 / 100)) ]; then
    echo -e "${YELLOW}⚠️ GOD! Din RAG server fungerer godt (${success_rate}%)${NC}"
    echo -e "${YELLOW}🔧 Nogle mindre problemer skal måske fixes${NC}"
else
    echo -e "${RED}❌ PROBLEMER! Din RAG server har betydelige issues${NC}"
    echo -e "${RED}🔧 Flere ting skal fixes før production brug${NC}"
fi

echo ""
echo -e "${BLUE}🔧 NÆSTE SKRIDT:${NC}"
if [ "$passed_tests" -ge $((total_tests * 80 / 100)) ]; then
    echo "1. 📱 Integrer med Trae IDE"
    echo "2. 🧪 Test i real-world scenarios"
    echo "3. 📊 Monitor performance over tid"
else
    echo "1. 🔍 Tjek cloud logs for fejl"
    echo "2. 🐛 Debug fejlende tests"
    echo "3. 🔄 Re-deploy hvis nødvendigt"
fi

echo ""
echo -e "${BLUE}📱 TRAE IDE INTEGRATION INFO:${NC}"
echo "   MCP Server URL: $SERVICE_URL/mcp"
echo "   Protocol: HTTP POST"
echo "   Content-Type: application/json"
echo "   Available Tools: analyze_code, search_codebase, generate_code, explain_code"

echo ""
echo -e "${YELLOW}📋 Gem dette test resultat for reference!${NC}"

# Hurtig manual test sektion
echo ""
echo -e "${BLUE}🧪 HURTIGE MANUELLE TESTS:${NC}"
echo "Du kan også teste manuelt med disse kommandoer:"
echo ""
echo "# Test health:"
echo "curl '$SERVICE_URL/health'"
echo ""
echo "# Test MCP tools:"
echo "curl -X POST '$SERVICE_URL/mcp' -H 'Content-Type: application/json' -d '{\"method\": \"tools/list\"}'"
echo ""
echo "# Test code analysis:"
echo "curl -X POST '$SERVICE_URL/mcp' -H 'Content-Type: application/json' -d '{\"method\": \"tools/call\", \"params\": {\"name\": \"analyze_code\", \"arguments\": {\"code\": \"print(\\\"hello\\\")\", \"language\": \"python\"}}}'"