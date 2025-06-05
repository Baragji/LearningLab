# 🐳 LearningLab Docker Documentation

This document provides detailed information about the Docker setup for the LearningLab platform, including configuration, optimization, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Docker Architecture](#docker-architecture)
- [Docker Configuration](#docker-configuration)
- [Docker Compose Setup](#docker-compose-setup)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Optimization Techniques](#optimization-techniques)
- [Security Best Practices](#security-best-practices)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## 🌟 Overview

LearningLab uses Docker for containerization to ensure consistent development and production environments. The Docker setup includes:

- Multi-stage builds for optimized image sizes
- Docker Compose for orchestrating multiple services
- Separate development and production configurations
- Health checks for reliability
- Security best practices implementation

## 🏗️ Docker Architecture

The Docker architecture for LearningLab consists of the following services:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Nginx          │────▶│  Next.js Web    │────▶│  NestJS API     │
│  Reverse Proxy  │     │  Frontend       │     │  Backend        │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│                 │                           │                 │
│  Redis          │                           │  PostgreSQL     │
│  Cache          │                           │  Database       │
│                 │                           │                 │
└─────────────────┘                           └─────────────────┘
```

## 🔧 Docker Configuration

### Directory Structure

```
learninglab-monorepo/
├── docker/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── web/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── nginx/
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── nginx.dev.conf
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
├── Dockerfile.api
├── Dockerfile.web
└── docker-compose.yml
```

### API Dockerfile

The API Dockerfile uses a multi-stage build process to create an optimized image:

```dockerfile
# Multi-stage build for optimal size and security
FROM node:22-alpine AS base
WORKDIR /app

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache openssl dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Dependencies stage
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# Install dependencies with cache optimization
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile --production=false

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with cache mounts
RUN --mount=type=cache,target=/app/.turbo \
    yarn workspace @repo/core build && \
    yarn workspace api prisma generate && \
    yarn workspace api build

# Production dependencies
FROM base AS prod-deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile --production=true

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3001

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/core/dist ./packages/core/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/main.js"]
```

### Web Dockerfile

The Web Dockerfile also uses a multi-stage build process:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache libc6-compat dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Dependencies stage
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN --mount=type=cache,target=/app/.turbo \
    --mount=type=cache,target=/app/apps/web/.next/cache \
    yarn workspace @repo/core build && \
    yarn workspace @repo/ui build && \
    yarn workspace web build

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### Nginx Dockerfile

The Nginx Dockerfile sets up a reverse proxy:

```dockerfile
FROM nginx:1.25-alpine AS base

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY mime.types /etc/nginx/mime.types

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/log/nginx /var/run /etc/nginx

USER nginx-user

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## 🔄 Docker Compose Setup

### Development Docker Compose

The development Docker Compose file (`docker-compose.dev.yml`) sets up a development environment:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: learning-db-dev
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: learninglab_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    networks:
      - backend_dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d learninglab_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: learning-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data
    networks:
      - backend_dev
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ../
      dockerfile: docker/api/Dockerfile.dev
    container_name: learning-api-dev
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learninglab_dev?schema=public
      - REDIS_URL=redis://redis:6379
    volumes:
      - ../:/app
      - /app/node_modules
      - /app/apps/api/node_modules
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend_dev
      - frontend_dev
    command: yarn workspace api dev

  web:
    build:
      context: ../
      dockerfile: docker/web/Dockerfile.dev
    container_name: learning-web-dev
    environment:
      - NODE_ENV=development
      - PORT=3000
      - NEXT_PUBLIC_API_URL=http://api:3001
    volumes:
      - ../:/app
      - /app/node_modules
      - /app/apps/web/node_modules
      - /app/apps/web/.next
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - frontend_dev
    command: yarn workspace web dev

networks:
  backend_dev:
  frontend_dev:

volumes:
  postgres_data_dev:
  redis_data_dev:
```

### Production Docker Compose

The production Docker Compose file (`docker-compose.prod.yml`) sets up a production environment:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: learning-db
    environment:
      POSTGRES_USER_FILE: /run/secrets/postgres_user
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
      POSTGRES_DB: learninglab_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - backend
    secrets:
      - postgres_user
      - postgres_password
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U $$(cat /run/secrets/postgres_user) -d learninglab_prod",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  redis:
    image: redis:7-alpine
    container_name: learning-redis
    command: redis-server --requirepass $$(cat /run/secrets/redis_password)
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - backend
    secrets:
      - redis_password
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: "0.25"

  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
      cache_from:
        - learninglab/api:latest
    image: learninglab/api:latest
    container_name: learning-api
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://$$(cat /run/secrets/postgres_user):$$(cat /run/secrets/postgres_password)@postgres:5432/learninglab_prod?schema=public
    env_file:
      - .env.prod
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - backend
      - frontend
    secrets:
      - postgres_user
      - postgres_password
      - jwt_secret
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  web:
    build:
      context: .
      dockerfile: docker/web/Dockerfile
      cache_from:
        - learninglab/web:latest
    image: learninglab/web:latest
    container_name: learning-web
    environment:
      - NODE_ENV=production
      - PORT=3001
      - NEXT_PUBLIC_API_URL=http://api:3001
    env_file:
      - .env.prod
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - frontend
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  nginx:
    build:
      context: ./docker/nginx
      dockerfile: Dockerfile
    image: learninglab/nginx:latest
    container_name: learning-nginx
    ports:
      - "80:8080"
      - "443:8443"
    depends_on:
      web:
        condition: service_healthy
      api:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - frontend
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.25"
        reservations:
          memory: 64M
          cpus: "0.1"

networks:
  backend:
    driver: bridge
    internal: true
  frontend:
    driver: bridge

volumes:
  postgres_data:
  redis_data:

secrets:
  postgres_user:
    file: ./secrets/postgres_user.txt
  postgres_password:
    file: ./secrets/postgres_password.txt
  redis_password:
    file: ./secrets/redis_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

## 💻 Development Environment

### Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/learninglab.git
   cd learninglab
   ```

2. Create a `.env.dev` file:
   ```
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learninglab_dev?schema=public
   REDIS_URL=redis://redis:6379
   JWT_SECRET=your_jwt_secret
   ```

3. Start the development environment:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml up -d
   ```

4. Access the applications:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs
   - Prisma Studio: http://localhost:5555

### Development Workflow

1. Make changes to the code
2. The changes will be automatically detected and the applications will reload
3. Run tests:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml exec api yarn test
   docker-compose -f docker/docker-compose.dev.yml exec web yarn test
   ```

4. Lint code:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml exec api yarn lint
   docker-compose -f docker/docker-compose.dev.yml exec web yarn lint
   ```

## 🚀 Production Environment

### Setting Up the Production Environment

1. Create secret files:
   ```bash
   mkdir -p secrets
   echo "postgres" > secrets/postgres_user.txt
   openssl rand -base64 32 > secrets/postgres_password.txt
   openssl rand -base64 32 > secrets/redis_password.txt
   openssl rand -base64 64 > secrets/jwt_secret.txt
   ```

2. Create a `.env.prod` file:
   ```
   NODE_ENV=production
   JWT_SECRET_FILE=/run/secrets/jwt_secret
   REDIS_URL=redis://redis:6379
   REDIS_PASSWORD_FILE=/run/secrets/redis_password
   ```

3. Build and start the production environment:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml build
   docker-compose -f docker/docker-compose.prod.yml up -d
   ```

4. Access the application:
   - Frontend: http://localhost
   - Backend: http://localhost/api

### Production Deployment

For production deployment, you can use Docker Swarm or Kubernetes:

#### Docker Swarm

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy the stack
docker stack deploy -c docker/docker-compose.prod.yml learninglab
```

#### Kubernetes

```bash
# Convert Docker Compose to Kubernetes manifests
kompose convert -f docker/docker-compose.prod.yml -o k8s

# Apply the manifests
kubectl apply -f k8s/
```

## ⚡ Optimization Techniques

### Image Size Optimization

- **Multi-stage builds**: Separate build and runtime stages
- **Alpine base images**: Use lightweight Alpine Linux base images
- **Production dependencies only**: Install only production dependencies in the final image
- **Layer caching**: Optimize layer caching for faster builds
- **Minimal file copying**: Copy only necessary files

### Build Speed Optimization

- **Cache mounts**: Use cache mounts for dependencies and build artifacts
- **Parallel builds**: Build services in parallel
- **Dependency caching**: Cache dependencies between builds
- **Optimized Dockerfiles**: Organize Dockerfiles for optimal caching

### Runtime Optimization

- **Resource limits**: Set memory and CPU limits
- **Health checks**: Implement health checks for all services
- **Graceful shutdown**: Handle signals properly for graceful shutdown
- **Non-root users**: Run containers as non-root users
- **Proper signal handling**: Use dumb-init for proper signal handling

## 🔒 Security Best Practices

### Container Security

- **Non-root users**: Run containers as non-root users
- **Read-only file system**: Mount file systems as read-only when possible
- **Minimal base images**: Use minimal base images to reduce attack surface
- **Security updates**: Keep base images updated with security patches
- **Secrets management**: Use Docker secrets for sensitive information

### Network Security

- **Network isolation**: Isolate networks with internal networks
- **Expose only necessary ports**: Expose only the ports that are needed
- **TLS**: Use TLS for all external communication
- **API security**: Secure API endpoints with authentication and authorization

### Secrets Management

- **Docker secrets**: Use Docker secrets for sensitive information
- **Environment variables**: Use environment variables for configuration
- **Secret files**: Mount secret files instead of using environment variables
- **Encryption**: Encrypt sensitive data at rest and in transit

## 📊 Monitoring & Health Checks

### Health Checks

All services implement health checks to ensure they are running properly:

- **API**: HTTP request to `/health` endpoint
- **Web**: HTTP request to `/api/health` endpoint
- **Postgres**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Nginx**: HTTP request to `/health` endpoint

### Monitoring

For monitoring, you can use the following tools:

- **Prometheus**: Collect metrics
- **Grafana**: Visualize metrics
- **Loki**: Collect logs
- **Alertmanager**: Send alerts

### Logging

For logging, you can use the following configuration:

- **JSON logging**: Use JSON format for structured logging
- **Log aggregation**: Collect logs from all services
- **Log rotation**: Rotate logs to prevent disk space issues
- **Log levels**: Use appropriate log levels for different environments

## 🔧 Troubleshooting

### Common Issues

#### Container Won't Start

1. Check the container logs:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml logs api
   ```

2. Check if the container is running:
   ```bash
   docker ps -a
   ```

3. Check if the container is healthy:
   ```bash
   docker inspect --format='{{.State.Health.Status}}' learning-api
   ```

#### Database Connection Issues

1. Check if the database container is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check if the database is healthy:
   ```bash
   docker inspect --format='{{.State.Health.Status}}' learning-db
   ```

3. Check the database logs:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml logs postgres
   ```

#### Network Issues

1. Check if the networks are created:
   ```bash
   docker network ls
   ```

2. Check if the containers are connected to the networks:
   ```bash
   docker network inspect learninglab_backend
   ```

### Debugging

1. Enter a running container:
   ```bash
   docker exec -it learning-api sh
   ```

2. Check the environment variables:
   ```bash
   docker exec -it learning-api env
   ```

3. Check the file system:
   ```bash
   docker exec -it learning-api ls -la
   ```

## 🔄 CI/CD Integration

### GitHub Actions

The project uses GitHub Actions for CI/CD:

```yaml
name: Docker CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Cache Docker layers
        uses: actions/cache@v3
        with:
          path: /tmp/.buildx-cache
          key: ${{ runner.os }}-buildx-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-buildx-
      
      - name: Build and test API
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/api/Dockerfile
          push: false
          load: true
          tags: learninglab/api:test
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new
      
      - name: Build and test Web
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/web/Dockerfile
          push: false
          load: true
          tags: learninglab/web:test
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new
      
      - name: Move cache
        run: |
          rm -rf /tmp/.buildx-cache
          mv /tmp/.buildx-cache-new /tmp/.buildx-cache
      
      - name: Run tests
        run: |
          docker-compose -f docker/docker-compose.test.yml up -d
          docker-compose -f docker/docker-compose.test.yml exec -T api yarn test:ci
          docker-compose -f docker/docker-compose.test.yml exec -T web yarn test:ci
          docker-compose -f docker/docker-compose.test.yml down
  
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push API
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/api/Dockerfile
          push: true
          tags: learninglab/api:latest
      
      - name: Build and push Web
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/web/Dockerfile
          push: true
          tags: learninglab/web:latest
      
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/learninglab
            docker-compose -f docker/docker-compose.prod.yml pull
            docker-compose -f docker/docker-compose.prod.yml up -d
```

### Continuous Integration

The CI pipeline includes the following steps:

1. Build Docker images
2. Run tests
3. Lint code
4. Check for security vulnerabilities
5. Check for type errors

### Continuous Deployment

The CD pipeline includes the following steps:

1. Build Docker images
2. Push Docker images to registry
3. Deploy to staging/production
4. Run database migrations
5. Verify deployment health
6. Rollback if deployment fails# 🐳 LearningLab Docker Documentation

This document provides detailed information about the Docker setup for the LearningLab platform, including configuration, optimization, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Docker Architecture](#docker-architecture)
- [Docker Configuration](#docker-configuration)
- [Docker Compose Setup](#docker-compose-setup)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Optimization Techniques](#optimization-techniques)
- [Security Best Practices](#security-best-practices)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## 🌟 Overview

LearningLab uses Docker for containerization to ensure consistent development and production environments. The Docker setup includes:

- Multi-stage builds for optimized image sizes
- Docker Compose for orchestrating multiple services
- Separate development and production configurations
- Health checks for reliability
- Security best practices implementation

## 🏗️ Docker Architecture

The Docker architecture for LearningLab consists of the following services:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Nginx          │────▶│  Next.js Web    │────▶│  NestJS API     │
│  Reverse Proxy  │     │  Frontend       │     │  Backend        │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│                 │                           │                 │
│  Redis          │                           │  PostgreSQL     │
│  Cache          │                           │  Database       │
│                 │                           │                 │
└─────────────────┘                           └─────────────────┘
```

## 🔧 Docker Configuration

### Directory Structure

```
learninglab-monorepo/
├── docker/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── web/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── nginx/
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── nginx.dev.conf
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
├── Dockerfile.api
├── Dockerfile.web
└── docker-compose.yml
```

### API Dockerfile

The API Dockerfile uses a multi-stage build process to create an optimized image:

```dockerfile
# Multi-stage build for optimal size and security
FROM node:22-alpine AS base
WORKDIR /app

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache openssl dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Dependencies stage
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# Install dependencies with cache optimization
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile --production=false

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with cache mounts
RUN --mount=type=cache,target=/app/.turbo \
    yarn workspace @repo/core build && \
    yarn workspace api prisma generate && \
    yarn workspace api build

# Production dependencies
FROM base AS prod-deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile --production=true

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3001

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/core/dist ./packages/core/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/main.js"]
```

### Web Dockerfile

The Web Dockerfile also uses a multi-stage build process:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache libc6-compat dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Dependencies stage
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN --mount=type=cache,target=/app/.turbo \
    --mount=type=cache,target=/app/apps/web/.next/cache \
    yarn workspace @repo/core build && \
    yarn workspace @repo/ui build && \
    yarn workspace web build

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### Nginx Dockerfile

The Nginx Dockerfile sets up a reverse proxy:

```dockerfile
FROM nginx:1.25-alpine AS base

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY mime.types /etc/nginx/mime.types

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/log/nginx /var/run /etc/nginx

USER nginx-user

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## 🔄 Docker Compose Setup

### Development Docker Compose

The development Docker Compose file (`docker-compose.dev.yml`) sets up a development environment:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: learning-db-dev
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: learninglab_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    networks:
      - backend_dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d learninglab_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: learning-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data
    networks:
      - backend_dev
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ../
      dockerfile: docker/api/Dockerfile.dev
    container_name: learning-api-dev
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learninglab_dev?schema=public
      - REDIS_URL=redis://redis:6379
    volumes:
      - ../:/app
      - /app/node_modules
      - /app/apps/api/node_modules
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend_dev
      - frontend_dev
    command: yarn workspace api dev

  web:
    build:
      context: ../
      dockerfile: docker/web/Dockerfile.dev
    container_name: learning-web-dev
    environment:
      - NODE_ENV=development
      - PORT=3000
      - NEXT_PUBLIC_API_URL=http://api:3001
    volumes:
      - ../:/app
      - /app/node_modules
      - /app/apps/web/node_modules
      - /app/apps/web/.next
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - frontend_dev
    command: yarn workspace web dev

networks:
  backend_dev:
  frontend_dev:

volumes:
  postgres_data_dev:
  redis_data_dev:
```

### Production Docker Compose

The production Docker Compose file (`docker-compose.prod.yml`) sets up a production environment:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: learning-db
    environment:
      POSTGRES_USER_FILE: /run/secrets/postgres_user
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
      POSTGRES_DB: learninglab_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - backend
    secrets:
      - postgres_user
      - postgres_password
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U $$(cat /run/secrets/postgres_user) -d learninglab_prod",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  redis:
    image: redis:7-alpine
    container_name: learning-redis
    command: redis-server --requirepass $$(cat /run/secrets/redis_password)
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - backend
    secrets:
      - redis_password
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: "0.25"

  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
      cache_from:
        - learninglab/api:latest
    image: learninglab/api:latest
    container_name: learning-api
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://$$(cat /run/secrets/postgres_user):$$(cat /run/secrets/postgres_password)@postgres:5432/learninglab_prod?schema=public
    env_file:
      - .env.prod
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - backend
      - frontend
    secrets:
      - postgres_user
      - postgres_password
      - jwt_secret
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  web:
    build:
      context: .
      dockerfile: docker/web/Dockerfile
      cache_from:
        - learninglab/web:latest
    image: learninglab/web:latest
    container_name: learning-web
    environment:
      - NODE_ENV=production
      - PORT=3001
      - NEXT_PUBLIC_API_URL=http://api:3001
    env_file:
      - .env.prod
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - frontend
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  nginx:
    build:
      context: ./docker/nginx
      dockerfile: Dockerfile
    image: learninglab/nginx:latest
    container_name: learning-nginx
    ports:
      - "80:8080"
      - "443:8443"
    depends_on:
      web:
        condition: service_healthy
      api:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - frontend
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.25"
        reservations:
          memory: 64M
          cpus: "0.1"

networks:
  backend:
    driver: bridge
    internal: true
  frontend:
    driver: bridge

volumes:
  postgres_data:
  redis_data:

secrets:
  postgres_user:
    file: ./secrets/postgres_user.txt
  postgres_password:
    file: ./secrets/postgres_password.txt
  redis_password:
    file: ./secrets/redis_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

## 💻 Development Environment

### Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/learninglab.git
   cd learninglab
   ```

2. Create a `.env.dev` file:
   ```
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learninglab_dev?schema=public
   REDIS_URL=redis://redis:6379
   JWT_SECRET=your_jwt_secret
   ```

3. Start the development environment:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml up -d
   ```

4. Access the applications:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs
   - Prisma Studio: http://localhost:5555

### Development Workflow

1. Make changes to the code
2. The changes will be automatically detected and the applications will reload
3. Run tests:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml exec api yarn test
   docker-compose -f docker/docker-compose.dev.yml exec web yarn test
   ```

4. Lint code:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml exec api yarn lint
   docker-compose -f docker/docker-compose.dev.yml exec web yarn lint
   ```

## 🚀 Production Environment

### Setting Up the Production Environment

1. Create secret files:
   ```bash
   mkdir -p secrets
   echo "postgres" > secrets/postgres_user.txt
   openssl rand -base64 32 > secrets/postgres_password.txt
   openssl rand -base64 32 > secrets/redis_password.txt
   openssl rand -base64 64 > secrets/jwt_secret.txt
   ```

2. Create a `.env.prod` file:
   ```
   NODE_ENV=production
   JWT_SECRET_FILE=/run/secrets/jwt_secret
   REDIS_URL=redis://redis:6379
   REDIS_PASSWORD_FILE=/run/secrets/redis_password
   ```

3. Build and start the production environment:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml build
   docker-compose -f docker/docker-compose.prod.yml up -d
   ```

4. Access the application:
   - Frontend: http://localhost
   - Backend: http://localhost/api

### Production Deployment

For production deployment, you can use Docker Swarm or Kubernetes:

#### Docker Swarm

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy the stack
docker stack deploy -c docker/docker-compose.prod.yml learninglab
```

#### Kubernetes

```bash
# Convert Docker Compose to Kubernetes manifests
kompose convert -f docker/docker-compose.prod.yml -o k8s

# Apply the manifests
kubectl apply -f k8s/
```

## ⚡ Optimization Techniques

### Image Size Optimization

- **Multi-stage builds**: Separate build and runtime stages
- **Alpine base images**: Use lightweight Alpine Linux base images
- **Production dependencies only**: Install only production dependencies in the final image
- **Layer caching**: Optimize layer caching for faster builds
- **Minimal file copying**: Copy only necessary files

### Build Speed Optimization

- **Cache mounts**: Use cache mounts for dependencies and build artifacts
- **Parallel builds**: Build services in parallel
- **Dependency caching**: Cache dependencies between builds
- **Optimized Dockerfiles**: Organize Dockerfiles for optimal caching

### Runtime Optimization

- **Resource limits**: Set memory and CPU limits
- **Health checks**: Implement health checks for all services
- **Graceful shutdown**: Handle signals properly for graceful shutdown
- **Non-root users**: Run containers as non-root users
- **Proper signal handling**: Use dumb-init for proper signal handling

## 🔒 Security Best Practices

### Container Security

- **Non-root users**: Run containers as non-root users
- **Read-only file system**: Mount file systems as read-only when possible
- **Minimal base images**: Use minimal base images to reduce attack surface
- **Security updates**: Keep base images updated with security patches
- **Secrets management**: Use Docker secrets for sensitive information

### Network Security

- **Network isolation**: Isolate networks with internal networks
- **Expose only necessary ports**: Expose only the ports that are needed
- **TLS**: Use TLS for all external communication
- **API security**: Secure API endpoints with authentication and authorization

### Secrets Management

- **Docker secrets**: Use Docker secrets for sensitive information
- **Environment variables**: Use environment variables for configuration
- **Secret files**: Mount secret files instead of using environment variables
- **Encryption**: Encrypt sensitive data at rest and in transit

## 📊 Monitoring & Health Checks

### Health Checks

All services implement health checks to ensure they are running properly:

- **API**: HTTP request to `/health` endpoint
- **Web**: HTTP request to `/api/health` endpoint
- **Postgres**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Nginx**: HTTP request to `/health` endpoint

### Monitoring

For monitoring, you can use the following tools:

- **Prometheus**: Collect metrics
- **Grafana**: Visualize metrics
- **Loki**: Collect logs
- **Alertmanager**: Send alerts

### Logging

For logging, you can use the following configuration:

- **JSON logging**: Use JSON format for structured logging
- **Log aggregation**: Collect logs from all services
- **Log rotation**: Rotate logs to prevent disk space issues
- **Log levels**: Use appropriate log levels for different environments

## 🔧 Troubleshooting

### Common Issues

#### Container Won't Start

1. Check the container logs:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml logs api
   ```

2. Check if the container is running:
   ```bash
   docker ps -a
   ```

3. Check if the container is healthy:
   ```bash
   docker inspect --format='{{.State.Health.Status}}' learning-api
   ```

#### Database Connection Issues

1. Check if the database container is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check if the database is healthy:
   ```bash
   docker inspect --format='{{.State.Health.Status}}' learning-db
   ```

3. Check the database logs:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml logs postgres
   ```

#### Network Issues

1. Check if the networks are created:
   ```bash
   docker network ls
   ```

2. Check if the containers are connected to the networks:
   ```bash
   docker network inspect learninglab_backend
   ```

### Debugging

1. Enter a running container:
   ```bash
   docker exec -it learning-api sh
   ```

2. Check the environment variables:
   ```bash
   docker exec -it learning-api env
   ```

3. Check the file system:
   ```bash
   docker exec -it learning-api ls -la
   ```

## 🔄 CI/CD Integration

### GitHub Actions

The project uses GitHub Actions for CI/CD:

```yaml
name: Docker CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Cache Docker layers
        uses: actions/cache@v3
        with:
          path: /tmp/.buildx-cache
          key: ${{ runner.os }}-buildx-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-buildx-
      
      - name: Build and test API
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/api/Dockerfile
          push: false
          load: true
          tags: learninglab/api:test
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new
      
      - name: Build and test Web
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/web/Dockerfile
          push: false
          load: true
          tags: learninglab/web:test
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new
      
      - name: Move cache
        run: |
          rm -rf /tmp/.buildx-cache
          mv /tmp/.buildx-cache-new /tmp/.buildx-cache
      
      - name: Run tests
        run: |
          docker-compose -f docker/docker-compose.test.yml up -d
          docker-compose -f docker/docker-compose.test.yml exec -T api yarn test:ci
          docker-compose -f docker/docker-compose.test.yml exec -T web yarn test:ci
          docker-compose -f docker/docker-compose.test.yml down
  
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push API
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/api/Dockerfile
          push: true
          tags: learninglab/api:latest
      
      - name: Build and push Web
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./docker/web/Dockerfile
          push: true
          tags: learninglab/web:latest
      
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/learninglab
            docker-compose -f docker/docker-compose.prod.yml pull
            docker-compose -f docker/docker-compose.prod.yml up -d
```

### Continuous Integration

The CI pipeline includes the following steps:

1. Build Docker images
2. Run tests
3. Lint code
4. Check for security vulnerabilities
5. Check for type errors

### Continuous Deployment

The CD pipeline includes the following steps:

1. Build Docker images
2. Push Docker images to registry
3. Deploy to staging/production
4. Run database migrations
5. Verify deployment health
6. Rollback if deployment fails