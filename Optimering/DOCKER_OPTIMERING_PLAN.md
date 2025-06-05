# 🐳 DOCKER OPTIMERING & BEST PRACTICE PLAN

## 📊 NUVÆRENDE DOCKER SITUATION

### Eksisterende Setup
- **docker-compose.yml**: Grundlæggende multi-service setup
- **Dockerfile.api**: Multi-stage build med Node.js 22
- **Dockerfile.web**: Multi-stage build med Next.js standalone
- **nginx**: Reverse proxy konfiguration

### Identificerede Problemer
1. **Image størrelse**: Ikke optimeret for minimal størrelse
2. **Security**: Manglende security best practices
3. **Performance**: Ikke optimeret build cache
4. **Monitoring**: Manglende health checks
5. **Development**: Ingen development-specific setup
6. **Secrets**: Hardcoded credentials i compose file

## 🎯 OPTIMERINGSMÅL

### Performance
- Reducer image størrelse med 40%+
- Forbedre build tid med 50%+
- Optimere startup tid
- Implementere effektiv caching

### Security
- Non-root users
- Minimal base images
- Secret management
- Network isolation
- Security scanning

### Reliability
- Health checks
- Graceful shutdown
- Resource limits
- Restart policies

### Developer Experience
- Development compose setup
- Hot reload support
- Debug capabilities
- Log aggregation

## 🔧 OPTIMERET DOCKER ARKITEKTUR

### Ny Folder Struktur
```
docker/
├── api/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── .dockerignore
├── web/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── .dockerignore
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── nginx.dev.conf
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .env.example
```

## 📋 DETALJERET IMPLEMENTERING

### Fase 1: Optimeret API Dockerfile

#### docker/api/Dockerfile
```dockerfile
# Multi-stage build for optimal size and security
FROM node:20-alpine AS base
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

#### docker/api/.dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.development
.env.test
.env.production
.nyc_output
coverage
.turbo
dist
build
.next
.cache
*.log
```

### Fase 2: Optimeret Web Dockerfile

#### docker/web/Dockerfile
```dockerfile
FROM node:20-alpine AS base
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

### Fase 3: Optimeret Nginx Setup

#### docker/nginx/Dockerfile
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

#### docker/nginx/nginx.conf
```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

    upstream api {
        server api:3001;
        keepalive 32;
    }

    upstream web {
        server web:3001;
        keepalive 32;
    }

    server {
        listen 8080;
        server_name _;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Web application
        location / {
            limit_req zone=web burst=50 nodelay;
            
            proxy_pass http://web/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
}
```

### Fase 4: Production Docker Compose

#### docker-compose.prod.yml
```yaml
version: '3.8'

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
      test: ["CMD-SHELL", "pg_isready -U $$(cat /run/secrets/postgres_user) -d learninglab_prod"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

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
          cpus: '0.25'

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
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'

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
      - NEXT_PUBLIC_API_URL=https://yourdomain.com/api
    env_file:
      - .env.prod
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  nginx:
    build:
      context: docker/nginx
      dockerfile: Dockerfile
    image: learninglab/nginx:latest
    container_name: learning-nginx
    ports:
      - "80:8080"
      - "443:8443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      api:
        condition: service_healthy
      web:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.25'

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true

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

### Fase 5: Development Docker Compose

#### docker-compose.dev.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: learning-db-dev
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: learninglab_dev
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - dev-network

  redis:
    image: redis:7-alpine
    container_name: learning-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    networks:
      - dev-network

  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile.dev
    container_name: learning-api-dev
    ports:
      - "3001:3001"
      - "9229:9229"  # Debug port
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev:dev@postgres:5432/learninglab_dev?schema=public
    volumes:
      - .:/app
      - /app/node_modules
      - /app/apps/api/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - dev-network
    command: yarn workspace api dev:debug

  web:
    build:
      context: .
      dockerfile: docker/web/Dockerfile.dev
    container_name: learning-web-dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - .:/app
      - /app/node_modules
      - /app/apps/web/node_modules
      - /app/apps/web/.next
    depends_on:
      - api
    networks:
      - dev-network
    command: yarn workspace web dev

networks:
  dev-network:
    driver: bridge

volumes:
  postgres_dev_data:
  redis_dev_data:
```

## 🔒 SECURITY ENHANCEMENTS

### Secret Management
```bash
# Opret secrets directory
mkdir -p secrets

# Generer sikre passwords
openssl rand -base64 32 > secrets/postgres_password.txt
openssl rand -base64 32 > secrets/redis_password.txt
openssl rand -base64 64 > secrets/jwt_secret.txt
echo "learninglab_user" > secrets/postgres_user.txt

# Sæt korrekte permissions
chmod 600 secrets/*
```

### SSL/TLS Setup
```bash
# Generer self-signed certificates for development
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx-selfsigned.key \
  -out ssl/nginx-selfsigned.crt \
  -subj "/C=DK/ST=Denmark/L=Copenhagen/O=LearningLab/CN=localhost"
```

## 📊 MONITORING & LOGGING

### Prometheus & Grafana Setup
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD_FILE=/run/secrets/grafana_admin_password
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    secrets:
      - grafana_admin_password
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge

secrets:
  grafana_admin_password:
    file: ./secrets/grafana_admin_password.txt
```

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation
- [ ] Backup nuværende Docker setup
- [ ] Test nuværende functionality
- [ ] Setup development environment
- [ ] Create secrets directory

### Phase 1: Dockerfile Optimization
- [ ] Create optimized API Dockerfile
- [ ] Create optimized Web Dockerfile
- [ ] Create optimized Nginx Dockerfile
- [ ] Add proper .dockerignore files
- [ ] Test individual builds

### Phase 2: Compose Files
- [ ] Create production compose file
- [ ] Create development compose file
- [ ] Create monitoring compose file
- [ ] Setup secret management
- [ ] Configure networks

### Phase 3: Security
- [ ] Implement non-root users
- [ ] Setup SSL certificates
- [ ] Configure security headers
- [ ] Implement rate limiting
- [ ] Security scanning

### Phase 4: Monitoring
- [ ] Setup health checks
- [ ] Configure Prometheus
- [ ] Setup Grafana dashboards
- [ ] Implement log aggregation
- [ ] Performance monitoring

### Phase 5: Testing
- [ ] Test development environment
- [ ] Test production environment
- [ ] Load testing
- [ ] Security testing
- [ ] Disaster recovery testing

## 🚀 SUCCESS METRICS

### Performance
- [ ] Image size reduction 40%+
- [ ] Build time improvement 50%+
- [ ] Startup time < 30 seconds
- [ ] Memory usage optimized

### Security
- [ ] No security vulnerabilities
- [ ] Non-root containers
- [ ] Encrypted secrets
- [ ] Network isolation

### Reliability
- [ ] 99.9% uptime
- [ ] Graceful shutdowns
- [ ] Health checks working
- [ ] Auto-restart on failure

### Developer Experience
- [ ] Hot reload working
- [ ] Debug capabilities
- [ ] Easy setup process
- [ ] Clear documentation

---

*Denne plan sikrer en professionel, sikker og optimeret Docker setup med best practices.*