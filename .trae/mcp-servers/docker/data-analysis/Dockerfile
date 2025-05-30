# Data Analysis MCP Server Dockerfile
# Advanced analytics and machine learning for LearningLab

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    graphviz \
    libpq-dev \
    libhdf5-dev \
    libffi-dev \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r mcpuser && useradd -r -g mcpuser mcpuser

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY config/ ./config/
COPY models/ ./models/
COPY scripts/ ./scripts/

# Create necessary directories
RUN mkdir -p /data /cache /models /exports /logs && \
    chown -R mcpuser:mcpuser /app /data /cache /models /exports /logs

# Copy and set up model files
COPY --chown=mcpuser:mcpuser models/pretrained/ /models/pretrained/
COPY --chown=mcpuser:mcpuser models/configs/ /models/configs/

# Make scripts executable
RUN chmod +x scripts/*.sh

# Switch to non-root user
USER mcpuser

# Download pre-trained models (if needed)
RUN python scripts/download_models.py

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Start the server
CMD ["python", "src/server.py"]