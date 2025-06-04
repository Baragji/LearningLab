#!/bin/bash

set -e  # Stop ved fejl

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GOOGLE CLOUD DEPLOYMENT${NC}"
echo "=========================="

# Deployment funktioner
deploy_step() {
    echo -e "${YELLOW}🔧 $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Konfiguration
PROJECT_ID="code-assistant-rag"
SERVICE_NAME="code-assistant-rag"
REGION="europe-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:v4-minimal"

echo "📍 Deployment konfiguration:"
echo "   Project ID: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Image: $IMAGE_NAME"
echo ""

# 1. Tjek forudsætninger
deploy_step "Tjekker forudsætninger..."

# Tjek gcloud
if ! command -v gcloud &> /dev/null; then
    error "gcloud CLI ikke fundet - installer Google Cloud SDK"
fi

# Tjek Docker
if ! command -v docker &> /dev/null; then
    error "Docker ikke fundet"
fi

# Tjek at vi er i det rigtige directory
if [ ! -f "Dockerfile.minimal" ]; then
    error "Dockerfile.minimal ikke fundet - kør fra gcp-migration directory"
fi

success "Forudsætninger OK"

# 2. Tjek Google Cloud authentication
deploy_step "Tjekker Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    warning "Ikke logget ind på Google Cloud"
    echo "   Kører: gcloud auth login"
    gcloud auth login
fi

# Tjek projekt
current_project=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$current_project" != "$PROJECT_ID" ]; then
    warning "Forkert projekt aktiv: $current_project"
    echo "   Skifter til projekt: $PROJECT_ID"
    gcloud config set project $PROJECT_ID
fi

success "Google Cloud authentication OK"

# 3. Enable nødvendige APIs
deploy_step "Aktiverer nødvendige Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
success "APIs aktiveret"

# 4. Build og push Docker image
deploy_step "Bygger og pusher Docker image..."
echo "   Building image for AMD64 platform..."

# Build med explicit platform for Cloud Run
docker buildx build --platform linux/amd64 \
    -f Dockerfile.minimal \
    -t $IMAGE_NAME \
    . --push

if [ $? -eq 0 ]; then
    success "Docker image bygget og pushed"
else
    error "Docker build/push fejlede"
fi

# 5. Deploy til Cloud Run
deploy_step "Deployer til Google Cloud Run..."

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
    success "Cloud Run deployment OK"
else
    error "Cloud Run deployment fejlede"
fi

# 6. Hent service URL
deploy_step "Henter service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

if [ -n "$SERVICE_URL" ]; then
    success "Service URL hentet: $SERVICE_URL"
else
    error "Kunne ikke hente service URL"
fi

# 7. Test deployment
deploy_step "Tester cloud deployment..."

echo "   Venter på service start (30 sekunder)..."
sleep 30

# Test health endpoint
echo "   Testing health endpoint..."
health_response=$(curl -s --max-time 30 "$SERVICE_URL/health" || echo "")
if [[ "$health_response" == *"healthy"* ]]; then
    success "Health endpoint OK"
else
    warning "Health endpoint fejlede - service starter måske stadig"
    echo "   Response: $health_response"
fi

# Test MCP endpoint
echo "   Testing MCP endpoint..."
mcp_response=$(curl -s --max-time 30 -X POST "$SERVICE_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/list"}' || echo "")

if [[ "$mcp_response" == *"tools"* ]]; then
    success "MCP endpoint OK"
else
    warning "MCP endpoint fejlede - tjek logs"
    echo "   Response: $mcp_response"
fi

# 8. Vis resultater
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT FÆRDIG!${NC}"
echo ""
echo -e "${BLUE}📋 DEPLOYMENT INFO:${NC}"
echo "   Service URL: $SERVICE_URL"
echo "   Health Check: $SERVICE_URL/health"
echo "   MCP Endpoint: $SERVICE_URL/mcp"
echo "   API Docs: $SERVICE_URL/docs"
echo ""
echo -e "${BLUE}🔧 NYTTIGE KOMMANDOER:${NC}"
echo "   Logs: gcloud run logs tail $SERVICE_NAME --region=$REGION"
echo "   Status: gcloud run services describe $SERVICE_NAME --region=$REGION"
echo "   Update: gcloud run services update $SERVICE_NAME --region=$REGION"
echo ""
echo -e "${BLUE}🧪 TEST KOMMANDOER:${NC}"
echo "   Health: curl $SERVICE_URL/health"
echo "   MCP Tools: curl -X POST $SERVICE_URL/mcp -H 'Content-Type: application/json' -d '{\"method\": \"tools/list\"}'"
echo ""

# 9. Test MCP integration
echo -e "${BLUE}📱 TRAE IDE INTEGRATION:${NC}"
echo "   MCP Server URL: $SERVICE_URL/mcp"
echo "   Protocol: HTTP POST"
echo "   Content-Type: application/json"
echo ""
echo -e "${YELLOW}📋 Gem disse URLs - du skal bruge dem til Trae IDE integration!${NC}"

# 10. Vis omkostninger
echo ""
echo -e "${BLUE}💰 OMKOSTNINGS ESTIMAT:${NC}"
echo "   Nuværende setup: ~10-25 DKK/måned"
echo "   Med dit 2000 DKK kredit: 6-16 måneder dækning"
echo "   Auto-scaling: 0-3 instanser efter behov"
echo ""
echo -e "${GREEN}🚀 Din RAG server kører nu i Google Cloud! 🎉${NC}"