# Multi-stage Dockerfile for MCP Enterprise Server
# Optimized for production deployment on GCP Cloud Run

# Stage 1: Build stage
FROM python:3.13-slim as builder

# Set build arguments
ARG BUILDPLATFORM
ARG TARGETPLATFORM

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.13-slim as runtime

# Set metadata
LABEL maintainer="MCPEnterprise Team"
LABEL version="1.0.0"
LABEL description="Enterprise MCP Server with RAG capabilities"

# Create non-root user for security
RUN groupadd -r mcpuser && useradd -r -g mcpuser mcpuser

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code
COPY src/ ./src/
COPY configs/ ./configs/

# Create necessary directories
RUN mkdir -p /app/data /app/logs && \
    chown -R mcpuser:mcpuser /app

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Switch to non-root user
USER mcpuser

# Expose port
EXPOSE 8080

# Start command
CMD ["python", "-m", "uvicorn", "src.api.mcp_server_with_rag:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
