#!/bin/bash

# prisma-commands.sh - Wrapper script for Prisma commands
# This script handles Prisma operations with proper schema path

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the command from the first argument
COMMAND=$1

# Check if command is provided
if [ -z "$COMMAND" ]; then
    echo -e "${RED}❌ Error: No command provided${NC}"
    echo -e "${YELLOW}Usage: $0 <command> [args...]${NC}"
    echo -e "${YELLOW}Available commands: generate, migrate, migrate-dev, reset, studio${NC}"
    exit 1
fi

# Set the schema path
SCHEMA_PATH="./apps/api/prisma/schema.prisma"

# Check if schema file exists
if [ ! -f "$SCHEMA_PATH" ]; then
    echo -e "${RED}❌ Error: Prisma schema not found at $SCHEMA_PATH${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 Running Prisma command: $COMMAND${NC}"

# Change to the API directory for Prisma commands
cd apps/api

case $COMMAND in
    "generate")
        echo -e "${YELLOW}📦 Generating Prisma client...${NC}"
        npx prisma generate
        echo -e "${GREEN}✅ Prisma client generated successfully!${NC}"
        ;;
    "migrate")
        echo -e "${YELLOW}🚀 Running Prisma migrations...${NC}"
        npx prisma migrate deploy
        echo -e "${GREEN}✅ Migrations completed successfully!${NC}"
        ;;
    "migrate-dev")
        echo -e "${YELLOW}🔧 Running Prisma dev migrations...${NC}"
        npx prisma migrate dev
        echo -e "${GREEN}✅ Dev migrations completed successfully!${NC}"
        ;;
    "reset")
        echo -e "${YELLOW}🔄 Resetting database...${NC}"
        npx prisma migrate reset --force
        echo -e "${GREEN}✅ Database reset completed successfully!${NC}"
        ;;
    "studio")
        echo -e "${YELLOW}🎨 Starting Prisma Studio...${NC}"
        npx prisma studio
        ;;
    "push")
        echo -e "${YELLOW}📤 Pushing schema to database...${NC}"
        npx prisma db push
        echo -e "${GREEN}✅ Schema pushed successfully!${NC}"
        ;;
    "seed")
        echo -e "${YELLOW}🌱 Seeding database...${NC}"
        npx prisma db seed
        echo -e "${GREEN}✅ Database seeded successfully!${NC}"
        ;;
    *)
        echo -e "${RED}❌ Error: Unknown command '$COMMAND'${NC}"
        echo -e "${YELLOW}Available commands: generate, migrate, migrate-dev, reset, studio, push, seed${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Prisma command '$COMMAND' completed successfully!${NC}"
