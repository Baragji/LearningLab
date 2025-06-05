#!/bin/bash

# MCPEnterprise Deployment Script
# This script handles the complete deployment process for MCPEnterprise

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"
DOCKER_DIR="$PROJECT_ROOT"

# Default values
ENVIRONMENT="dev"
SKIP_TESTS=false
SKIP_BUILD=false
SKIP_TERRAFORM=false
VERBOSE=false
DRY_RUN=false

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat << EOF
MCPEnterprise Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Target environment (dev, staging, prod) [default: dev]
    -s, --skip-tests        Skip running tests
    -b, --skip-build        Skip building Docker image
    -t, --skip-terraform    Skip Terraform deployment
    -v, --verbose           Enable verbose output
    -d, --dry-run           Show what would be done without executing
    -h, --help              Show this help message

Examples:
    $0                                    # Deploy to dev environment
    $0 -e prod                           # Deploy to production
    $0 -e staging --skip-tests           # Deploy to staging without tests
    $0 --dry-run                         # Show deployment plan

Environment Variables:
    GCP_PROJECT_ID          GCP Project ID (required)
    GCP_REGION             GCP Region [default: europe-north1]
    OPENAI_API_KEY         OpenAI API Key (required)
    MCP_BEARER_TOKEN       MCP Bearer Token (required)

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("gcloud" "docker" "terraform" "python3" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' not found"
            exit 1
        fi
    done
    
    # Check required environment variables
    if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
        log_error "GCP_PROJECT_ID environment variable is required"
        exit 1
    fi
    
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
        log_error "OPENAI_API_KEY environment variable is required"
        exit 1
    fi
    
    if [[ -z "${MCP_BEARER_TOKEN:-}" ]]; then
        log_error "MCP_BEARER_TOKEN environment variable is required"
        exit 1
    fi
    
    # Check GCP authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "No active GCP authentication found. Run 'gcloud auth login'"
        exit 1
    fi
    
    # Set default region if not provided
    export GCP_REGION="${GCP_REGION:-europe-north1}"
    
    log_success "Prerequisites check passed"
}

run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "Skipping tests"
        return 0
    fi
    
    log_info "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install test dependencies
    if [[ "$VERBOSE" == "true" ]]; then
        pip3 install -r requirements.txt
        pip3 install pytest pytest-cov pytest-asyncio bandit safety
    else
        pip3 install -r requirements.txt > /dev/null 2>&1
        pip3 install pytest pytest-cov pytest-asyncio bandit safety > /dev/null 2>&1
    fi
    
    # Run security scan
    log_info "Running security scan..."
    bandit -r src/ -f txt || log_warning "Security scan found issues"
    
    # Run unit tests
    log_info "Running unit tests..."
    python3 -m pytest tests/ -v --cov=src
    
    # Run E2E tests
    log_info "Running E2E tests..."
    python3 test_e2e.py
    
    log_success "All tests passed"
}

build_image() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_warning "Skipping Docker build"
        return 0
    fi
    
    log_info "Building Docker image..."
    
    cd "$DOCKER_DIR"
    
    # Configure Docker for Artifact Registry
    local registry="${GCP_REGION}-docker.pkg.dev"
    gcloud auth configure-docker "$registry" --quiet
    
    # Build image
    local image_tag="${registry}/${GCP_PROJECT_ID}/mcp-enterprise/mcp-rag-server:${ENVIRONMENT}-$(git rev-parse --short HEAD)"
    
    if [[ "$VERBOSE" == "true" ]]; then
        docker build -t "$image_tag" -f Dockerfile .
    else
        docker build -t "$image_tag" -f Dockerfile . > /dev/null
    fi
    
    # Push image
    log_info "Pushing image to Artifact Registry..."
    if [[ "$VERBOSE" == "true" ]]; then
        docker push "$image_tag"
    else
        docker push "$image_tag" > /dev/null
    fi
    
    export CONTAINER_IMAGE="$image_tag"
    log_success "Docker image built and pushed: $image_tag"
}

deploy_terraform() {
    if [[ "$SKIP_TERRAFORM" == "true" ]]; then
        log_warning "Skipping Terraform deployment"
        return 0
    fi
    
    log_info "Deploying infrastructure with Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init
    
    # Plan deployment
    log_info "Planning Terraform deployment..."
    terraform plan \
        -var="gcp_project=${GCP_PROJECT_ID}" \
        -var="gcp_region=${GCP_REGION}" \
        -var="openai_api_key=${OPENAI_API_KEY}" \
        -var="mcp_bearer_token=${MCP_BEARER_TOKEN}" \
        -var="environment=${ENVIRONMENT}" \
        -out=tfplan
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run mode - stopping before apply"
        return 0
    fi
    
    # Apply deployment
    log_info "Applying Terraform deployment..."
    terraform apply tfplan
    
    # Get outputs
    export CLOUD_RUN_URL=$(terraform output -raw cloud_run_url)
    export HEALTH_CHECK_URL=$(terraform output -raw health_check_url)
    
    log_success "Infrastructure deployed successfully"
    log_info "Service URL: $CLOUD_RUN_URL"
}

verify_deployment() {
    if [[ -z "${HEALTH_CHECK_URL:-}" ]]; then
        log_warning "No health check URL available, skipping verification"
        return 0
    fi
    
    log_info "Verifying deployment..."
    
    # Wait for service to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            log_success "Service is healthy!"
            break
        fi
        
        log_info "Attempt $attempt/$max_attempts: Service not ready yet, waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Service failed to become healthy within 5 minutes"
        return 1
    fi
    
    # Run smoke tests
    log_info "Running smoke tests..."
    python3 -c "
import requests
import os
import sys

base_url = os.environ.get('CLOUD_RUN_URL', '')
token = os.environ.get('MCP_BEARER_TOKEN', '')
headers = {'Authorization': f'Bearer {token}'}

if not base_url:
    print('No service URL available')
    sys.exit(0)

# Test health endpoint
response = requests.get(f'{base_url}/health')
assert response.status_code == 200, f'Health check failed: {response.status_code}'
print('✓ Health check passed')

# Test metrics endpoint
response = requests.get(f'{base_url}/metrics', headers=headers)
assert response.status_code == 200, f'Metrics check failed: {response.status_code}'
print('✓ Metrics endpoint accessible')

print('✓ All smoke tests passed!')
"
    
    log_success "Deployment verification completed"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "$TERRAFORM_DIR/tfplan"
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -b|--skip-build)
                SKIP_BUILD=true
                shift
                ;;
            -t|--skip-terraform)
                SKIP_TERRAFORM=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod"
        exit 1
    fi
    
    log_info "Starting MCPEnterprise deployment to $ENVIRONMENT environment"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    run_tests
    build_image
    deploy_terraform
    verify_deployment
    
    log_success "MCPEnterprise deployment completed successfully!"
    
    if [[ -n "${CLOUD_RUN_URL:-}" ]]; then
        echo
        log_info "Service Information:"
        echo "  Environment: $ENVIRONMENT"
        echo "  Service URL: $CLOUD_RUN_URL"
        echo "  Health Check: $HEALTH_CHECK_URL"
        echo "  Project: $GCP_PROJECT_ID"
        echo "  Region: $GCP_REGION"
    fi
}

# Run main function
main "$@"
