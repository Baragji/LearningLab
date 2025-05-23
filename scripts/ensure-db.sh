#!/bin/bash

# Set script to exit on error
set -e

# Get the absolute path of the repository root directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Repository root: $REPO_ROOT"

# Check if Docker is installed and running
check_docker() {
  echo "Checking if Docker is installed and running..."

  if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker and try again."
    return 1
  fi

  if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker and try again."
    return 1
  fi

  echo "Docker is installed and running."
  return 0
}

# Check if PostgreSQL is installed locally
check_local_postgres() {
  echo "Checking if PostgreSQL is installed locally..."

  # Check for psql command
  if command -v psql &> /dev/null; then
    echo "PostgreSQL client (psql) is installed."

    # Try to connect to PostgreSQL
    if psql -h localhost -U test -d postgres -c '\l' &> /dev/null; then
      echo "Successfully connected to local PostgreSQL server."
      return 0
    else
      echo "PostgreSQL client is installed but could not connect to the server."
      echo "This could be due to:"
      echo "1. PostgreSQL server is not running"
      echo "2. Authentication failed (wrong username/password)"
      echo "3. Database 'postgres' does not exist"

      # Try to check if PostgreSQL service is running
      if command -v pg_isready &> /dev/null; then
        echo "Checking if PostgreSQL server is running..."
        pg_isready -h localhost || echo "PostgreSQL server is not running or not accessible."
      fi

      return 1
    fi
  else
    echo "PostgreSQL client (psql) is not installed."
    return 1
  fi
}

# Check if PostgreSQL container is running
check_postgres_container() {
  echo "Checking if PostgreSQL container is running..."

  if docker ps | grep -q learning-db; then
    echo "PostgreSQL container is running."
    return 0
  else
    echo "PostgreSQL container is not running."
    return 1
  fi
}

# Check if PostgreSQL is accepting connections
check_postgres_connection() {
  echo "Checking if PostgreSQL is accepting connections..."

  # Try to connect to PostgreSQL using docker exec
  if docker ps | grep -q learning-db; then
    echo "PostgreSQL container is running, checking if it's accepting connections..."

    # Try using pg_isready inside the container
    if docker exec learning-db pg_isready -h localhost -U test; then
      echo "PostgreSQL is accepting connections."
      return 0
    else
      echo "PostgreSQL container is running but not accepting connections yet."

      # Show PostgreSQL logs to help diagnose the issue
      echo "PostgreSQL logs:"
      docker logs --tail 20 learning-db

      return 1
    fi
  else
    echo "PostgreSQL container is not running, cannot check connections."
    return 1
  fi
}

# Start PostgreSQL using Docker if it's not running
start_postgres_docker() {
  echo "Starting PostgreSQL using Docker..."

  # Check if the container exists
  if docker ps -a | grep -q learning-db; then
    echo "Container learning-db exists, starting it..."
    docker start learning-db

    # Show container status
    echo "Container status:"
    docker ps | grep learning-db
  else
    echo "Container learning-db does not exist, starting with docker-compose..."
    cd "$REPO_ROOT" && docker-compose up -d postgres

    # Show container status
    echo "Container status after docker-compose:"
    docker ps | grep learning-db || echo "Container not found in docker ps output"

    # If container still doesn't exist, show docker-compose logs
    if ! docker ps -a | grep -q learning-db; then
      echo "Failed to create container. Docker-compose logs:"
      cd "$REPO_ROOT" && docker-compose logs postgres
    fi
  fi

  # Wait for PostgreSQL to be ready
  echo "Waiting for PostgreSQL to be ready..."
  for i in {1..60}; do
    if check_postgres_container; then
      echo "Container is running, checking if PostgreSQL is accepting connections..."

      # Try to connect to PostgreSQL
      if docker exec learning-db pg_isready -h localhost -U test; then
        echo "PostgreSQL is now running and accepting connections."

        # Check if the database exists
        echo "Checking if database 'learninglab_dev' exists..."
        if docker exec learning-db psql -U test -lqt | grep -q learninglab_dev; then
          echo "Database 'learninglab_dev' exists."
        else
          echo "Database 'learninglab_dev' does not exist. This might cause connection issues."
          echo "Creating database 'learninglab_dev'..."
          docker exec learning-db psql -U test -c "CREATE DATABASE learninglab_dev;"
        fi

        return 0
      fi
    fi

    echo "Waiting for PostgreSQL to start... ($i/60)"

    # Every 10 attempts, show container logs
    if [ $((i % 10)) -eq 0 ]; then
      echo "PostgreSQL container logs:"
      docker logs --tail 20 learning-db
    fi

    sleep 2
  done

  echo "Failed to start PostgreSQL within the timeout period."
  echo "PostgreSQL container logs:"
  docker logs learning-db
  return 1
}

# Main function
main() {
  echo "=== Database Initialization Script ==="
  echo "This script ensures that PostgreSQL is running and accessible."
  echo "Repository root: $REPO_ROOT"

  # Check system information
  echo "=== System Information ==="
  echo "Operating System: $(uname -s)"
  echo "User: $(whoami)"
  echo "Current directory: $(pwd)"

  # Check for local PostgreSQL installation first
  echo "=== Local PostgreSQL Check ==="
  local_postgres_available=false
  if check_local_postgres; then
    echo "Local PostgreSQL is available. Checking if it has the required database..."

    # Check if the required database exists
    if psql -h localhost -U test -lqt | grep -q learninglab_dev; then
      echo "Database 'learninglab_dev' exists in local PostgreSQL."
      echo "You can use local PostgreSQL instead of Docker."
      echo "Make sure your DATABASE_URL in .env is set to: postgresql://test:test@localhost:5432/learninglab_dev?schema=public"
      local_postgres_available=true
    else
      echo "Database 'learninglab_dev' does not exist in local PostgreSQL."
      echo "Creating database 'learninglab_dev'..."
      if psql -h localhost -U test -c "CREATE DATABASE learninglab_dev;" postgres; then
        echo "Successfully created database 'learninglab_dev'."
        local_postgres_available=true
      else
        echo "Failed to create database 'learninglab_dev'. Will try Docker instead."
      fi
    fi
  else
    echo "Local PostgreSQL is not available or not properly configured."
  fi

  # If local PostgreSQL is available and properly configured, we can exit successfully
  if [ "$local_postgres_available" = true ]; then
    echo "=== Using Local PostgreSQL ==="
    echo "Local PostgreSQL is running and has the required database."
    echo "Make sure your DATABASE_URL in .env is set to: postgresql://test:test@localhost:5432/learninglab_dev?schema=public"

    # Check if Prisma migrations have been applied
    echo "Checking if Prisma migrations directory exists..."
    if [ -d "$REPO_ROOT/apps/api/prisma/migrations" ]; then
      echo "Migrations directory exists. You may need to run migrations with: yarn prisma:migrate:dev"
    else
      echo "WARNING: Migrations directory does not exist. You may need to initialize Prisma with: yarn prisma:migrate:dev"
    fi

    echo "=== Database is ready for use ==="
    exit 0
  fi

  # If we get here, we need to try Docker
  echo "=== Docker Check ==="
  if ! check_docker; then
    echo "ERROR: Docker is required but not available, and local PostgreSQL is not properly configured."
    echo "Please either:"
    echo "1. Install and start Docker, or"
    echo "2. Install and configure PostgreSQL locally with:"
    echo "   - Username: test"
    echo "   - Password: test"
    echo "   - Database: learninglab_dev"
    exit 1
  fi

  # Check Docker version and info
  echo "Docker version: $(docker --version)"
  echo "Docker compose version: $(docker-compose --version || echo 'Docker Compose not found')"

  # List running containers
  echo "=== Running Containers ==="
  docker ps || echo "Failed to list running containers"

  # Check if PostgreSQL container is running
  echo "=== PostgreSQL Container Check ==="
  if ! check_postgres_container; then
    echo "PostgreSQL container is not running. Attempting to start it..."

    # Check if there are any port conflicts
    echo "Checking for port conflicts on 5432..."
    if command -v lsof &> /dev/null; then
      if lsof -i :5432 | grep -v 'docker'; then
        echo "WARNING: Port 5432 is already in use by a non-Docker process."
        echo "This might cause conflicts with the Docker container."
      else
        echo "No port conflicts detected."
      fi
    else
      echo "lsof command not found, cannot check port usage"
    fi

    # Try to start PostgreSQL using Docker
    if ! start_postgres_docker; then
      echo "ERROR: Failed to start PostgreSQL. Please start it manually."
      echo "You can start it with: cd $REPO_ROOT && docker-compose up -d postgres"
      exit 1
    fi
  fi

  # Verify PostgreSQL is accepting connections
  echo "=== Connection Verification ==="
  for i in {1..30}; do
    echo "Attempt $i/30: Checking if PostgreSQL is accepting connections..."
    if docker exec learning-db pg_isready -h localhost -U test; then
      echo "SUCCESS: PostgreSQL is running and ready for connections."

      # Check database existence
      echo "Checking database 'learninglab_dev'..."
      if docker exec learning-db psql -U test -lqt | grep -q learninglab_dev; then
        echo "Database 'learninglab_dev' exists."
      else
        echo "WARNING: Database 'learninglab_dev' does not exist. This might cause connection issues."
        echo "Creating database 'learninglab_dev'..."
        docker exec learning-db psql -U test -c "CREATE DATABASE learninglab_dev;" postgres
      fi

      # Check if Prisma migrations have been applied
      echo "Checking if Prisma migrations directory exists..."
      if [ -d "$REPO_ROOT/apps/api/prisma/migrations" ]; then
        echo "Migrations directory exists. You may need to run migrations with: yarn prisma:migrate:dev"
      else
        echo "WARNING: Migrations directory does not exist. You may need to initialize Prisma with: yarn prisma:migrate:dev"
      fi

      echo "=== Database is ready for use ==="
      echo "Make sure your DATABASE_URL in .env is set to: postgresql://test:test@localhost:5432/learninglab_dev?schema=public"
      exit 0
    fi
    echo "Waiting for PostgreSQL to accept connections... ($i/30)"
    sleep 1
  done

  echo "ERROR: PostgreSQL container is running but not accepting connections within the timeout period."
  echo "Please check the PostgreSQL logs with: docker logs learning-db"

  # Show container details
  echo "=== Container Details ==="
  docker inspect learning-db || echo "Failed to inspect container"

  exit 1
}

# Run the main function
main
