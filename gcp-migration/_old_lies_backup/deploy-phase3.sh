#!/bin/bash

# Phase 3 Deployment Script for Full RAG Implementation
# Deploys enhanced Code Assistant with Ollama + ChromaDB to Google Cloud Run

set -e

echo "🚀 Starting Phase 3 deployment - Full RAG Implementation"

# Configuration
PROJECT_ID="code-assistant-rag"
SERVICE_NAME="code-assistant-rag"
REGION="europe-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:phase3-$(date +%Y%m%d-%H%M%S)"
LATEST_IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:phase3-latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker."
    exit 1
fi

# Authenticate and set project
print_status "Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Configure Docker for GCR
print_status "Configuring Docker for Google Container Registry..."
gcloud auth configure-docker

# Build Docker image for Phase 3
print_status "Building Phase 3 Docker image..."
docker buildx build --platform linux/amd64 \
    -f Dockerfile.phase3 \
    -t $IMAGE_NAME \
    -t $LATEST_IMAGE \
    . --push

if [ $? -eq 0 ]; then
    print_success "Docker image built and pushed successfully"
else
    print_error "Docker build failed"
    exit 1
fi

# Deploy to Cloud Run with enhanced configuration
print_status "Deploying to Google Cloud Run with Phase 3 configuration..."

gcloud run deploy $SERVICE_NAME \
    --image $LATEST_IMAGE \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 8Gi \
    --cpu 4 \
    --timeout 3600 \
    --concurrency 10 \
    --max-instances 3 \
    --min-instances 0 \
    --port 8080 \
    --set-env-vars "OLLAMA_HOST=0.0.0.0,OLLAMA_PORT=11434,CODE_ASSISTANT_PORT=8080,CHROMADB_HOST=0.0.0.0,CHROMADB_PORT=8000,OLLAMA_NUM_PARALLEL=2,OLLAMA_MAX_LOADED_MODELS=2" \
    --execution-environment gen2

if [ $? -eq 0 ]; then
    print_success "Phase 3 deployment completed successfully!"
else
    print_error "Deployment failed"
    exit 1
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

print_success "🎉 Phase 3 deployment completed!"
echo ""
echo "📍 Service Information:"
echo "  - Service URL: $SERVICE_URL"
echo "  - Health Check: $SERVICE_URL/health"
echo "  - API Documentation: $SERVICE_URL/docs"
echo "  - MCP Endpoint: $SERVICE_URL/mcp"
echo "  - Upload Endpoint: $SERVICE_URL/upload"
echo "  - Stats Endpoint: $SERVICE_URL/stats"
echo ""
echo "🔧 Configuration:"
echo "  - Memory: 8GB"
echo "  - CPU: 4 cores"
echo "  - Max Instances: 3"
echo "  - Timeout: 60 minutes"
echo "  - Concurrency: 10"
echo ""
echo "🧪 Test Commands:"
echo ""
echo "# Health Check"
echo "curl $SERVICE_URL/health"
echo ""
echo "# Test MCP Tools List"
echo "curl -X POST $SERVICE_URL/mcp \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"method\": \"tools/list\"}'"
echo ""
echo "# Test Code Analysis"
echo "curl -X POST $SERVICE_URL/mcp \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"method\": \"tools/call\", \"params\": {\"name\": \"analyze_code\", \"arguments\": {\"code\": \"def hello(): print(\\\"world\\\")\", \"language\": \"python\"}}}'"
echo ""
echo "# Test Codebase Search"
echo "curl -X POST $SERVICE_URL/mcp \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"method\": \"tools/call\", \"params\": {\"name\": \"search_codebase\", \"arguments\": {\"query\": \"fibonacci algorithm\"}}}'"
echo ""
echo "# Upload a file"
echo "curl -X POST $SERVICE_URL/upload \\"
echo "  -F 'file=@example.py' \\"
echo "  -F 'language=python'"
echo ""
echo "# Get system statistics"
echo "curl $SERVICE_URL/stats"
echo ""

# Wait for service to be ready
print_status "Waiting for service to be ready..."
sleep 30

# Test the deployment
print_status "Testing deployment..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/health)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "✅ Health check passed - service is ready!"
else
    print_warning "⚠️ Health check returned status: $HEALTH_RESPONSE"
    print_warning "Service may still be starting up. Check logs with:"
    echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit=20"
fi

# Show logs command
echo ""
print_status "📋 Useful commands:"
echo ""
echo "# View logs:"
echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit=20"
echo ""
echo "# Update service:"
echo "gcloud run services update $SERVICE_NAME --region=$REGION"
echo ""
echo "# Delete service:"
echo "gcloud run services delete $SERVICE_NAME --region=$REGION"
echo ""

print_success "🎉 Phase 3 deployment script completed!"
print_status "Your enhanced Code Assistant with full RAG capabilities is now running at: $SERVICE_URL"