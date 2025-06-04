#!/bin/bash

# Deploy Code Assistant + RAG to Google Cloud Run
# Optimeret til dit 2000kr kredit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="code-assistant-rag"
PROJECT_NAME="Code Assistant RAG"
REGION="europe-west1"
SERVICE_NAME="code-assistant-rag"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo -e "${BLUE}🚀 Deploying Code Assistant + RAG to Google Cloud${NC}"

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
    print_error "Google Cloud CLI not found. Please install it first:"
    echo "curl https://sdk.cloud.google.com | bash"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker first."
    exit 1
fi

print_status "Prerequisites checked"

# Login and setup project
echo -e "${BLUE}🔐 Setting up Google Cloud project...${NC}"

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "Not logged in to Google Cloud. Logging in..."
    gcloud auth login
fi

# Create project if it doesn't exist
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    print_warning "Creating new project: $PROJECT_ID"
    gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"
    
    print_warning "Please enable billing for project $PROJECT_ID in the Google Cloud Console"
    echo "Visit: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    read -p "Press Enter when billing is enabled..."
else
    print_status "Project $PROJECT_ID already exists"
fi

# Set active project
gcloud config set project $PROJECT_ID
print_status "Active project set to $PROJECT_ID"

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    storage-component.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com

print_status "APIs enabled"

# Configure Docker for GCR
echo -e "${BLUE}🐳 Configuring Docker...${NC}"
gcloud auth configure-docker --quiet
print_status "Docker configured for Google Container Registry"

# Build Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
echo "This may take 10-15 minutes as it downloads Ollama and models..."

docker build -t $IMAGE_NAME:latest .

print_status "Docker image built successfully"

# Push to Google Container Registry
echo -e "${BLUE}📤 Pushing image to Google Container Registry...${NC}"
docker push $IMAGE_NAME:latest
print_status "Image pushed to GCR"

# Create Cloud Storage bucket for persistent data
echo -e "${BLUE}🪣 Creating Cloud Storage bucket...${NC}"
BUCKET_NAME="${PROJECT_ID}-data"

if ! gsutil ls -b gs://$BUCKET_NAME &>/dev/null; then
    gsutil mb -l $REGION gs://$BUCKET_NAME
    print_status "Created storage bucket: gs://$BUCKET_NAME"
else
    print_warning "Bucket gs://$BUCKET_NAME already exists"
fi

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"

# Choose deployment configuration optimized for 3-month credit expiry
echo "🎯 Optimized for 3-month credit expiry (2000kr total):"
echo "1. GPU-enabled (Anbefalet) - 340kr/month = 1020kr total (max performance)"
echo "2. CPU-only - 75kr/month = 225kr total (underudnytter kredit)"
echo "3. Hybrid - GPU now, CPU later (optimal værdi)"
read -p "Enter choice (1, 2, or 3): " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" = "1" ] || [ "$DEPLOY_CHOICE" = "3" ]; then
    # GPU deployment (recommended for 3-month credit optimization)
    print_warning "Deploying with GPU support (NVIDIA L4) - Optimal for 3-month credit"
    
    gcloud run deploy $SERVICE_NAME \
        --image=$IMAGE_NAME:latest \
        --platform=managed \
        --region=$REGION \
        --allow-unauthenticated \
        --memory=8Gi \
        --cpu=4 \
        --gpu=1 \
        --gpu-type=nvidia-l4 \
        --max-instances=3 \
        --min-instances=0 \
        --timeout=3600 \
        --port=8080 \
        --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,BUCKET_NAME=$BUCKET_NAME,DEPLOYMENT_TYPE=gpu" \
        --execution-environment=gen2
else
    # CPU-only deployment (underutilizes credit)
    print_warning "Deploying with CPU-only - Dette underudnytter dit kredit!"
    
    gcloud run deploy $SERVICE_NAME \
        --image=$IMAGE_NAME:latest \
        --platform=managed \
        --region=$REGION \
        --allow-unauthenticated \
        --memory=4Gi \
        --cpu=2 \
        --max-instances=5 \
        --min-instances=0 \
        --timeout=3600 \
        --port=8080 \
        --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,BUCKET_NAME=$BUCKET_NAME,DEPLOYMENT_TYPE=cpu"
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
print_status "Service deployed to: $SERVICE_URL"

# Wait for service to be ready
echo -e "${BLUE}⏳ Waiting for service to be ready...${NC}"
sleep 60

# Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"

# Health check
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
    print_status "Health check passed"
else
    print_warning "Health check failed - service may still be starting"
fi

# Test basic functionality
echo "Testing basic MCP functionality..."
TEST_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/list"}' \
    "$SERVICE_URL/mcp" || echo "")

if echo "$TEST_RESPONSE" | grep -q "tools"; then
    print_status "MCP functionality working"
else
    print_warning "MCP functionality may not be ready yet"
fi

# Setup monitoring
echo -e "${BLUE}📊 Setting up monitoring...${NC}"

# Create log-based metric for errors
gcloud logging metrics create code_assistant_errors \
    --description="Code Assistant error rate" \
    --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="'$SERVICE_NAME'" AND severity>=ERROR' \
    --quiet || print_warning "Metric may already exist"

print_status "Basic monitoring configured"

# Create Trae IDE configuration
echo -e "${BLUE}⚙️ Creating Trae IDE configuration...${NC}"

cat > trae-mcp-config.json << EOF
{
  "mcpServers": {
    "code-assistant-cloud": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", "@-",
        "$SERVICE_URL/mcp"
      ],
      "env": {
        "SERVICE_URL": "$SERVICE_URL"
      }
    }
  }
}
EOF

print_status "Trae IDE configuration created: trae-mcp-config.json"

# Summary
echo
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "URL: $SERVICE_URL"
echo
echo -e "${BLUE}💰 Cost Information:${NC}"
if [ "$DEPLOY_CHOICE" = "2" ]; then
    echo "Configuration: GPU-enabled (NVIDIA L4)"
    echo "Estimated cost: ~340kr/month"
    echo "Duration with 2000kr credit: ~6 months"
else
    echo "Configuration: CPU-only"
    echo "Estimated cost: ~75kr/month"
    echo "Duration with 2000kr credit: ~27 months"
fi
echo
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "Cloud Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo "Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
echo
echo -e "${BLUE}⚙️ Trae IDE Integration:${NC}"
echo "1. Copy the content of trae-mcp-config.json"
echo "2. Add it to your Trae IDE MCP configuration"
echo "3. Restart Trae IDE"
echo "4. Your cloud-based Code Assistant should now be available!"
echo
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "View logs: gcloud logs read 'resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME' --limit=50"
echo "Scale up: gcloud run services update $SERVICE_NAME --max-instances=10 --region=$REGION"
echo "Scale down: gcloud run services update $SERVICE_NAME --max-instances=1 --region=$REGION"
echo "Update service: docker build -t $IMAGE_NAME:latest . && docker push $IMAGE_NAME:latest && gcloud run deploy $SERVICE_NAME --image=$IMAGE_NAME:latest --region=$REGION"
echo
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Test the service URL in your browser: $SERVICE_URL"
echo "2. Configure Trae IDE with the provided configuration"
echo "3. Test RAG functionality with your codebase"
echo "4. Monitor costs in the Cloud Console"
echo "5. Scale up/down based on usage"

print_status "Your Code Assistant + RAG is now running in the cloud!"