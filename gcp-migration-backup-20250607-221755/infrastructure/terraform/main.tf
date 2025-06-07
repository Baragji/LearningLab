terraform {
  required_version = ">= 1.1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "mcpenterprise-terraform-state"
    prefix = "rag-mcp"
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "storage.googleapis.com"
  ])
  
  service = each.value
  disable_on_destroy = false
}

# Create Secret Manager secret for OpenAI API key
resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "OPENAI_API_KEY"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "openai_api_key_version" {
  secret      = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key
}

# Create Secret Manager secret for MCP Bearer Token
resource "google_secret_manager_secret" "mcp_bearer_token" {
  secret_id = "MCP_BEARER_TOKEN"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "mcp_bearer_token_version" {
  secret      = google_secret_manager_secret.mcp_bearer_token.id
  secret_data = var.mcp_bearer_token
}

# Create VPC network for enterprise security
resource "google_compute_network" "vpc_network" {
  name                    = "mcpenterprise-network"
  auto_create_subnetworks = false
  
  depends_on = [google_project_service.required_apis]
}

resource "google_compute_subnetwork" "subnet" {
  name          = "mcpenterprise-subnet"
  ip_cidr_range = "10.10.0.0/24"
  network       = google_compute_network.vpc_network.id
  region        = var.gcp_region
  
  # Enable private Google access for Cloud Run
  private_ip_google_access = true
}

# Create VPC connector for Cloud Run
resource "google_vpc_access_connector" "connector" {
  name          = "mcpenterprise-connector"
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc_network.name
  region        = var.gcp_region
  
  depends_on = [google_project_service.required_apis]
}

# Create Cloud Storage bucket for ChromaDB persistence
resource "google_storage_bucket" "chromadb_storage" {
  name     = "${var.gcp_project}-chromadb-storage"
  location = var.gcp_region
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
  
  depends_on = [google_project_service.required_apis]
}

# Create Artifact Registry repository for container images
resource "google_artifact_registry_repository" "container_repo" {
  location      = var.gcp_region
  repository_id = "mcpenterprise-repo"
  description   = "Container repository for MCPEnterprise RAG+MCP server"
  format        = "DOCKER"
  
  depends_on = [google_project_service.required_apis]
}

# Create service account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "mcpenterprise-cloudrun"
  display_name = "MCPEnterprise Cloud Run Service Account"
  description  = "Service account for MCPEnterprise Cloud Run service"
}

# Grant necessary permissions to service account
resource "google_project_iam_member" "cloud_run_sa_permissions" {
  for_each = toset([
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectAdmin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter"
  ])
  
  project = var.gcp_project
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Create Cloud Run service
resource "google_cloud_run_v2_service" "rag_mcp_service" {
  name     = "mcpenterprise-rag-mcp"
  location = var.gcp_region
  
  template {
    service_account = google_service_account.cloud_run_sa.email
    
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
    
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
    
    containers {
      image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project}/mcpenterprise-repo/rag-mcp-server:latest"
      
      ports {
        name           = "http1"
        container_port = 8080
      }
      
      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.openai_api_key.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "MCP_BEARER_TOKEN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mcp_bearer_token.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name  = "OPENAI_MODEL"
        value = var.openai_model
      }
      
      env {
        name  = "EMBEDDING_MODEL"
        value = var.embedding_model
      }
      
      env {
        name  = "CHROMADB_STORAGE_BUCKET"
        value = google_storage_bucket.chromadb_storage.name
      }
      
      env {
        name  = "GCP_PROJECT"
        value = var.gcp_project
      }
      
      env {
        name  = "LOG_LEVEL"
        value = var.log_level
      }
      
      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
        cpu_idle = true
      }
      
      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }
      
      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds       = 5
        period_seconds        = 30
        failure_threshold     = 3
      }
    }
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
  
  depends_on = [
    google_project_service.required_apis,
    google_vpc_access_connector.connector,
    google_service_account.cloud_run_sa,
    google_project_iam_member.cloud_run_sa_permissions
  ]
}

# IAM policy for Cloud Run service (restrict access)
resource "google_cloud_run_service_iam_member" "invoker" {
  count = var.allow_public_access ? 1 : 0
  
  service  = google_cloud_run_v2_service.rag_mcp_service.name
  location = google_cloud_run_v2_service.rag_mcp_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Create monitoring alert policies
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "MCPEnterprise High Error Rate"
  combiner     = "OR"
  
  conditions {
    display_name = "Error rate > 5%"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_v2_service.rag_mcp_service.name}\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.05
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = var.notification_channels
  
  depends_on = [google_project_service.required_apis]
}

resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "MCPEnterprise High Latency"
  combiner     = "OR"
  
  conditions {
    display_name = "95th percentile latency > 2s"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_v2_service.rag_mcp_service.name}\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 2000
      
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_PERCENTILE_95"
      }
    }
  }
  
  notification_channels = var.notification_channels
  
  depends_on = [google_project_service.required_apis]
}
