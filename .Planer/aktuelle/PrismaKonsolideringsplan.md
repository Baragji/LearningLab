## Plan for Konsolidering af Prisma Skema til Ét Rod-Skema

Denne plan beskriver de nødvendige skridt for at konsolidere projektets Prisma-opsætning til at bruge ét enkelt skema placeret i rodmappen (`/prisma/schema.prisma`). Dette er baseret på indholdet fra `Prismaopdatering.txt`.

### Fase 1: Forberedelse og Verifikation af Rod-Skemaet

1.  **Verificér og Færdiggør Rod-Skemaet (`/prisma/schema.prisma`):**
    - Åbn filen `/prisma/schema.prisma` i projektets rodmappe.
    - **Sikr dig, at denne fil er den absolut komplette og korrekte version af dit databaseskema.** Den skal indeholde ALLE modeller (inklusive `User`, `EducationProgram`, `Course`, `Topic`, `Lesson`, `ContentBlock`, `Quiz`, `Question`, `AnswerOption`, `UserQuizAttempt`, `UserAnswer`, `Certificate`, `QuestionBank`, `QuestionBankItem`, `UserGroup`) og alle nødvendige enums (`Role`, `FagCategory`, `QuestionType`, `ProgressStatus`, `Difficulty`, `CourseStatus` osv.).
    - Hvis der mangler noget i `/prisma/schema.prisma` i forhold til de seneste datamodel-beslutninger (f.eks. fra `Målsætning.md` eller de nyeste migrationer, der var baseret på dette skema), skal det tilføjes nu.

### Fase 2: Opdatering af API-konfiguration (`apps/api`)

1.  **Erstat Schema i API-mappen (`/apps/api/prisma/schema.prisma`):**

    - Gør filen `/apps/api/prisma/schema.prisma` til en placeholder-fil. Dette anbefales for at undgå, at værktøjer utilsigtet genskaber den.
    - Placeholder-indhold for `/apps/api/prisma/schema.prisma`:
      ```prisma
      // This file is a placeholder.
      // The canonical Prisma schema is located at /prisma/schema.prisma
      // API scripts should point to that schema using --schema=../../prisma/schema.prisma
      ```

2.  **Opdatér `apps/api/package.json` Scripts:**
    - Gennemgå alle `prisma:*` scripts i `/apps/api/package.json` (inklusive `prisma:generate`, `prisma:migrate:dev`, `prisma:deploy`, `prisma:studio`, `seed`, osv.).
    - Sørg for, at **hver eneste af disse scripts eksplicit bruger `--schema=../../prisma/schema.prisma` flaget** til at pege på rod-skemaet.

### Fase 3: Oprydning og Regenerering

1.  **Ryd Op:**

    - Stop alle kørende dev-servere.
    - Slet `node_modules/.prisma/client` og `node_modules/@prisma/client` mapperne inde i `apps/api/` (hvis de eksisterer der).

2.  **Regenerer Prisma Client for API'en:**
    - Kør kommandoen `yarn workspace api prisma:generate` (eller den fulde kommando `cd apps/api && npx prisma generate --schema=../../prisma/schema.prisma`).
    - Denne kommando vil generere Prisma Client for API'en baseret på det korrekte rod-skema.
    - Hold øje med eventuelle fejl under genereringen.

### Fase 4: Test og Dokumentation

1.  **Test API Build/Start:**

    - Forsøg at starte API'en igen med `yarn workspace api dev` (eller `yarn dev` fra roden).
    - Verificer, at eventuelle tidligere TypeScript-fejl relateret til manglende Prisma-modeller/enums nu er løst.

2.  **Dokumentation:**
    - Opret eller opdatér `docs/prisma-setup.md` for at beskrive den centraliserede skemastruktur og de korrekte kommandoer for at arbejde med Prisma i projektet.
    - Hvis `Målsætning.md` (eller `Blueprint.md`) mangler dokumentation af quiz-systemet, skal dette tilføjes.

**Vigtigt:** Lever venligst patches for alle ændrede filer (`/prisma/schema.prisma` hvis justeret, `/apps/api/prisma/schema.prisma` (placeholder), `apps/api/package.json`). Rapportér status efter hvert relevant trin, især efter `prisma generate` og API-genstart.
