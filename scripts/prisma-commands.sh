#!/bin/bash

# Set the correct DATABASE_URL
export DATABASE_URL="postgresql://test:test@localhost:5432/learninglab_dev?schema=public"

# Run the specified Prisma command
cd apps/api

case "$1" in
  "migrate")
    npx prisma migrate dev
    ;;
  "generate")
    npx prisma generate
    ;;
  "studio")
    npx prisma studio
    ;;
  *)
    echo "Usage: $0 {migrate|generate|studio}"
    exit 1
    ;;
esac