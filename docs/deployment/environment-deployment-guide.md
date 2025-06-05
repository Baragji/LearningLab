# Environment-Specific Deployment Guide

This guide provides detailed instructions for deploying the LearningLab application to different environments (development, staging, and production).

## Common Prerequisites

- Access to the GitHub repository
- Appropriate access credentials for Render and Vercel
- Required environment variables and secrets

## Development Environment

### API Deployment (Local)

1. Set up the local environment:

   ```bash
   cd /path/to/LearningLab
   cp apps/api/.env.example apps/api/.env
   ```

2. Configure the development environment variables:

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learninglab_dev
   JWT_SECRET=dev_jwt_secret
   JWT_EXPIRES_IN=15m
   SALT_ROUNDS=10
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

### Web Deployment (Local)

1. Set up the local environment:

   ```bash
   cd /path/to/LearningLab
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Configure the development environment variables:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

## Staging Environment

### API Deployment (Render)

1. Create a new Web Service in Render:

   - Connect to your GitHub repository
   - Select the branch for staging (e.g., `staging` or `develop`)
   - Set the build command: `cd ../.. && yarn install && yarn workspace api build`
   - Set the start command: `cd ../.. && yarn workspace api start:prod`
   - Set the root directory: `apps/api`

2. Configure the following environment variables in Render:

   ```
   DATABASE_URL=<staging-database-connection-string>
   JWT_SECRET=<staging-jwt-secret>
   JWT_EXPIRES_IN=15m
   SALT_ROUNDS=10
   NODE_ENV=staging
   ```

3. Deploy the service and note the URL for configuring the web application.

### Web Deployment (Vercel)

1. Create a new project in Vercel:

   - Connect to your GitHub repository
   - Select the branch for staging (e.g., `staging` or `develop`)
   - Set the framework preset to Next.js
   - Set the root directory to `apps/web`

2. Configure the following environment variables in Vercel:

   ```
   NEXT_PUBLIC_API_URL=<staging-api-url>/api
   ```

3. Deploy the project.

## Production Environment

### API Deployment (Render)

1. Create a new Web Service in Render (or use the same service with production branch):

   - Connect to your GitHub repository
   - Select the main branch
   - Set the build command: `cd ../.. && yarn install && yarn workspace api build`
   - Set the start command: `cd ../.. && yarn workspace api start:prod`
   - Set the root directory: `apps/api`

2. Configure the following environment variables in Render:

   ```
   DATABASE_URL=<production-database-connection-string>
   JWT_SECRET=<production-jwt-secret>
   JWT_EXPIRES_IN=15m
   SALT_ROUNDS=10
   NODE_ENV=production
   ```

3. Set up auto-deployment from the main branch.

### Web Deployment (Vercel)

1. Create a new project in Vercel (or use the same project with production settings):

   - Connect to your GitHub repository
   - Select the main branch
   - Set the framework preset to Next.js
   - Set the root directory to `apps/web`

2. Configure the following environment variables in Vercel:

   ```
   NEXT_PUBLIC_API_URL=<production-api-url>/api
   ```

3. Set up auto-deployment from the main branch.

## Docker Deployment (Alternative for All Environments)

For all environments, you can also use Docker as described in the Docker Deployment Guide. Adjust the environment variables in the `.env` file or docker-compose.yml for each environment.

## Environment-Specific Considerations

### Development

- Use local database or Docker container
- Enable detailed logging and debugging
- Use shorter JWT expiration times for testing

### Staging

- Use a separate database from production
- Mirror production configuration as closely as possible
- Enable more detailed logging than production

### Production

- Use secure, managed database service
- Implement proper secrets management
- Enable minimal necessary logging
- Set up monitoring and alerting
- Configure regular database backups
