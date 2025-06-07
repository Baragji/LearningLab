# Project Configuration
variable "gcp_project" {
  description = "GCP project ID for MCPEnterprise deployment"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for resource deployment"
  type        = string
  default     = "europe-north1"
}

variable "gcp_zone" {
  description = "GCP zone for zonal resources"
  type        = string
  default     = "europe-north1-a"
}

# Security Configuration
variable "openai_api_key" {
  description = "OpenAI API key for RAG engine"
  type        = string
  sensitive   = true
}

variable "mcp_bearer_token" {
  description = "Bearer token for MCP server authentication"
  type        = string
  sensitive   = true
}

# AI Model Configuration
variable "openai_model" {
  description = "OpenAI model for LLM operations"
  type        = string
  default     = "gpt-4"
}

variable "embedding_model" {
  description = "OpenAI embedding model for vector operations"
  type        = string
  default     = "text-embedding-3-small"
}

# Cloud Run Configuration
variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run container"
  type        = string
  default     = "2"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run container"
  type        = string
  default     = "4Gi"
}

# Access Control
variable "allow_public_access" {
  description = "Whether to allow public access to Cloud Run service"
  type        = bool
  default     = false
}

variable "authorized_members" {
  description = "List of members authorized to invoke Cloud Run service"
  type        = list(string)
  default     = []
}

# Monitoring Configuration
variable "notification_channels" {
  description = "List of notification channels for monitoring alerts"
  type        = list(string)
  default     = []
}

variable "log_level" {
  description = "Log level for the application"
  type        = string
  default     = "INFO"
  
  validation {
    condition     = contains(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARNING, ERROR, CRITICAL."
  }
}

# Environment Configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC network"
  type        = string
  default     = "10.10.0.0/24"
}

variable "connector_cidr" {
  description = "CIDR block for VPC connector"
  type        = string
  default     = "10.8.0.0/28"
}

# Storage Configuration
variable "chromadb_bucket_location" {
  description = "Location for ChromaDB storage bucket"
  type        = string
  default     = "EU"
}

variable "storage_class" {
  description = "Storage class for ChromaDB bucket"
  type        = string
  default     = "STANDARD"
}

# Performance Configuration
variable "request_timeout" {
  description = "Request timeout in seconds for Cloud Run"
  type        = number
  default     = 300
}

variable "concurrency" {
  description = "Maximum number of concurrent requests per instance"
  type        = number
  default     = 100
}

# Backup and Retention
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

# Cost Optimization
variable "enable_cpu_throttling" {
  description = "Enable CPU throttling for cost optimization"
  type        = bool
  default     = true
}

variable "enable_request_timeout" {
  description = "Enable request timeout for resource management"
  type        = bool
  default     = true
}

# Security Features
variable "enable_vpc_connector" {
  description = "Enable VPC connector for network isolation"
  type        = bool
  default     = true
}

variable "enable_private_ip" {
  description = "Enable private IP for enhanced security"
  type        = bool
  default     = true
}

variable "enable_audit_logs" {
  description = "Enable audit logging for compliance"
  type        = bool
  default     = true
}

# Development Configuration
variable "enable_debug_mode" {
  description = "Enable debug mode for development"
  type        = bool
  default     = false
}

variable "enable_hot_reload" {
  description = "Enable hot reload for development"
  type        = bool
  default     = false
}
