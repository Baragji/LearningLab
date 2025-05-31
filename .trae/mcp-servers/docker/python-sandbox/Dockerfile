# Python Sandbox MCP Server Dockerfile
# Secure Python execution environment for LearningLab

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV SANDBOX_MODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create sandbox user with restricted permissions
RUN groupadd -r sandbox && useradd -r -g sandbox -s /bin/bash sandbox

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Create sandbox directories with proper permissions
RUN mkdir -p /sandbox/{workspace,temp,uploads,outputs} && \
    mkdir -p /logs && \
    mkdir -p /app/security && \
    mkdir -p /app/scripts && \
    chown -R sandbox:sandbox /app /sandbox /logs

# Create restricted Python environment
RUN python -m venv /sandbox/venv && \
    chown -R sandbox:sandbox /sandbox/venv

# Install safe Python packages in sandbox environment
RUN /sandbox/venv/bin/pip install --no-cache-dir \
    numpy==1.25.2 \
    pandas==2.1.3 \
    matplotlib==3.8.2 \
    seaborn==0.13.0 \
    requests==2.31.0 \
    beautifulsoup4==4.12.2 \
    pillow==10.1.0 \
    scipy==1.11.4 \
    scikit-learn==1.3.2 \
    nltk==3.8.1 \
    textblob==0.17.1 \
    plotly==5.17.0 \
    bokeh==3.3.0 \
    sympy==1.12 \
    statsmodels==0.14.0

# Set up security restrictions
RUN echo 'sandbox soft nproc 100' >> /etc/security/limits.conf && \
    echo 'sandbox hard nproc 100' >> /etc/security/limits.conf && \
    echo 'sandbox soft nofile 1024' >> /etc/security/limits.conf && \
    echo 'sandbox hard nofile 1024' >> /etc/security/limits.conf && \
    echo 'sandbox soft fsize 100000' >> /etc/security/limits.conf && \
    echo 'sandbox hard fsize 100000' >> /etc/security/limits.conf

# Create execution timeout script placeholder
RUN echo '#!/usr/bin/env python3' > /app/scripts/timeout_executor.py && \
    echo 'import sys' >> /app/scripts/timeout_executor.py && \
    echo 'print("Timeout executor placeholder")' >> /app/scripts/timeout_executor.py && \
    chmod +x /app/scripts/timeout_executor.py

# Switch to sandbox user
USER sandbox

# Expose port
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# Start the sandbox server
CMD ["python", "src/server.py"]