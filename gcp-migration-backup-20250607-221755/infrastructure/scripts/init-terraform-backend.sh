#!/bin/bash

# MCPEnterprise Terraform Backend Initialization Script
# This script sets up the GCS backend for Terraform state management

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

# Default values
ENVIRONMENT="dev"
FORCE=false
VERBOSE=false

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
MCPEnterprise Terraform Backend Initialization Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Target environment (dev, staging, prod) [default: dev]
    -f, --force             Force recreation of existing resources
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

Examples:
    $0                                    # Initialize dev environment backend
    $0 -e prod                           # Initialize production backend
    $0 --force                           # Force recreate existing backend

Environment Variables:
    GCP_PROJECT_ID          GCP Project ID (required)
    GCP_REGION             GCP Region [default: europe-north1]

This script will:
1. Create a GCS bucket for Terraform state
2. Enable versioning on the bucket
3. Set up appropriate IAM permissions
4. Configure backend.tf file
5. Initialize Terraform with the new backend

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("gcloud" "terraform" "gsutil")
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
    
    # Check GCP authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "No active GCP authentication found. Run 'gcloud auth login'"
        exit 1
    fi
    
    # Set default region if not provided
    export GCP_REGION="${GCP_REGION:-europe-north1}"
    
    # Set project
    gcloud config set project "$GCP_PROJECT_ID"
    
    log_success "Prerequisites check passed"
}

enable_apis() {
    log_info "Enabling required GCP APIs..."
    
    local apis=(
        "storage-api.googleapis.com"
        "storage-component.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        log_info "Enabling $api..."
        gcloud services enable "$api" --quiet
    done
    
    log_success "Required APIs enabled"
}

create_state_bucket() {
    local bucket_name="mcp-enterprise-terraform-state-${GCP_PROJECT_ID}"
    
    log_info "Creating Terraform state bucket: $bucket_name"
    
    # Check if bucket already exists
    if gsutil ls "gs://$bucket_name" &> /dev/null; then
        if [[ "$FORCE" == "true" ]]; then
            log_warning "Bucket exists, but force flag is set. Continuing..."
        else
            log_warning "Bucket already exists. Use --force to recreate."
            return 0
        fi
    fi
    
    # Create bucket
    gsutil mb -p "$GCP_PROJECT_ID" -c STANDARD -l "$GCP_REGION" "gs://$bucket_name"
    
    # Enable versioning
    log_info "Enabling versioning on state bucket..."
    gsutil versioning set on "gs://$bucket_name"
    
    # Set lifecycle policy to clean up old versions
    log_info "Setting lifecycle policy..."
    cat > /tmp/lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "isLive": false
        }
      }
    ]
  }
}
EOF
    
    gsutil lifecycle set /tmp/lifecycle.json "gs://$bucket_name"
    rm /tmp/lifecycle.json
    
    # Set bucket permissions
    log_info "Setting bucket permissions..."
    
    # Get current user email
    local user_email
    user_email=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    
    # Grant storage admin to current user
    gsutil iam ch "user:$user_email:roles/storage.admin" "gs://$bucket_name"
    
    log_success "Terraform state bucket created and configured"
    export TERRAFORM_STATE_BUCKET="$bucket_name"
}

configure_backend() {
    log_info "Configuring Terraform backend..."
    
    cd "$TERRAFORM_DIR"
    
    # Create backend configuration
    cat > backend.tf << EOF
# Terraform Backend Configuration for MCPEnterprise
# This file configures remote state storage in Google Cloud Storage

terraform {
  backend "gcs" {
    bucket  = "${TERRAFORM_STATE_BUCKET}"
    prefix  = "terraform/state/${ENVIRONMENT}"
  }
}
EOF
    
    log_success "Backend configuration updated"
}

initialize_terraform() {
    log_info "Initializing Terraform with new backend..."
    
    cd "$TERRAFORM_DIR"
    
    # Remove existing state if present
    if [[ -f "terraform.tfstate" ]]; then
        if [[ "$FORCE" == "true" ]]; then
            log_warning "Removing existing local state file"
            rm -f terraform.tfstate terraform.tfstate.backup
        else
            log_warning "Local state file exists. Use --force to remove it."
        fi
    fi
    
    # Remove .terraform directory to force reinitialization
    if [[ -d ".terraform" ]]; then
        rm -rf .terraform
    fi
    
    # Initialize Terraform
    if [[ "$VERBOSE" == "true" ]]; then
        terraform init
    else
        terraform init > /dev/null
    fi
    
    log_success "Terraform initialized with remote backend"
}

verify_setup() {
    log_info "Verifying backend setup..."
    
    cd "$TERRAFORM_DIR"
    
    # Check backend configuration
    if terraform init -backend=false > /dev/null 2>&1; then
        log_success "Backend configuration is valid"
    else
        log_error "Backend configuration validation failed"
        return 1
    fi
    
    # Test state operations
    if terraform state list > /dev/null 2>&1; then
        log_success "State operations working correctly"
    else
        log_warning "No state found (expected for new setup)"
    fi
    
    log_success "Backend setup verification completed"
}

show_summary() {
    echo
    log_success "Terraform backend initialization completed!"
    echo
    log_info "Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Project: $GCP_PROJECT_ID"
    echo "  Region: $GCP_REGION"
    echo "  State Bucket: $TERRAFORM_STATE_BUCKET"
    echo "  State Prefix: terraform/state/$ENVIRONMENT"
    echo
    log_info "Next steps:"
    echo "  1. Copy terraform.tfvars.example to terraform.tfvars"
    echo "  2. Fill in your configuration values"
    echo "  3. Run: terraform plan"
    echo "  4. Run: terraform apply"
    echo
    log_info "To deploy MCPEnterprise:"
    echo "  cd $TERRAFORM_DIR"
    echo "  terraform plan"
    echo "  terraform apply"
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
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
    
    log_info "Initializing Terraform backend for $ENVIRONMENT environment"
    
    # Execute initialization steps
    check_prerequisites
    enable_apis
    create_state_bucket
    configure_backend
    initialize_terraform
    verify_setup
    show_summary
}

# Run main function
main "$@"
