#!/bin/bash

# MCP Server Setup Script for LearningLab Platform
# This script installs and configures all necessary MCP servers

set -e

echo "🚀 Setting up MCP servers for LearningLab..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from project root
if [ ! -f "package.json" ] || [ ! -d ".trae" ]; then
    print_error "Please run this script from the LearningLab project root directory"
    exit 1
fi

# Parse command line arguments
PHASE="1"
ENVIRONMENT="development"
SKIP_DOCKER=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --phase)
            PHASE="$2"
            shift 2
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --phase PHASE        Install servers for specific phase (1-4, default: 1)"
            echo "  --env ENVIRONMENT    Target environment (development/testing/production, default: development)"
            echo "  --skip-docker        Skip Docker-based server installations"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Installing MCP servers for Phase $PHASE in $ENVIRONMENT environment"

# Create necessary directories
print_status "Creating directories..."
mkdir -p logs
mkdir -p jupyter-config
mkdir -p jupyter-data
mkdir -p .trae/mcp-servers

# Install Node.js based MCP servers
print_status "Installing Node.js MCP servers..."

# Phase 1 servers
if [ "$PHASE" -ge "1" ]; then
    print_status "Installing Phase 1 servers..."
    
    # Filesystem server
    npm install -g @modelcontextprotocol/server-filesystem
    print_success "Filesystem MCP server installed"
    
    # Git server
    npm install -g @idosal/git-mcp
    print_success "Git MCP server installed"
    
    # OpenAPI server (if not skipping Docker)
    if [ "$SKIP_DOCKER" = false ]; then
        print_status "Building OpenAPI MCP Docker image..."
        docker build -t openapi-mcp -f - . << 'EOF'
FROM node:18-alpine
WORKDIR /app
RUN npm install -g @ckanthony/openapi-mcp
EXPOSE 3000
CMD ["openapi-mcp"]
EOF
        print_success "OpenAPI MCP Docker image built"
    fi
fi

# Install Python based MCP servers
print_status "Installing Python MCP servers..."

# Check if Python 3.8+ is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d" " -f2 | cut -d"." -f1,2)
if [ "$(echo "$PYTHON_VERSION < 3.8" | bc)" -eq 1 ]; then
    print_error "Python 3.8+ is required, found $PYTHON_VERSION"
    exit 1
fi

# Install Python MCP servers
if [ "$PHASE" -ge "1" ]; then
    pip3 install pydantic-ai[mcp-run-python]
    print_success "Python sandbox MCP server installed"
fi

if [ "$PHASE" -ge "2" ]; then
    print_status "Installing Phase 2 servers..."
    
    # Jupyter MCP server
    pip3 install jupyter-mcp-server
    print_success "Jupyter MCP server installed"
    
    # Data analysis server
    pip3 install zaturn-mcp
    print_success "Data analysis MCP server installed"
fi

# Install Docker-based servers
if [ "$SKIP_DOCKER" = false ]; then
    print_status "Setting up Docker-based MCP servers..."
    
    if [ "$PHASE" -ge "1" ]; then
        # Node.js sandbox
        print_status "Building Node.js sandbox Docker image..."
        docker build -t node-sandbox-mcp -f - . << 'EOF'
FROM node:18-alpine
WORKDIR /sandbox
RUN adduser -D -s /bin/sh sandbox
USER sandbox
CMD ["node", "-e", "process.stdin.pipe(process.stdout)"]
EOF
        print_success "Node.js sandbox Docker image built"
    fi
fi

# Install Kubernetes tools (Phase 4)
if [ "$PHASE" -ge "4" ]; then
    print_status "Installing Phase 4 servers..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_warning "kubectl not found. Installing..."
        # Install kubectl based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install kubectl
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
        fi
        print_success "kubectl installed"
    fi
    
    # Install Kubernetes MCP server
    npm install -g @weibaohui/kom
    print_success "Kubernetes MCP server installed"
fi

# Setup environment variables
print_status "Setting up environment variables..."

if [ ! -f ".env.mcp" ]; then
    cat > .env.mcp << 'EOF'
# MCP Server Environment Variables
# Copy this file to .env.mcp.local and fill in your actual values

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Portainer Configuration
PORTAINER_API_KEY=your-portainer-api-key

# Grafana Configuration
GRAFANA_API_KEY=your-grafana-api-key

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Security
MCP_SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
EOF
    print_success "Environment template created at .env.mcp"
    print_warning "Please copy .env.mcp to .env.mcp.local and fill in your actual values"
else
    print_success "Environment file already exists"
fi

# Create MCP server startup script
print_status "Creating MCP server startup script..."

cat > scripts/start-mcp-servers.sh << 'EOF'
#!/bin/bash

# Start MCP servers based on environment

set -e

ENVIRONMENT=${1:-development}
CONFIG_FILE=".trae/mcp-config.json"

echo "Starting MCP servers for $ENVIRONMENT environment..."

# Load environment variables
if [ -f ".env.mcp.local" ]; then
    export $(cat .env.mcp.local | grep -v '^#' | xargs)
fi

# Get servers to start based on environment
SERVERS=$(jq -r ".deployment.auto_start.$ENVIRONMENT[]" $CONFIG_FILE)

for server in $SERVERS; do
    echo "Starting $server MCP server..."
    
    # Get server configuration
    COMMAND=$(jq -r ".servers.$server.command" $CONFIG_FILE)
    ARGS=$(jq -r ".servers.$server.args | join(\" \")" $CONFIG_FILE)
    
    # Start server in background
    nohup $COMMAND $ARGS > logs/$server.log 2>&1 &
    echo $! > logs/$server.pid
    
    echo "$server started with PID $(cat logs/$server.pid)"
done

echo "All MCP servers started successfully!"
EOF

chmod +x scripts/start-mcp-servers.sh
print_success "MCP server startup script created"

# Create MCP server stop script
cat > scripts/stop-mcp-servers.sh << 'EOF'
#!/bin/bash

# Stop all MCP servers

echo "Stopping MCP servers..."

for pidfile in logs/*.pid; do
    if [ -f "$pidfile" ]; then
        PID=$(cat "$pidfile")
        SERVER=$(basename "$pidfile" .pid)
        
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping $SERVER (PID: $PID)..."
            kill $PID
            rm "$pidfile"
        else
            echo "$SERVER was not running"
            rm "$pidfile"
        fi
    fi
done

echo "All MCP servers stopped"
EOF

chmod +x scripts/stop-mcp-servers.sh
print_success "MCP server stop script created"

# Update package.json scripts
print_status "Updating package.json scripts..."

# Add MCP scripts to package.json if they don't exist
if ! grep -q "mcp:setup" package.json; then
    # Create temporary file with updated scripts
    jq '.scripts += {
        "mcp:setup": "./scripts/setup-mcp.sh",
        "mcp:start": "./scripts/start-mcp-servers.sh",
        "mcp:stop": "./scripts/stop-mcp-servers.sh",
        "mcp:status": "ps aux | grep mcp",
        "mcp:logs": "tail -f logs/*.log"
    }' package.json > package.json.tmp
    mv package.json.tmp package.json
    print_success "MCP scripts added to package.json"
fi

# Setup complete
print_success "🎉 MCP server setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.mcp to .env.mcp.local and fill in your API keys"
echo "2. Run 'yarn mcp:start' to start MCP servers"
echo "3. Check logs with 'yarn mcp:logs'"
echo "4. Stop servers with 'yarn mcp:stop'"
echo ""
echo "For more information, see docs/mcp-integration-guide.md"