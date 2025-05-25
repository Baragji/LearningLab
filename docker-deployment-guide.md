# Docker Deployment Guide for LearningLab

This guide provides step-by-step instructions for deploying the LearningLab application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git repository cloned locally
- Basic understanding of Docker concepts

## Environment Setup

1. Create environment variables file:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and set the required environment variables:

   ```
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_REFRESH_EXPIRES_IN=7d
   SALT_ROUNDS=10
   ```

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