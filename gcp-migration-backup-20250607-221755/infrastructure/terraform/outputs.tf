# Cloud Run Service Outputs
output "cloud_run_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.rag_mcp_service.uri
}

output "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.rag_mcp_service.name
}

output "cloud_run_service_account" {
  description = "Email of the Cloud Run service account"
  value       = google_service_account.cloud_run_sa.email
}

# Network Outputs
output "vpc_network_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.vpc_network.name
}

output "vpc_network_id" {
  description = "ID of the VPC network"
  value       = google_compute_network.vpc_network.id
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = google_compute_subnetwork.subnet.name
}

output "vpc_connector_name" {
  description = "Name of the VPC connector"
  value       = google_vpc_access_connector.connector.name
}

# Storage Outputs
output "chromadb_bucket_name" {
  description = "Name of the ChromaDB storage bucket"
  value       = google_storage_bucket.chromadb_storage.name
}

output "chromadb_bucket_url" {
  description = "URL of the ChromaDB storage bucket"
  value       = google_storage_bucket.chromadb_storage.url
}

# Container Registry Outputs
output "artifact_registry_repository" {
  description = "Name of the Artifact Registry repository"
  value       = google_artifact_registry_repository.container_repo.name
}

output "container_image_url" {
  description = "Full URL for container images"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project}/${google_artifact_registry_repository.container_repo.repository_id}"
}

# Security Outputs
output "openai_secret_name" {
  description = "Name of the OpenAI API key secret"
  value       = google_secret_manager_secret.openai_api_key.secret_id
}

output "mcp_token_secret_name" {
  description = "Name of the MCP bearer token secret"
  value       = google_secret_manager_secret.mcp_bearer_token.secret_id
}

# Monitoring Outputs
output "error_rate_alert_policy" {
  description = "Name of the error rate alert policy"
  value       = google_monitoring_alert_policy.high_error_rate.name
}

output "latency_alert_policy" {
  description = "Name of the latency alert policy"
  value       = google_monitoring_alert_policy.high_latency.name
}

# Project Information
output "project_id" {
  description = "GCP Project ID"
  value       = var.gcp_project
}

output "region" {
  description = "GCP Region"
  value       = var.gcp_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

# Health Check Endpoints
output "health_check_url" {
  description = "Health check endpoint URL"
  value       = "${google_cloud_run_v2_service.rag_mcp_service.uri}/health"
}

output "metrics_url" {
  description = "Metrics endpoint URL"
  value       = "${google_cloud_run_v2_service.rag_mcp_service.uri}/metrics"
}

# MCP Endpoint
output "mcp_endpoint_url" {
  description = "MCP protocol endpoint URL"
  value       = "${google_cloud_run_v2_service.rag_mcp_service.uri}/mcp"
}

# Configuration for CI/CD
output "deployment_config" {
  description = "Configuration values for CI/CD deployment"
  value = {
    project_id              = var.gcp_project
    region                  = var.gcp_region
    service_name           = google_cloud_run_v2_service.rag_mcp_service.name
    container_registry     = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project}/${google_artifact_registry_repository.container_repo.repository_id}"
    service_account_email  = google_service_account.cloud_run_sa.email
    vpc_connector         = google_vpc_access_connector.connector.name
    chromadb_bucket       = google_storage_bucket.chromadb_storage.name
  }
  sensitive = false
}

# Resource Names for Scripts
output "resource_names" {
  description = "Names of created resources for management scripts"
  value = {
    cloud_run_service     = google_cloud_run_v2_service.rag_mcp_service.name
    vpc_network          = google_compute_network.vpc_network.name
    subnet               = google_compute_subnetwork.subnet.name
    vpc_connector        = google_vpc_access_connector.connector.name
    storage_bucket       = google_storage_bucket.chromadb_storage.name
    artifact_registry    = google_artifact_registry_repository.container_repo.name
    service_account      = google_service_account.cloud_run_sa.name
    openai_secret        = google_secret_manager_secret.openai_api_key.secret_id
    mcp_token_secret     = google_secret_manager_secret.mcp_bearer_token.secret_id
  }
}
