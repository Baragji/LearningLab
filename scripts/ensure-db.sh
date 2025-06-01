#!/bin/bash

# ensure-db.sh - Ensures database is running and accessible
# This script checks if the database is available and starts it if needed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking database availability...${NC}"

# Check if we're using Docker Compose
if [ -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}📦 Docker Compose detected, checking database container...${NC}"
    
    # Check if database container is running
    if docker-compose ps postgres | grep -q "Up"; then
        echo -e "${GREEN}✅ Database container is running${NC}"
    else
        echo -e "${YELLOW}🚀 Starting database container...${NC}"
        docker-compose up -d postgres
        
        # Wait for database to be ready
        echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
        sleep 5
        
        # Check if database is accessible
        for i in {1..30}; do
            if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Database is ready!${NC}"
                break
            fi
            echo -e "${YELLOW}⏳ Waiting for database... (${i}/30)${NC}"
            sleep 2
        done
    fi
else
    echo -e "${YELLOW}🔍 No Docker Compose found, assuming local database setup${NC}"
    
    # Check if PostgreSQL is running locally
    if command -v pg_isready > /dev/null 2>&1; then
        if pg_isready > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Local PostgreSQL is running${NC}"
        else
            echo -e "${RED}❌ PostgreSQL is not running locally${NC}"
            echo -e "${YELLOW}💡 Please start PostgreSQL or use Docker Compose${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  pg_isready not found, skipping database check${NC}"
        echo -e "${YELLOW}💡 Make sure your database is running before proceeding${NC}"
    fi
fi

echo -e "${GREEN}✅ Database check completed successfully!${NC}"
