#!/bin/bash

set -e

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 HURTIG RE-DEPLOYMENT${NC}"
echo "======================="

# Konfiguration
PROJECT_ID="code-assistant-rag"
SERVICE_NAME="code-assistant-rag"
REGION="europe-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:v5-fixed"

info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# 1. Verificer at vi har de rigtige filer
info "Verificerer filer..."
if [ ! -f "Dockerfile.minimal" ]; then
    error "Dockerfile.minimal ikke fundet"
fi

if [ ! -f "src/mcp_server_standalone.py" ]; then
    error "src/mcp_server_standalone.py ikke fundet"
fi

success "Nødvendige filer fundet"

# 2. Tjek at MCP server har korrekt endpoint
info "Tjekker MCP server konfiguration..."
if grep -q "/mcp" src/mcp_server_standalone.py; then
    success "MCP endpoint fundet i kode"
else
    error "MCP endpoint ikke fundet i src/mcp_server_standalone.py"
fi

# 3. Build og push ny image
info "Bygger ny Docker image..."
docker buildx build --platform linux/amd64 \
    -f Dockerfile.minimal \
    -t $IMAGE_NAME \
    . --push

if [ $? -eq 0 ]; then
    success "Docker image bygget og pushed"
else
    error "Docker build/push fejlede"
fi

# 4. Deploy til Cloud Run
info "Re-deployer til Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --max-instances 3 \
    --port 8080 \
    --set-env-vars="ENVIRONMENT=production" \
    --timeout=300 \
    --quiet

if [ $? -eq 0 ]; then
    success "Re-deployment OK"
else
    error "Re-deployment fejlede"
fi

# 5. Vent og test
info "Venter på service start..."
sleep 30

# 6. Test endpoints
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

info "Tester endpoints..."
echo "Service URL: $SERVICE_URL"

echo ""
echo "🔍 Testing health endpoint:"
curl -s "$SERVICE_URL/health" || echo "Health fejlede"

echo ""
echo "🔍 Testing MCP endpoint:"
curl -s -X POST "$SERVICE_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/list"}' || echo "MCP fejlede"

echo ""
echo -e "${GREEN}🎉 RE-DEPLOYMENT FÆRDIG!${NC}"
echo ""
echo -e "${BLUE}📋 TEST URLS:${NC}"
echo "Health: $SERVICE_URL/health"
echo "MCP: $SERVICE_URL/mcp"
echo "Docs: $SERVICE_URL/docs"

echo ""
echo -e "${YELLOW}🧪 TEST KOMMANDOER:${NC}"
echo "curl '$SERVICE_URL/health'"
echo "curl -X POST '$SERVICE_URL/mcp' -H 'Content-Type: application/json' -d '{\"method\": \"tools/list\"}'"