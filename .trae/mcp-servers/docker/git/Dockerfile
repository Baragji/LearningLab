# Git MCP Server Dockerfile
# Provides secure Git operations and repository management

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    openssh-client \
    gnupg \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production && \
    npm cache clean --force

# Copy application code
COPY src/ ./src/

# Create necessary directories
RUN mkdir -p /workspace /data /logs && \
    chown -R mcpuser:mcpuser /app /workspace /data /logs

# Configure Git
RUN git config --global user.name "LearningLab MCP" && \
    git config --global user.email "mcp@learninglab.local" && \
    git config --global init.defaultBranch main && \
    git config --global safe.directory '*'

# Switch to non-root user
USER mcpuser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start the server
CMD ["node", "src/server.js"]