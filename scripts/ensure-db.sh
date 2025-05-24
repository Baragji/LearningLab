#!/bin/bash

# Set script to exit on error
set -e

# Get the absolute path of the repository root directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Repository root: $REPO_ROOT"

# Database configuration
DB_NAME="learninglab_dev"
DB_USER="test"
DB_PASS="test"
DB_PORT="5432"
DB_HOST="localhost"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Main function
main() {
  echo "=== Database Initialization Script ==="
  echo "This script ensures that PostgreSQL is running and accessible."

  # Check if Docker is installed and running
  if ! command -v docker &> /dev/null || ! docker info &> /dev/null; then
    echo "Docker is not installed or not running. Please install and start Docker."
    exit 1
  fi
  
  echo "Docker is installed and running."
  
  # Check if PostgreSQL container is running
  if ! docker ps | grep -q learning-db; then
    echo "PostgreSQL container is not running. Starting it..."
    
    # Check if container exists but is stopped
    if docker ps -a | grep -q learning-db; then
      docker start learning-db
    else
      # Start new container with docker-compose
      cd "$REPO_ROOT" && docker-compose up -d postgres
    fi
    
    # Wait for container to be ready
    echo "Waiting for PostgreSQL to start..."
    sleep 5
  else
    echo "PostgreSQL container is already running."
  fi
  
  # Check if PostgreSQL is accepting connections
  echo "Checking if PostgreSQL is accepting connections..."
  for i in {1..10}; do
    if docker exec learning-db pg_isready -h localhost -U test; then
      echo "PostgreSQL is accepting connections."
      break
    fi
    
    if [ $i -eq 10 ]; then
      echo "ERROR: PostgreSQL is not accepting connections after 10 attempts."
      echo "Check logs with: docker logs learning-db"
      exit 1
    fi
    
    echo "Waiting for PostgreSQL to be ready... (attempt $i/10)"
    sleep 2
  done
  
  # Check if database exists, create if not
  echo "Checking if database '$DB_NAME' exists..."
  if ! docker exec learning-db psql -U test -lqt | grep -q $DB_NAME; then
    echo "Creating database '$DB_NAME'..."
    docker exec learning-db psql -U test -c "CREATE DATABASE $DB_NAME;" postgres
  else
    echo "Database '$DB_NAME' already exists."
  fi
  
  echo "=== Database is ready for use ==="
  echo "DATABASE_URL: $DB_URL"
  
  # Remind about migrations if needed
  if [ -d "$REPO_ROOT/apps/api/prisma/migrations" ]; then
    echo "Migrations directory exists. You may need to run: yarn prisma:migrate:dev"
  else
    echo "No migrations directory found. You may need to initialize Prisma."
  fi
  
  exit 0
}

# Run the main function
main
