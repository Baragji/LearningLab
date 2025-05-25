# Deployment Documentation

This directory contains comprehensive documentation for deploying and managing the LearningLab application across different environments.

## Available Guides

### Environment-Specific Deployment
- [Environment-Specific Deployment Guide](./environment-deployment-guide.md) - Detailed instructions for deploying to development, staging, and production environments

### CI/CD Pipeline
- [CI/CD Secrets and Environment Variables Guide](./ci-cd-secrets-guide.md) - Comprehensive guide to managing secrets and environment variables in the CI/CD pipeline
- [CI/CD Troubleshooting Guide](./ci-cd-troubleshooting-guide.md) - Solutions for common issues encountered during CI/CD processes and deployments

### Deployment Alignment
- [Deployment Alignment Guide](./deployment-alignment-guide.md) - Ensuring consistency between Docker-based deployments and cloud-based deployments

## Additional Resources

- [Docker Deployment Guide](../docker-deployment-guide.md) - Step-by-step instructions for deploying using Docker
- [GitHub Actions Workflows](../../.github/workflows) - CI/CD workflow configurations

## Quick Reference

### Key Deployment Commands

#### Local Development
```bash
# Start API and Web in development mode
yarn dev

# Start only API
yarn workspace api dev

# Start only Web
yarn workspace web dev
```

#### Docker Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### Database Management
```bash
# Run migrations
yarn prisma:migrate

# Generate Prisma client
yarn prisma:generate

# Seed the database
yarn seed
```

### Deployment Checklist

Before deploying to any environment, ensure:

1. All tests pass locally and in CI
2. All required environment variables are configured
3. Database migrations are prepared
4. Build process completes successfully
5. Application starts without errors