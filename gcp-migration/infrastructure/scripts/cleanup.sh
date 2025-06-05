#!/bin/bash

# MCPEnterprise Cleanup Script
# This script safely removes MCPEnterprise resources from GCP

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
DRY_RUN=false
VERBOSE=false
KEEP_STORAGE=false
KEEP_SECRETS=false

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
MCPEnterprise Cleanup Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Target environment (dev, staging, prod) [default: dev]
    -f, --force             Skip confirmation prompts
    -d, --dry-run           Show what would be deleted without executing
    -v, --verbose           Enable verbose output
    --keep-storage          Keep storage buckets and data
    --keep-secrets          Keep secrets in Secret Manager
    -h, --help              Show this help message

Examples:
    $0                                    # Clean up dev environment (with confirmation)
    $0 -e prod --force                   # Force cleanup of production
    $0 --dry-run                         # Show what would be deleted
    $0 --keep-storage --keep-secrets     # Clean up but preserve data and secrets

Environment Variables:
    GCP_PROJECT_ID          GCP Project ID (required)
    GCP_REGION             GCP Region [default: europe-north1]

WARNING: This script will permanently delete resources and data!
Make sure you have backups before running in production.

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("gcloud" "terraform")
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
    
    log_success "Prerequisites check passed"
}

confirm_cleanup() {
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    echo
    log_warning "You are about to delete MCPEnterprise resources in environment: $ENVIRONMENT"
    log_warning "Project: $GCP_PROJECT_ID"
    log_warning "Region: $GCP_REGION"
    echo
    
    if [[ "$KEEP_STORAGE" == "false" ]]; then
        log_warning "This will DELETE all storage buckets and data!"
    fi
    
    if [[ "$KEEP_SECRETS" == "false" ]]; then
        log_warning "This will DELETE all secrets from Secret Manager!"
    fi
    
    echo
    read -p "Are you sure you want to continue? Type 'yes' to confirm: " -r
    echo
    
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Cleanup cancelled"
        exit 0
    fi
}

list_resources() {
    log_info "Listing resources that will be affected..."
    
    cd "$TERRAFORM_DIR"
    
    if [[ ! -f "terraform.tfstate" ]]; then
        log_warning "No Terraform state file found. Resources may have been created outside Terraform."
        return 0
    fi
    
    # Show Terraform plan for destruction
    terraform plan -destroy \
        -var="gcp_project=${GCP_PROJECT_ID}" \
        -var="gcp_region=${GCP_REGION}" \
        -var="openai_api_key=dummy" \
        -var="mcp_bearer_token=dummy" \
        -var="environment=${ENVIRONMENT}"
}

backup_data() {
    if [[ "$KEEP_STORAGE" == "true" ]]; then
        log_info "Skipping data backup (storage will be preserved)"
        return 0
    fi
    
    log_info "Creating backup of important data..."
    
    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)_${ENVIRONMENT}"
    mkdir -p "$backup_dir"
    
    # Backup ChromaDB data if bucket exists
    local bucket_name="mcp-enterprise-chromadb-${ENVIRONMENT}-${GCP_PROJECT_ID}"
    if gsutil ls "gs://$bucket_name" &> /dev/null; then
        log_info "Backing up ChromaDB data..."
        gsutil -m cp -r "gs://$bucket_name" "$backup_dir/" || log_warning "Failed to backup ChromaDB data"
    fi
    
    # Backup Terraform state
    if [[ -f "$TERRAFORM_DIR/terraform.tfstate" ]]; then
        log_info "Backing up Terraform state..."
        cp "$TERRAFORM_DIR/terraform.tfstate" "$backup_dir/terraform.tfstate"
    fi
    
    # Export secrets (without values, just metadata)
    log_info "Backing up secret metadata..."
    gcloud secrets list --format="json" > "$backup_dir/secrets_metadata.json" || true
    
    log_success "Backup created at: $backup_dir"
}

cleanup_terraform() {
    log_info "Destroying Terraform-managed resources..."
    
    cd "$TERRAFORM_DIR"
    
    if [[ ! -f "terraform.tfstate" ]]; then
        log_warning "No Terraform state file found, skipping Terraform cleanup"
        return 0
    fi
    
    # Initialize Terraform
    terraform init
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run mode - showing destruction plan"
        terraform plan -destroy \
            -var="gcp_project=${GCP_PROJECT_ID}" \
            -var="gcp_region=${GCP_REGION}" \
            -var="openai_api_key=dummy" \
            -var="mcp_bearer_token=dummy" \
            -var="environment=${ENVIRONMENT}"
        return 0
    fi
    
    # Destroy resources
    terraform destroy -auto-approve \
        -var="gcp_project=${GCP_PROJECT_ID}" \
        -var="gcp_region=${GCP_REGION}" \
        -var="openai_api_key=dummy" \
        -var="mcp_bearer_token=dummy" \
        -var="environment=${ENVIRONMENT}"
    
    log_success "Terraform resources destroyed"
}

cleanup_orphaned_resources() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run mode - would check for orphaned resources"
        return 0
    fi
    
    log_info "Checking for orphaned resources..."
    
    # Clean up any remaining Cloud Run services
    local services
    services=$(gcloud run services list --region="$GCP_REGION" --format="value(metadata.name)" --filter="metadata.labels.environment=$ENVIRONMENT AND metadata.labels.app=mcp-enterprise" 2>/dev/null || true)
    
    if [[ -n "$services" ]]; then
        log_warning "Found orphaned Cloud Run services, cleaning up..."
        echo "$services" | while read -r service; do
            if [[ -n "$service" ]]; then
                log_info "Deleting Cloud Run service: $service"
                gcloud run services delete "$service" --region="$GCP_REGION" --quiet || true
            fi
        done
    fi
    
    # Clean up any remaining storage buckets (if not keeping storage)
    if [[ "$KEEP_STORAGE" == "false" ]]; then
        local buckets
        buckets=$(gsutil ls | grep "mcp-enterprise.*${ENVIRONMENT}" || true)
        
        if [[ -n "$buckets" ]]; then
            log_warning "Found orphaned storage buckets, cleaning up..."
            echo "$buckets" | while read -r bucket; do
                if [[ -n "$bucket" ]]; then
                    log_info "Deleting storage bucket: $bucket"
                    gsutil rm -r "$bucket" || true
                fi
            done
        fi
    fi
    
    # Clean up any remaining secrets (if not keeping secrets)
    if [[ "$KEEP_SECRETS" == "false" ]]; then
        local secrets
        secrets=$(gcloud secrets list --format="value(name)" --filter="labels.environment=$ENVIRONMENT AND labels.app=mcp-enterprise" 2>/dev/null || true)
        
        if [[ -n "$secrets" ]]; then
            log_warning "Found orphaned secrets, cleaning up..."
            echo "$secrets" | while read -r secret; do
                if [[ -n "$secret" ]]; then
                    log_info "Deleting secret: $secret"
                    gcloud secrets delete "$secret" --quiet || true
                fi
            done
        fi
    fi
    
    log_success "Orphaned resource cleanup completed"
}

cleanup_local_files() {
    log_info "Cleaning up local files..."
    
    # Remove Terraform state files (after backup)
    if [[ -f "$TERRAFORM_DIR/terraform.tfstate" ]]; then
        rm -f "$TERRAFORM_DIR/terraform.tfstate"
        rm -f "$TERRAFORM_DIR/terraform.tfstate.backup"
    fi
    
    # Remove Terraform plan files
    rm -f "$TERRAFORM_DIR/tfplan"
    rm -f "$TERRAFORM_DIR/.terraform.lock.hcl"
    
    # Remove Terraform cache
    rm -rf "$TERRAFORM_DIR/.terraform"
    
    log_success "Local files cleaned up"
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
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --keep-storage)
                KEEP_STORAGE=true
                shift
                ;;
            --keep-secrets)
                KEEP_SECRETS=true
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
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Starting MCPEnterprise cleanup (DRY RUN) for $ENVIRONMENT environment"
    else
        log_info "Starting MCPEnterprise cleanup for $ENVIRONMENT environment"
    fi
    
    # Execute cleanup steps
    check_prerequisites
    list_resources
    confirm_cleanup
    backup_data
    cleanup_terraform
    cleanup_orphaned_resources
    
    if [[ "$DRY_RUN" == "false" ]]; then
        cleanup_local_files
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_success "MCPEnterprise cleanup dry run completed!"
    else
        log_success "MCPEnterprise cleanup completed successfully!"
        
        echo
        log_info "Cleanup Summary:"
        echo "  Environment: $ENVIRONMENT"
        echo "  Project: $GCP_PROJECT_ID"
        echo "  Region: $GCP_REGION"
        echo "  Storage preserved: $KEEP_STORAGE"
        echo "  Secrets preserved: $KEEP_SECRETS"
        
        if [[ "$KEEP_STORAGE" == "false" || "$KEEP_SECRETS" == "false" ]]; then
            echo
            log_info "Backups are available in: $PROJECT_ROOT/backups/"
        fi
    fi
}

# Run main function
main "$@"
