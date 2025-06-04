#!/bin/bash

# MCP Server with RAG - Test Runner Script
# This script runs comprehensive tests for the MCP server

echo "🧪 MCP Server with RAG - Test Suite"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "test_e2e.py" ]; then
    echo "❌ Error: Please run this script from the gcp-migration directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: test_e2e.py"
    exit 1
fi

# Check if server is running
echo "🔍 Checking if MCP server is running..."
curl -s http://localhost:8080/health >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Error: MCP server is not running on port 8080"
    echo ""
    echo "🚀 To start the server, run:"
    echo "   ./start_server.sh"
    echo ""
    echo "   Or manually:"
    echo "   cd src && python3 mcp_server_with_rag.py"
    exit 1
fi

echo "✅ MCP server is running"
echo ""

# Run health check first
echo "🏥 Running health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:8080/health)
echo "Response: $HEALTH_RESPONSE"

# Check if RAG engine is ready
echo "$HEALTH_RESPONSE" | grep -q '"rag_engine":true'
if [ $? -eq 0 ]; then
    echo "✅ RAG engine is ready"
else
    echo "⚠️  Warning: RAG engine may not be ready"
    echo "   This might cause some tests to fail"
fi

echo ""
echo "🧪 Running complete E2E test suite..."
echo "===================================="

# Run the E2E tests
python3 test_e2e.py
TEST_RESULT=$?

echo ""
echo "===================================="

if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ MCP Server with RAG is fully operational"
    echo ""
    echo "📊 Quick Stats:"
    curl -s http://localhost:8080/mcp -X POST \
        -H "Content-Type: application/json" \
        -d '{"method": "resources/read", "params": {"uri": "rag://stats"}}' | \
        python3 -c "import sys, json; data=json.load(sys.stdin); print(json.loads(data['contents'][0]['text']))" 2>/dev/null || echo "Stats not available"
else
    echo "💥 SOME TESTS FAILED!"
    echo "❌ Please check the test output above for details"
    echo ""
    echo "🔧 Common issues:"
    echo "   - OpenAI API key not set or invalid"
    echo "   - Network connectivity issues"
    echo "   - Server not fully initialized (wait a few seconds and retry)"
fi

echo ""
echo "📋 Manual test commands:"
echo "   Health: curl http://localhost:8080/health"
echo "   Tools:  curl -X POST http://localhost:8080/mcp -H 'Content-Type: application/json' -d '{\"method\": \"tools/list\"}'"
echo "   Docs:   Open http://localhost:8080/docs in browser"

exit $TEST_RESULT