#!/bin/bash

# Script til at tjekke om Prisma setup er synkroniseret

echo "🔍 Tjekker Prisma setup..."

# Tjek om der er flere schema filer (ignorer node_modules, .yarn og .prisma mapper)
REAL_SCHEMAS=$(find . -name "schema.prisma" -not -path "./node_modules/*" -not -path "./.yarn/*" -not -path "*/.prisma/*" | while read file; do
    # Check if it's not a placeholder file
    if ! grep -q "This file has been moved" "$file" 2>/dev/null; then
        echo "$file"
    fi
done)

SCHEMA_COUNT=$(echo "$REAL_SCHEMAS" | grep -v "^$" | wc -l)

if [ $SCHEMA_COUNT -gt 1 ]; then
    echo "❌ ADVARSEL: Fandt flere aktive schema.prisma filer:"
    echo "$REAL_SCHEMAS"
    echo "   Brug kun /prisma/schema.prisma"
    exit 1
fi

echo "✅ Kun én aktiv schema fil fundet"

# Tjek om migrationer er up-to-date
echo "📊 Tjekker migration status..."
npx prisma migrate status

# Tjek om Prisma Client skal regenereres
echo "🔧 Regenererer Prisma Client..."
npx prisma generate

echo "✅ Prisma setup tjek færdig!"