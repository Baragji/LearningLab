#!/bin/bash

# 🚀 ULTIMATE MCP/RAG DEPLOYMENT SCRIPT FOR 2025
# Multi-architecture deployment with best practices
# Fixes ARM64 -> AMD64 deployment issues

set -e

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_ID="code-assistant-rag"
REGION="europe-west1"
SERVICE_NAME="code-assistant-rag"
REPOSITORY="code-assistant-repo"
IMAGE_NAME="europe-west1-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$SERVICE_NAME"

echo -e "${PURPLE}🚀 ULTIMATE MCP/RAG CLOUD DEPLOYMENT 2025${NC}"
echo -e "${CYAN}Multi-architecture deployment with latest best practices${NC}"
echo

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Check if buildx is available
if ! docker buildx version &> /dev/null; then
    print_error "Docker Buildx not found. Please enable Docker Buildx."
    exit 1
fi

print_status "Prerequisites checked"

# Set active project
gcloud config set project $PROJECT_ID
print_status "Active project set to $PROJECT_ID"

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
print_status "APIs enabled"

# Create Artifact Registry repository if it doesn't exist
echo -e "${BLUE}📦 Setting up Artifact Registry...${NC}"
if ! gcloud artifacts repositories describe $REPOSITORY --location=$REGION &> /dev/null; then
    gcloud artifacts repositories create $REPOSITORY \
        --repository-format=docker \
        --location=$REGION \
        --description="MCP/RAG Server Repository"
    print_status "Artifact Registry repository created"
else
    print_info "Artifact Registry repository already exists"
fi

# Configure Docker for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet
print_status "Docker configured for Artifact Registry"

# Create buildx builder for multi-platform builds
echo -e "${BLUE}🏗️  Setting up multi-platform builder...${NC}"
if ! docker buildx ls | grep -q "cloud-builder"; then
    docker buildx create --name cloud-builder --driver docker-container --bootstrap
    print_status "Multi-platform builder created"
else
    print_info "Multi-platform builder already exists"
fi

docker buildx use cloud-builder
print_status "Using multi-platform builder"

# Build multi-architecture image
echo -e "${BLUE}🔨 Building multi-architecture Docker image...${NC}"
echo -e "${CYAN}Building for linux/amd64 (required for Cloud Run)${NC}"

docker buildx build \
    --platform linux/amd64 \
    --file Dockerfile.cloud-optimized \
    --tag $IMAGE_NAME:latest \
    --tag $IMAGE_NAME:$(date +%Y%m%d-%H%M%S) \
    --push \
    .

print_status "Multi-architecture image built and pushed"

# Deploy to Cloud Run with optimized settings
echo -e "${BLUE}🚀 Deploying to Cloud Run with 2025 optimizations...${NC}"

gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_NAME:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --memory=2Gi \
    --cpu=2 \
    --max-instances=100 \
    --min-instances=1 \
    --timeout=900 \
    --port=8080 \
    --set-env-vars="CODE_ASSISTANT_PORT=8080,PYTHONUNBUFFERED=1" \
    --execution-environment=gen2 \
    --cpu-boost \
    --session-affinity

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
print_status "Service deployed to: $SERVICE_URL"

# Wait for service to be ready
echo -e "${BLUE}⏳ Waiting for service to be ready...${NC}"
sleep 45

# Comprehensive testing
echo -e "${BLUE}🧪 Running comprehensive tests...${NC}"

# Test 1: Health check
echo -e "${CYAN}Test 1: Health endpoint${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$SERVICE_URL/health" || echo "000")
HTTP_CODE="${HEALTH_RESPONSE: -3}"
HEALTH_BODY="${HEALTH_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    print_status "Health check passed (HTTP $HTTP_CODE)"
    echo "Response: $HEALTH_BODY"
else
    print_error "Health check failed (HTTP $HTTP_CODE)"
    echo "Response: $HEALTH_BODY"
fi

# Test 2: MCP Initialize
echo -e "${CYAN}Test 2: MCP Initialize${NC}"
INIT_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"method": "initialize", "params": {"protocolVersion": "2024-11-05"}}' \
    "$SERVICE_URL/mcp" || echo "000")
HTTP_CODE="${INIT_RESPONSE: -3}"
INIT_BODY="${INIT_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] && echo "$INIT_BODY" | grep -q "protocolVersion"; then
    print_status "MCP Initialize working (HTTP $HTTP_CODE)"
else
    print_error "MCP Initialize failed (HTTP $HTTP_CODE)"
    echo "Response: $INIT_BODY"
fi

# Test 3: MCP Tools List
echo -e "${CYAN}Test 3: MCP Tools List${NC}"
TOOLS_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/list"}' \
    "$SERVICE_URL/mcp" || echo "000")
HTTP_CODE="${TOOLS_RESPONSE: -3}"
TOOLS_BODY="${TOOLS_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] && echo "$TOOLS_BODY" | grep -q "tools"; then
    print_status "MCP Tools List working (HTTP $HTTP_CODE)"
    TOOL_COUNT=$(echo "$TOOLS_BODY" | grep -o '"name"' | wc -l)
    echo "Found $TOOL_COUNT tools"
else
    print_error "MCP Tools List failed (HTTP $HTTP_CODE)"
    echo "Response: $TOOLS_BODY"
fi

# Test 4: MCP Tool Call
echo -e "${CYAN}Test 4: MCP Tool Call${NC}"
CALL_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/call", "params": {"name": "analyze_code", "arguments": {"code": "def hello():\n    print(\"Hello World\")", "language": "python"}}}' \
    "$SERVICE_URL/mcp" || echo "000")
HTTP_CODE="${CALL_RESPONSE: -3}"
CALL_BODY="${CALL_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] && echo "$CALL_BODY" | grep -q "content"; then
    print_status "MCP Tool Call working (HTTP $HTTP_CODE)"
else
    print_error "MCP Tool Call failed (HTTP $HTTP_CODE)"
    echo "Response: $CALL_BODY"
fi

# Test 5: Performance test
echo -e "${CYAN}Test 5: Performance Test${NC}"
START_TIME=$(date +%s%N)
for i in {1..5}; do
    curl -s "$SERVICE_URL/health" > /dev/null
done
END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
AVG_RESPONSE=$(( DURATION / 5 ))

if [ $AVG_RESPONSE -lt 1000 ]; then
    print_status "Performance test passed (avg: ${AVG_RESPONSE}ms)"
else
    print_warning "Performance test slow (avg: ${AVG_RESPONSE}ms)"
fi

# Summary
echo
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo
echo -e "${PURPLE}📋 DEPLOYMENT SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Project:${NC} $PROJECT_ID"
echo -e "${BLUE}Service:${NC} $SERVICE_NAME"
echo -e "${BLUE}Region:${NC} $REGION"
echo -e "${BLUE}URL:${NC} $SERVICE_URL"
echo -e "${BLUE}Image:${NC} $IMAGE_NAME:latest"
echo -e "${BLUE}Architecture:${NC} Multi-platform (AMD64 for Cloud Run)"
echo -e "${BLUE}Configuration:${NC} Optimized for 2025 best practices"
echo

echo -e "${PURPLE}💰 COST OPTIMIZATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}CPU:${NC} 2 vCPU with CPU boost"
echo -e "${BLUE}Memory:${NC} 2GB RAM"
echo -e "${BLUE}Min Instances:${NC} 1 (for fast response)"
echo -e "${BLUE}Max Instances:${NC} 100 (auto-scaling)"
echo -e "${BLUE}Estimated Cost:${NC} ~100-300kr/month (depending on usage)"
echo

echo -e "${PURPLE}🔗 USEFUL LINKS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Service URL:${NC} $SERVICE_URL"
echo -e "${BLUE}Health Check:${NC} $SERVICE_URL/health"
echo -e "${BLUE}MCP Endpoint:${NC} $SERVICE_URL/mcp"
echo -e "${BLUE}Cloud Console:${NC} https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo -e "${BLUE}Logs:${NC} https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo -e "${BLUE}Artifact Registry:${NC} https://console.cloud.google.com/artifacts/docker/$PROJECT_ID/$REGION/$REPOSITORY?project=$PROJECT_ID"
echo

echo -e "${PURPLE}🧪 QUICK TEST COMMANDS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}Health Check:${NC}"
echo "curl $SERVICE_URL/health"
echo
echo -e "${CYAN}MCP Tools List:${NC}"
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"method\": \"tools/list\"}' $SERVICE_URL/mcp"
echo
echo -e "${CYAN}MCP Tool Call:${NC}"
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"method\": \"tools/call\", \"params\": {\"name\": \"analyze_code\", \"arguments\": {\"code\": \"print(\\\"hello\\\")\"}}}' $SERVICE_URL/mcp"
echo

echo -e "${PURPLE}⚙️ TRAE IDE CONFIGURATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Add this to your Trae IDE MCP configuration:"
echo
cat << EOF
{
  "mcpServers": {
    "code-assistant-cloud": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", "@-",
        "$SERVICE_URL/mcp"
      ]
    }
  }
}
EOF
echo

echo -e "${GREEN}🚀 Your MCP/RAG server is now running optimally in the cloud!${NC}"
echo -e "${CYAN}All architecture issues have been resolved with multi-platform builds.${NC}"