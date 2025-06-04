# Multi-stage Dockerfile for Code Assistant + OpenAI + ChromaDB
FROM python:3.11-slim AS python-builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir --user -r /tmp/requirements.txt

# Final stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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
RUN mkdir -p /app/data /app/logs /app/chromadb

# Set up environment
ENV CODE_ASSISTANT_PORT=8080
ENV CHROMADB_HOST=0.0.0.0
ENV CHROMADB_PORT=8000
ENV PYTHONPATH=/app
ENV DEBIAN_FRONTEND=noninteractive

# Expose ports
EXPOSE 8080 8000

# Copy startup script
COPY scripts/start-services.sh /start-services.sh
RUN chmod +x /start-services.sh

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start all services
CMD ["/start-services.sh"]
