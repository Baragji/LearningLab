# Multi-stage Dockerfile for Code Assistant + Ollama + ChromaDB
FROM ubuntu:22.04 AS ollama-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Create ollama user
RUN useradd -m -s /bin/bash ollama

# Build stage for Python dependencies
FROM python:3.11-slim AS python-builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir --user -r /tmp/requirements.txt

# Final stage
FROM ollama-base

# Copy Python packages from builder
COPY --from=python-builder /root/.local /root/.local

# Update PATH to include user packages
ENV PATH=/root/.local/bin:$PATH

# Create working directory
WORKDIR /app

# Copy Python requirements and install remaining packages
COPY requirements.txt .
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create necessary directories
RUN mkdir -p /app/data /app/models /app/logs /app/chromadb

# Set up environment
ENV OLLAMA_HOST=0.0.0.0
ENV OLLAMA_PORT=11434
ENV CODE_ASSISTANT_PORT=8080
ENV CHROMADB_HOST=0.0.0.0
ENV CHROMADB_PORT=8000
ENV PYTHONPATH=/app
ENV DEBIAN_FRONTEND=noninteractive

# Expose ports
EXPOSE 11434 8080 8000

# Copy startup script
COPY scripts/start-services.sh /start-services.sh
RUN chmod +x /start-services.sh

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start all services
CMD ["/start-services.sh"]