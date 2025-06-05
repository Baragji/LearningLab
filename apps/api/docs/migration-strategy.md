# Database Migrationsstrategi for LearningLab

Dette dokument beskriver den officielle strategi for håndtering af databasemigrationer i LearningLab-projektet ved hjælp af Prisma ORM.

## Oversigt

LearningLab bruger Prisma ORM til databaseinteraktion og -migrationer. Vores migrationsstrategi er designet til at sikre:

1. **Konsistens** på tværs af udviklingsmiljøer
2. **Sikkerhed** ved produktionsdeployments
3. **Sporbarhed** af databaseændringer
4. **Robusthed** mod fejl under migrationsprocessen

## Migrationskommandoer

Vi har standardiseret følgende kommandoer til håndtering af migrationer i forskellige miljøer:

### Udviklingsmiljø

I udviklingsmiljøer bruges `prisma migrate dev` til at oprette og anvende migrationer:

```bash
# Fra projektets rod
./scripts/prisma-commands.sh migrate

# Eller direkte fra apps/api-mappen
cd apps/api
npx prisma migrate dev
```

Dette vil:

- Sammenligne den aktuelle databasetilstand med Prisma-skemaet
- Generere en ny migrationsfil, hvis der er ændringer
- Anvende migrationen på databasen
- Regenerere Prisma-klienten

### Produktionsmiljø

I produktionsmiljøer bruges `prisma migrate deploy` til at anvende eksisterende migrationer:

```bash
# Fra projektets rod
./scripts/prisma-commands.sh deploy

# Eller direkte fra apps/api-mappen
cd apps/api
npx prisma migrate deploy
```

Dette vil:

- Anvende alle migrationer, der endnu ikke er anvendt på databasen
- Ikke generere nye migrationsfiler
- Køre i en sikker, ikke-interaktiv tilstand

### CI/CD Pipeline

I vores CI/CD pipeline (f.eks. i Render.yaml) er migrationskommandoen inkluderet som en del af byggeprocessen:

```yaml
buildCommand: |
  # ... andre byggekommandoer ...
  yarn workspace api prisma generate
  yarn workspace api prisma migrate deploy
```

## Bedste praksis for migrationer

### 1. Oprettelse af migrationer

- Opret altid migrationer i et udviklingsmiljø, aldrig direkte i produktion
- Giv migrationer beskrivende navne, der forklarer formålet:
  ```bash
  npx prisma migrate dev --name add_user_preferences_table
  ```
- Commit migrationsfiler til versionskontrol sammen med skemaændringer

### 2. Test af migrationer

- Test migrationer på en kopi af produktionsdatabasen, hvis muligt
- Brug `prisma migrate status` til at verificere migrationsstatus:
  ```bash
  ./scripts/prisma-commands.sh status
  ```

### 3. Deployment af migrationer

- Kør altid migrationer før deployment af applikationskode
- Brug `prisma migrate deploy` i produktionsmiljøer
- Overvej at tage backup af databasen før migrationer i produktion

### 4. Håndtering af fejl

- Hvis en migration fejler i produktion:
  1. Undersøg fejlen i logfiler
  2. Fix problemet i udviklingsmiljøet
  3. Opret en ny migration, der løser problemet
  4. Deploy den nye migration

## Specielle scenarier

### Nulstilling af database (kun udvikling)

For at nulstille databasen i udviklingsmiljøet:

```bash
./scripts/prisma-commands.sh reset
```

**ADVARSEL**: Dette sletter alle data i databasen og genanvender alle migrationer. Brug aldrig i produktion!

### Seeding af data

For at seede databasen med testdata:

```bash
cd apps/api
npx prisma db seed
```

Dette kører seed-scriptet defineret i `package.json` (typisk `prisma/seed.ts`).

## Migrationsarkitektur

### Migrationsfiler

Migrationsfiler gemmes i `apps/api/prisma/migrations/` og har følgende struktur:

```
migrations/
  ├── 20230101000000_initial_migration/
  │   ├── migration.sql
  │   └── README.md (optional)
  ├── 20230102000000_add_user_preferences/
  │   └── migration.sql
  └── ...
```

Hver migrationsfil indeholder SQL-kommandoer, der skal køres for at opdatere databaseskemaet.

### Migrationstabel

Prisma holder styr på anvendte migrationer i en tabel kaldet `_prisma_migrations` i databasen. Denne tabel bør aldrig ændres manuelt.

## Konklusion

Ved at følge denne migrationsstrategi sikrer vi, at databaseændringer er konsistente, sporbare og sikre på tværs af alle miljøer i LearningLab-projektet.
