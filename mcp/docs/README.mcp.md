# LearningLab MCP Servers

This document provides comprehensive information about the Model Context Protocol (MCP) servers implementation for the LearningLab platform.

## 🚀 Quick Start

```bash
# 1. Initial setup
make -f Makefile.mcp setup

# 2. Generate secure passwords
make -f Makefile.mcp generate-secrets

# 3. Configure environment
cp .env.mcp .env.mcp.local
# Edit .env.mcp.local with your settings

# 4. Start all services
make -f Makefile.mcp start

# 5. Check status
make -f Makefile.mcp status
```

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Phase Implementation](#phase-implementation)
- [Services](#services)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [API Documentation](#api-documentation)

## 🎯 Overview

The LearningLab MCP Servers provide a comprehensive suite of AI-powered development and educational tools organized into four distinct phases:

### Phase 1: Core Development Tools
- **Git MCP Server**: Version control and repository management
- **Python Sandbox**: Secure Python code execution environment
- **Node.js Sandbox**: Secure JavaScript/Node.js execution environment

### Phase 2: AI and Data Analysis
- **Jupyter MCP Server**: Interactive notebooks with AI integration
- **Data Analysis MCP Server**: Advanced analytics and machine learning

### Phase 3: Monitoring and Communication
- **Grafana**: Monitoring dashboards and analytics
- **Prometheus**: Metrics collection and alerting
- **Email Service**: Notification and communication system

### Phase 4: Container Management
- **Portainer**: Container orchestration and management
- **Kubernetes Integration**: Production-ready deployment

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Phase 1: Core Development"
        A[Git MCP] --> D[Shared Network]
        B[Python Sandbox] --> D
        C[Node.js Sandbox] --> D
    end
    
    subgraph "Phase 2: AI & Data"
        E[Jupyter MCP] --> D
        F[Data Analysis MCP] --> D
        G[PostgreSQL] --> D
        H[Redis] --> D
    end
    
    subgraph "Phase 3: Monitoring"
        I[Grafana] --> D
        J[Prometheus] --> D
        K[Email Service] --> D
        L[Traefik] --> D
    end
    
    subgraph "Phase 4: Management"
        M[Portainer] --> D
        N[Kubernetes] --> D
    end
    
    D --> O[External APIs]
    D --> P[File System]
    D --> Q[User Interface]
```

## 📊 Phase Implementation

### Phase 1: Core Development Tools (Ready)

**Purpose**: Essential development environment setup

**Services**:
- Git MCP Server for version control
- Python Sandbox for secure code execution
- Node.js Sandbox for JavaScript development

**Key Features**:
- Secure sandboxed execution environments
- Git repository management and operations
- Code analysis and debugging tools
- Integration with popular development workflows

**Getting Started**:
```bash
make -f Makefile.mcp phase1
```

### Phase 2: AI and Data Analysis (Ready)

**Purpose**: AI-powered content analysis and adaptive learning

**Services**:
- Jupyter MCP Server with AI integrations
- Data Analysis MCP Server with ML capabilities
- PostgreSQL for data storage
- Redis for caching and session management

**Key Features**:
- AI content analysis and generation
- Student performance prediction
- Adaptive learning algorithms
- Interactive data visualization
- Machine learning model training and deployment

**Getting Started**:
```bash
make -f Makefile.mcp phase2
# Access Jupyter at http://localhost:8888
```

### Phase 3: Monitoring and Communication (Ready)

**Purpose**: System monitoring, analytics, and user communication

**Services**:
- Grafana for dashboards and visualization
- Prometheus for metrics collection
- Email service for notifications
- Traefik for reverse proxy and load balancing

**Key Features**:
- Real-time system monitoring
- Learning analytics dashboards
- Automated email notifications
- Performance metrics and alerting
- User behavior analytics

**Getting Started**:
```bash
make -f Makefile.mcp phase3
# Access Grafana at http://localhost:3000
# Access Prometheus at http://localhost:9090
```

### Phase 4: Container Management (Ready)

**Purpose**: Production deployment and container orchestration

**Services**:
- Portainer for container management
- Kubernetes integration for scaling
- Docker registry for image management

**Key Features**:
- Visual container management
- Kubernetes cluster management
- Automated deployment pipelines
- Resource monitoring and scaling
- Security scanning and compliance

**Getting Started**:
```bash
make -f Makefile.mcp phase4
# Access Portainer at http://localhost:9000
```

## 🛠️ Services

### Git MCP Server

**Configuration**: `.trae/mcp-servers/git.json`

**Features**:
- Repository management and operations
- Branch and merge management
- Commit history and analysis
- Integration with CI/CD pipelines
- Security and access control

**Usage**:
```bash
# Start Git MCP server
make -f Makefile.mcp start-git

# View logs
make -f Makefile.mcp logs-git
```

### Jupyter MCP Server

**Configuration**: `.trae/mcp-servers/jupyter.json`

**Features**:
- Interactive Python notebooks
- AI model integration (OpenAI, Anthropic)
- Data visualization and analysis
- Educational content creation
- Collaborative development environment

**Usage**:
```bash
# Start Jupyter server
make -f Makefile.mcp start-jupyter

# Access at http://localhost:8888
# Default token: learninglab-secure-token-change-me
```

**Pre-installed Packages**:
- Data Science: pandas, numpy, scikit-learn, matplotlib, seaborn
- AI/ML: tensorflow, pytorch, transformers, openai, anthropic
- Visualization: plotly, bokeh, altair
- Education: nbgrader, jupyter-book

### Data Analysis MCP Server

**Configuration**: `.trae/mcp-servers/data-analysis.json`

**Features**:
- Student performance analysis
- Content difficulty assessment
- Adaptive learning algorithms
- Predictive modeling
- Real-time analytics

**Models Included**:
- Student Performance Predictor
- Content Difficulty Classifier
- Knowledge Tracer
- Engagement Predictor

### Monitoring Stack

**Grafana Dashboards**:
- System Overview
- Learning Analytics
- User Behavior
- AI Services Performance
- Security Monitoring

**Prometheus Metrics**:
- System resources (CPU, memory, disk)
- Application performance
- User engagement
- AI model performance
- Error rates and latency

**Usage**:
```bash
# Start monitoring stack
make -f Makefile.mcp start-monitoring

# Open dashboards
make -f Makefile.mcp monitor
```

## ⚙️ Configuration

### Environment Variables

Copy and customize the environment file:
```bash
cp .env.mcp .env.mcp.local
```

**Key Configuration Sections**:

#### AI API Keys
```bash
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

#### Database Configuration
```bash
POSTGRES_DB=learninglab
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password
DATABASE_URL=postgresql://postgres:password@postgres:5432/learninglab
```

#### Email Configuration
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Security Settings
```bash
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
SSL_ENABLED=false
```

### Service Configuration Files

Each service has its own configuration file in `.trae/mcp-servers/`:

- `git.json` - Git MCP server configuration
- `jupyter.json` - Jupyter server configuration
- `data-analysis.json` - Data analysis server configuration
- `grafana.json` - Monitoring configuration
- `email.json` - Email service configuration
- `portainer.json` - Container management configuration

## 🔧 Development

### Local Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd LearningLab

# 2. Setup MCP environment
make -f Makefile.mcp setup

# 3. Generate development secrets
make -f Makefile.mcp generate-secrets

# 4. Configure for development
cp .env.mcp .env.mcp.local
# Edit .env.mcp.local:
# - Set ENVIRONMENT=development
# - Set DEBUG=true
# - Configure API keys

# 5. Start development environment
make -f Makefile.mcp dev
```

### Building Custom Images

```bash
# Build all images
make -f Makefile.mcp build

# Build specific service
make -f Makefile.mcp build-jupyter
make -f Makefile.mcp build-git
make -f Makefile.mcp build-data-analysis

# Rebuild without cache
make -f Makefile.mcp rebuild
```

### Development Workflow

1. **Start Development Environment**:
   ```bash
   make -f Makefile.mcp dev
   ```

2. **Make Changes**: Edit code, configurations, or Dockerfiles

3. **Rebuild and Test**:
   ```bash
   make -f Makefile.mcp build-<service>
   make -f Makefile.mcp restart
   make -f Makefile.mcp test
   ```

4. **Debug Issues**:
   ```bash
   make -f Makefile.mcp logs-<service>
   make -f Makefile.mcp debug
   ```

### Testing

```bash
# Run all tests
make -f Makefile.mcp test

# Test connectivity
make -f Makefile.mcp test-connectivity

# Test health endpoints
make -f Makefile.mcp test-health

# Run load tests
make -f Makefile.mcp test-load
```

## 🚀 Deployment

### Production Deployment

```bash
# 1. Prepare production environment
cp .env.mcp .env.mcp.production
# Configure production settings:
# - Set ENVIRONMENT=production
# - Set DEBUG=false
# - Configure SSL certificates
# - Set strong passwords

# 2. Generate production secrets
make -f Makefile.mcp generate-secrets

# 3. Build production images
make -f Makefile.mcp build

# 4. Start production environment
ENV_FILE=.env.mcp.production make -f Makefile.mcp prod

# 5. Verify deployment
make -f Makefile.mcp health
make -f Makefile.mcp test
```

### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.mcp.yml learninglab-mcp

# Check services
docker service ls
```

### Kubernetes Deployment

See `kubernetes.json` configuration for detailed Kubernetes deployment instructions.

```bash
# Apply Kubernetes manifests
kubectl apply -f .trae/mcp-servers/kubernetes/

# Check deployment status
kubectl get pods -n learninglab
```

## 📊 Monitoring

### Grafana Dashboards

Access Grafana at `http://localhost:3000` (admin/admin)

**Available Dashboards**:
1. **System Overview**: CPU, memory, disk usage
2. **Learning Analytics**: Student progress, engagement metrics
3. **User Behavior**: Session analytics, feature usage
4. **AI Services**: Model performance, API usage
5. **Security**: Authentication, access patterns

### Prometheus Metrics

Access Prometheus at `http://localhost:9090`

**Key Metrics**:
- `learninglab_users_active_total`
- `learninglab_content_views_total`
- `learninglab_ai_requests_total`
- `learninglab_response_time_seconds`
- `learninglab_errors_total`

### Alerting

**Configured Alerts**:
- High CPU usage (>80%)
- High memory usage (>90%)
- Service downtime
- High error rates
- AI API quota exceeded

**Notification Channels**:
- Email notifications
- Slack integration
- PagerDuty integration

### Log Management

```bash
# View all logs
make -f Makefile.mcp logs

# View specific service logs
make -f Makefile.mcp logs-jupyter
make -f Makefile.mcp logs-grafana

# View error logs only
make -f Makefile.mcp logs-errors

# Follow logs in real-time
docker-compose -f docker-compose.mcp.yml logs -f
```

## 🔒 Security

### Security Features

1. **Container Security**:
   - Non-root user execution
   - Read-only file systems
   - Resource limits
   - Security scanning

2. **Network Security**:
   - Isolated Docker networks
   - TLS encryption
   - Firewall rules
   - VPN integration

3. **Authentication & Authorization**:
   - JWT token authentication
   - Role-based access control
   - Multi-factor authentication
   - Session management

4. **Data Security**:
   - Encrypted data at rest
   - Secure API communications
   - Regular backups
   - GDPR compliance

### Security Best Practices

```bash
# Generate secure passwords
make -f Makefile.mcp generate-secrets

# Run security scan
make -f Makefile.mcp security-scan

# Update secrets regularly
make -f Makefile.mcp update-secrets

# Check file permissions
make -f Makefile.mcp check-permissions
```

### SSL/TLS Configuration

1. **Enable SSL**:
   ```bash
   # In .env.mcp.local
   SSL_ENABLED=true
   SSL_CERT_PATH=/certs/cert.pem
   SSL_KEY_PATH=/certs/key.pem
   ```

2. **Generate Certificates**:
   ```bash
   # Self-signed for development
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   
   # Let's Encrypt for production
   # Configure ACME_EMAIL in .env.mcp.local
   ```

## 🔧 Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check Docker daemon
docker info

# Check configuration
make -f Makefile.mcp validate-config

# Check logs
make -f Makefile.mcp logs

# Check resource usage
make -f Makefile.mcp resources
```

#### Port Conflicts

```bash
# Check which ports are in use
make -f Makefile.mcp ports

# Find processes using specific ports
lsof -i :8888
lsof -i :3000

# Modify ports in docker-compose.mcp.yml if needed
```

#### Memory Issues

```bash
# Check memory usage
make -f Makefile.mcp metrics

# Increase Docker memory limits
# Docker Desktop: Settings > Resources > Memory

# Reduce service memory limits in docker-compose.mcp.yml
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose -f docker-compose.mcp.yml exec postgres pg_isready

# Check database logs
make -f Makefile.mcp logs postgres

# Reset database
docker-compose -f docker-compose.mcp.yml exec postgres psql -U postgres -c "DROP DATABASE learninglab; CREATE DATABASE learninglab;"
```

#### AI API Issues

```bash
# Check API key configuration
grep -i api_key .env.mcp.local

# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check service logs
make -f Makefile.mcp logs-jupyter
make -f Makefile.mcp logs data-analysis-mcp
```

### Debug Mode

```bash
# Start in debug mode
make -f Makefile.mcp debug

# Enable verbose logging
# In .env.mcp.local:
DEBUG=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

### Performance Optimization

```bash
# Monitor resource usage
make -f Makefile.mcp metrics

# Optimize Docker settings
# Increase memory and CPU limits
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Clean up unused resources
make -f Makefile.mcp clean
docker system prune -a
```

## 📚 API Documentation

### Git MCP Server API

**Base URL**: `http://localhost:8001/api/v1`

**Endpoints**:
- `GET /repositories` - List repositories
- `POST /repositories` - Create repository
- `GET /repositories/{id}/commits` - Get commit history
- `POST /repositories/{id}/commits` - Create commit
- `GET /repositories/{id}/branches` - List branches
- `POST /repositories/{id}/branches` - Create branch

### Jupyter MCP Server API

**Base URL**: `http://localhost:8888/api`

**Endpoints**:
- `GET /` - API status
- `GET /kernels` - List kernels
- `POST /kernels` - Start kernel
- `GET /contents` - List notebook contents
- `POST /contents` - Create notebook

### Data Analysis MCP Server API

**Base URL**: `http://localhost:8002/api/v1`

**Endpoints**:
- `POST /analyze/student-performance` - Analyze student performance
- `POST /analyze/content-difficulty` - Assess content difficulty
- `POST /predict/engagement` - Predict user engagement
- `GET /models` - List available models
- `POST /models/{id}/train` - Train model

### Email Service API

**Base URL**: `http://localhost:3001/api/v1`

**Endpoints**:
- `POST /send` - Send email
- `GET /templates` - List email templates
- `POST /templates` - Create email template
- `GET /queue/status` - Check queue status

## 🔄 Backup and Recovery

### Automated Backups

```bash
# Create backup
make -f Makefile.mcp backup

# List available backups
make -f Makefile.mcp list-backups

# Restore from backup
make -f Makefile.mcp restore BACKUP_DIR=backups/20231201_120000
```

### Manual Backup Procedures

```bash
# Backup PostgreSQL
docker-compose -f docker-compose.mcp.yml exec postgres pg_dump -U postgres learninglab > backup.sql

# Backup Redis
docker-compose -f docker-compose.mcp.yml exec redis redis-cli BGSAVE

# Backup Jupyter notebooks
docker cp learninglab-jupyter-mcp:/home/jovyan/work ./jupyter-backup

# Backup Grafana dashboards
docker cp learninglab-grafana:/var/lib/grafana ./grafana-backup
```

## 📈 Scaling and Performance

### Horizontal Scaling

```bash
# Scale specific services
docker-compose -f docker-compose.mcp.yml up -d --scale jupyter-mcp=3
docker-compose -f docker-compose.mcp.yml up -d --scale data-analysis-mcp=2
```

### Load Balancing

Traefik is configured for automatic load balancing. Add labels to services:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.service.rule=Host(`service.learninglab.local`)"
  - "traefik.http.services.service.loadbalancer.server.port=8080"
```

### Performance Monitoring

```bash
# Monitor performance
make -f Makefile.mcp metrics

# Run load tests
make -f Makefile.mcp test-load

# Check resource limits
docker stats
```

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow PEP 8 for Python, ESLint for JavaScript
2. **Documentation**: Update README and API docs for changes
3. **Testing**: Add tests for new features
4. **Security**: Follow security best practices
5. **Performance**: Consider performance impact of changes

### Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Update documentation
5. Submit a pull request

## 📞 Support

### Getting Help

1. **Documentation**: Check this README and service-specific docs
2. **Logs**: Use `make -f Makefile.mcp logs` to check service logs
3. **Health Checks**: Use `make -f Makefile.mcp health` to verify services
4. **Community**: Join our Discord/Slack for community support

### Reporting Issues

When reporting issues, please include:

1. **Environment**: OS, Docker version, service versions
2. **Configuration**: Relevant environment variables (redact secrets)
3. **Logs**: Service logs showing the error
4. **Steps**: Steps to reproduce the issue
5. **Expected vs Actual**: What you expected vs what happened

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🙏 Acknowledgments

- **Model Context Protocol**: For the MCP specification
- **Docker Community**: For containerization tools
- **Jupyter Project**: For interactive computing
- **Grafana Labs**: For monitoring and visualization
- **OpenAI & Anthropic**: For AI API integrations

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: LearningLab Development Team