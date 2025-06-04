#!/bin/bash

# Deploy Standalone MCP Server to Google Cloud Run
# Fixed version that deploys the working standalone server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="code-assistant-rag"
REGION="europe-west1"
SERVICE_NAME="code-assistant-rag"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo -e "${BLUE}🚀 Deploying Standalone MCP Server to Google Cloud${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI not found. Please install it first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker first."
    exit 1
fi

print_status "Prerequisites checked"

# Set active project
gcloud config set project $PROJECT_ID
print_status "Active project set to $PROJECT_ID"

# Configure Docker for GCR
echo -e "${BLUE}🐳 Configuring Docker...${NC}"
gcloud auth configure-docker --quiet
print_status "Docker configured for Google Container Registry"

# Build Docker image using standalone Dockerfile
echo -e "${BLUE}🔨 Building standalone Docker image...${NC}"
docker build -f Dockerfile.standalone -t $IMAGE_NAME:standalone .
print_status "Standalone Docker image built successfully"

# Push to Google Container Registry
echo -e "${BLUE}📤 Pushing image to Google Container Registry...${NC}"
docker push $IMAGE_NAME:standalone
print_status "Image pushed to GCR"

# Deploy to Cloud Run with minimal resources for standalone version
echo -e "${BLUE}🚀 Deploying standalone MCP server to Cloud Run...${NC}"

gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_NAME:standalone \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --max-instances=10 \
    --min-instances=0 \
    --timeout=300 \
    --port=8080 \
    --set-env-vars="CODE_ASSISTANT_PORT=8080" \
    --execution-environment=gen2

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
print_status "Service deployed to: $SERVICE_URL"

# Wait for service to be ready
echo -e "${BLUE}⏳ Waiting for service to be ready...${NC}"
sleep 30

# Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"

# Health check
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/health" || echo "")
if echo "$HEALTH_RESPONSE" | grep -q "healthy\|ok"; then
    print_status "Health check passed: $HEALTH_RESPONSE"
else
    print_warning "Health check response: $HEALTH_RESPONSE"
fi

# Test MCP tools/list endpoint
echo "Testing MCP tools/list endpoint..."
MCP_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/list"}' \
    "$SERVICE_URL/mcp" || echo "")

if echo "$MCP_RESPONSE" | grep -q "tools"; then
    print_status "MCP tools/list endpoint working!"
    echo "Response: $MCP_RESPONSE"
else
    print_error "MCP tools/list endpoint failed!"
    echo "Response: $MCP_RESPONSE"
fi

# Test MCP initialize endpoint
echo "Testing MCP initialize endpoint..."
INIT_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"method": "initialize", "params": {"protocolVersion": "2024-11-05"}}' \
    "$SERVICE_URL/mcp" || echo "")

if echo "$INIT_RESPONSE" | grep -q "protocolVersion"; then
    print_status "MCP initialize endpoint working!"
else
    print_warning "MCP initialize response: $INIT_RESPONSE"
fi

# Test a tool call (should work with fallback responses)
echo "Testing MCP tool call..."
TOOL_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/call", "params": {"name": "analyze_code", "arguments": {"code": "print(\"hello world\")"}}}' \
    "$SERVICE_URL/mcp" || echo "")

if echo "$TOOL_RESPONSE" | grep -q "content"; then
    print_status "MCP tool call working!"
else
    print_warning "MCP tool call response: $TOOL_RESPONSE"
fi

# Summary
echo
echo -e "${GREEN}🎉 Standalone MCP Server deployment completed!${NC}"
echo
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "URL: $SERVICE_URL"
echo "Configuration: Standalone (no Ollama/ChromaDB dependencies)"
echo
echo -e "${BLUE}💰 Cost Information:${NC}"
echo "Configuration: Minimal CPU/Memory"
echo "Estimated cost: ~20-50kr/month (very low usage)"
echo
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/health"
echo "MCP Endpoint: $SERVICE_URL/mcp"
echo "Cloud Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo
echo -e "${BLUE}🧪 Quick Test Commands:${NC}"
echo "Health: curl $SERVICE_URL/health"
echo "MCP Tools: curl -X POST -H 'Content-Type: application/json' -d '{\"method\": \"tools/list\"}' $SERVICE_URL/mcp"
echo
echo -e "${BLUE}⚙️ Trae IDE Configuration:${NC}"
echo "Add this to your Trae IDE MCP configuration:"
echo "{"
echo "  \"mcpServers\": {"
echo "    \"code-assistant-cloud\": {"
echo "      \"command\": \"curl\","
echo "      \"args\": ["
echo "        \"-X\", \"POST\","
echo "        \"-H\", \"Content-Type: application/json\","
echo "        \"-d\", \"@-\","
echo "        \"$SERVICE_URL/mcp\""
echo "      ]"
echo "    }"
echo "  }"
echo "}"

print_status "Your standalone MCP server is now running in the cloud!"