# Terraform Backend Configuration for MCPEnterprise
# This file configures remote state storage in Google Cloud Storage

# Note: Before using this backend, you need to:
# 1. Create a GCS bucket for Terraform state
# 2. Enable versioning on the bucket
# 3. Set up appropriate IAM permissions

# Uncomment and configure the backend after initial setup
# terraform {
#   backend "gcs" {
#     bucket  = "mcp-enterprise-terraform-state-${var.gcp_project}"
#     prefix  = "terraform/state"
#     
#     # Optional: Enable state locking with Cloud Storage
#     # This requires additional setup of a Cloud Storage bucket
#     # with object versioning enabled
#   }
# }

# Alternative: Local backend for development (default)
# Terraform will use local state files when no backend is configured
# This is suitable for development but not recommended for production

# For production environments, use the GCS backend above
# and ensure proper access controls and backup strategies

# Backend initialization script is available at:
# infrastructure/scripts/init-terraform-backend.sh
