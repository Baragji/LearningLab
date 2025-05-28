# Docker Deployment Guide for LearningLab

This guide provides step-by-step instructions for deploying the LearningLab application using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned
- Environment variables configured (see `.env.docker` template)
- Node.js 22+ (for local development)

## Environment Setup

1. Copy the Docker environment template:
```bash
cp .env.docker .env
```

2. Edit the `.env` file with your specific values:
```bash
# REQUIRED: JWT Configuration (generate secure 32+ character secrets)
JWT_SECRET="your-super-secret-jwt-key-here-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"
SALT_ROUNDS=12

# OPTIONAL: Social Authentication
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Application Configuration
FRONTEND_URL="http://localhost:80"
CACHE_TTL=60
CACHE_MAX_ITEMS=100
THROTTLE_TTL=60000
THROTTLE_LIMIT=10

# Next.js Public Variables
NEXT_PUBLIC_APP_NAME="LearningLab"
NEXT_PUBLIC_WS_URL="ws://localhost:80/ws"
NEXT_PUBLIC_ENABLE_NEW_FEATURES=false
```

**Important Security Notes:**
- Generate secure JWT secrets (minimum 32 characters)
- Never commit real secrets to version control
- Use strong, unique passwords for production

## Quick Start

1. **Set up environment variables:**
```bash
cp .env.docker .env
# Edit .env with your actual values (see Environment Setup section)
```

2. **Build and start all services:**
```bash
docker-compose up --build
```

3. **Run database migrations (in a new terminal):**
```bash
docker-compose exec api npx prisma migrate deploy
```

4. **Generate Prisma client (if needed):**
```bash
docker-compose exec api npx prisma generate
```

5. **Access the application:**
- Frontend: http://localhost:80
- API: http://localhost:80/api
- API Documentation: http://localhost:80/api/docs
- Database: localhost:5432 (postgres/test/test)

## Deployment Steps

### 1. Build and Start the Services

Run the following command to build and start all services (database, API, web application, and Nginx):

```bash
docker-compose up -d
```

This command will:
- Build the Docker images for the API and web application
- Pull the PostgreSQL and Nginx images
- Create and start all containers
- Set up the network between containers

### 2. Verify Deployment

Check if all containers are running:

```bash
docker-compose ps
```

You should see four containers running:
- learning-db (PostgreSQL database)
- learning-api (NestJS API)
- learning-web (NextJS web application)
- learning-nginx (Nginx reverse proxy)

### 3. Access the Application

Once all services are running, you can access the application:

- Web Application: http://localhost
- API (through Nginx): http://localhost/api
- Direct API access: http://localhost:3000 (if needed for debugging)

### 4. View Logs

To view logs from all services:

```bash
docker-compose logs -f
```

To view logs from a specific service:

```bash
docker-compose logs -f [service_name]
```

Replace `[service_name]` with one of: `postgres`, `api`, `web`, or `nginx`.

### 5. Database Management

To run database migrations:

```bash
docker-compose exec api yarn prisma:migrate
```

To seed the database:

```bash
docker-compose exec api yarn seed
```

To access Prisma Studio (database management UI):

```bash
docker-compose exec api yarn prisma:studio
```

Then access Prisma Studio at: http://localhost:5555

## Stopping the Services

To stop all services while preserving data:

```bash
docker-compose down
```

To stop all services and remove volumes (will delete database data):

```bash
docker-compose down -v
```

## Troubleshooting

### Common Issues

1. **Environment variable errors:**
   - Ensure `.env` file exists and contains all required variables
   - Check for missing JWT secrets (minimum 32 characters)
   - Verify social auth credentials if using OAuth

2. **Port conflicts:**
   - Check if ports 80, 3000, 3001, or 5432 are already in use
   - Stop conflicting services: `sudo lsof -i :80` and `kill -9 <PID>`
   - Change ports in docker-compose.yml if needed

3. **Database connection issues:**
   - Ensure PostgreSQL container is running: `docker-compose ps`
   - Check DATABASE_URL format: `postgresql://test:test@postgres:5432/learninglab_dev?schema=public`
   - Verify network connectivity: `docker-compose exec api ping postgres`

4. **Prisma issues:**
   - Run migrations: `docker-compose exec api npx prisma migrate deploy`
   - Generate client: `docker-compose exec api npx prisma generate`
   - Reset database: `docker-compose exec api npx prisma migrate reset`

5. **Next.js build failures:**
   - Ensure standalone output is configured in next.config.js
   - Check for missing public environment variables
   - Clear build cache: `docker-compose build --no-cache web`

6. **Build failures:**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild without cache: `docker-compose build --no-cache`
   - Check Docker disk space: `docker system df`

7. **Permission issues:**
   - Ensure Docker has proper permissions
   - Check file ownership in mounted volumes
   - On macOS: ensure Docker Desktop has file access permissions

### Connection Issues

If the web application cannot connect to the API:

1. Check if all containers are running:
   ```bash
   docker-compose ps
   ```

2. Check the API logs for errors:
   ```bash
   docker-compose logs api
   ```

3. Verify the Nginx configuration:
   ```bash
   docker-compose exec nginx nginx -t
   ```

### Database Issues

If there are database connection issues:

1. Check if the database container is running:
   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify the database connection string in the API environment variables.

## Updating the Application

To update the application after code changes:

1. Rebuild the images:
   ```bash
   docker-compose build
   ```

2. Restart the services:
   ```bash
   docker-compose up -d
   ```

## Production Deployment Considerations

For production deployments, consider the following additional steps:

1. Use proper secrets management instead of environment variables in files
2. Set up SSL/TLS certificates for HTTPS
3. Configure proper logging and monitoring
4. Set up database backups
5. Use a container orchestration system like Kubernetes for larger deployments