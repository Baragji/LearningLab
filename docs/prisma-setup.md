# Prisma Setup Guide

## Struktur

Dette projekt bruger en centraliseret Prisma setup:

- **Schema fil**: `/prisma/schema.prisma` (rod-mappen)
- **Migrationer**: `/prisma/migrations/`
- **Prisma Client**: Genereres i hver app's `node_modules`

## Vigtige kommandoer

### Fra rod-mappen:
```bash
# Kør migrationer
npx prisma migrate dev

# Åbn Prisma Studio
npx prisma studio

# Generer Prisma Client
npx prisma generate
```

### Fra API-mappen (`/apps/api`):
```bash
# Alle Prisma kommandoer peger automatisk til rod-schema
yarn prisma:generate
yarn prisma:studio
yarn prisma:migrate:dev
```

## Fejlfinding

### "Unable to process count query" fejl i Prisma Studio
Dette sker typisk når:
1. Schema filen ikke matcher databasen
2. Prisma Client ikke er regenereret efter schema ændringer

**Løsning:**
```bash
cd apps/api
yarn prisma:generate
```

### Type fejl efter schema ændringer
Efter ændringer i schema filen, skal du:
1. Køre migrationer: `npx prisma migrate dev`
2. Regenerere client i alle apps:
   ```bash
   cd apps/api && yarn prisma:generate
   cd ../web && yarn prisma:generate
   ```

## Best Practices

1. **Brug altid rod-mappens schema fil** - undgå duplikerede schemas
2. **Regenerer Prisma Client** efter hver schema ændring
3. **Kør migrationer fra rod-mappen** for at sikre konsistens
4. **Test lokalt** før deployment med `prisma migrate deploy --dry-run`