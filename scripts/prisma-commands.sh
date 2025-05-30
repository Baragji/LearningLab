#!/bin/bash

# Set the correct DATABASE_URL if not already set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://test:test@localhost:5432/learninglab_dev?schema=public"
fi

# Run the specified Prisma command
# Stay in root directory to access prisma/schema.prisma
SCHEMA_PATH="./prisma/schema.prisma"

case "$1" in
  "migrate")
    # For development environments - creates migrations and applies them
    npx prisma migrate dev --schema="$SCHEMA_PATH"
    ;;
  "deploy")
    # For production environments - applies existing migrations without creating new ones
    npx prisma migrate deploy --schema="$SCHEMA_PATH"
    ;;
  "reset")
    # Resets the database and applies all migrations (CAUTION: Deletes all data)
    npx prisma migrate reset --force --schema="$SCHEMA_PATH"
    ;;
  "generate")
    # Generates Prisma client
    npx prisma generate --schema="$SCHEMA_PATH"
    ;;
  "studio")
    # Opens Prisma Studio for database visualization
    # Ensure we use the DATABASE_URL from .env and not system credentials
    if [ -f .env ]; then
      export $(grep -v '^#' .env | xargs)
    fi
    echo "Starting Prisma Studio with DATABASE_URL: $DATABASE_URL"
    npx prisma studio --schema="$SCHEMA_PATH"
    ;;
  "status")
    # Checks migration status
    npx prisma migrate status --schema="$SCHEMA_PATH"
    ;;
  *)
    echo "Usage: $0 {migrate|deploy|reset|generate|studio|status}"
    echo ""
    echo "Commands:"
    echo "  migrate  - Create and apply migrations (for development)"
    echo "  deploy   - Apply existing migrations (for production)"
    echo "  reset    - Reset database and apply all migrations (CAUTION: Deletes all data)"
    echo "  generate - Generate Prisma client"
    echo "  studio   - Open Prisma Studio"
    echo "  status   - Check migration status"
    exit 1
    ;;
esac