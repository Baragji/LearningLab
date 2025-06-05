# TypeScript Fejl Forebyggelse Guide

## Oversigt

Denne guide er udviklet efter løsning af kritiske TypeScript-fejl i file controller systemet og skal sikre, at lignende problemer undgås under implementering af de resterende faser i FASEINDDELT_IMPLEMENTERINGSPLAN.md.

---

## Hovedproblem Identificeret

### Problem: Prisma Include Relations og TypeScript Types

**Fejltype:** `Property 'uploader' does not exist on type`

**Root Cause:** Service metoder returnerede basis `File` type, men når Prisma's `include` bruges til at hente relationer, skal return typen eksplicit inkludere disse relationer.

**Løsning:** Opdater return types til at matche faktiske Prisma query resultater.

---

## Forebyggende Strategier

### 1. Prisma Type Safety Checklist

#### Før Implementation:

- [ ] **Verificer Schema Relations:** Tjek at alle relationer er korrekt defineret i `prisma/schema.prisma`
- [ ] **Regenerer Prisma Client:** Kør `npx prisma generate` efter schema ændringer
- [ ] **Tjek Generated Types:** Undersøg `.prisma/client/index.d.ts` for tilgængelige types

#### Under Implementation:

- [ ] **Match Return Types:** Når du bruger `include`, opdater service return types
- [ ] **Use Proper Prisma Types:** Brug `ModelName & { relation: RelationType }` pattern
- [ ] **Test TypeScript Compilation:** Kør `yarn workspace api build` efter hver ændring

#### Eksempel på Korrekt Type Definition:

```typescript
// ❌ Forkert - basis type når include bruges
async getFile(id: number): Promise<File> {
  return this.prisma.file.findUnique({
    where: { id },
    include: { uploader: { select: { id: true, name: true, email: true } } }
  });
}

// ✅ Korrekt - type matcher include
async getFile(id: number): Promise<File & { uploader: { id: number; name: string; email: string } | null }> {
  return this.prisma.file.findUnique({
    where: { id },
    include: { uploader: { select: { id: true, name: true, email: true } } }
  });
}
```

### 2. Development Workflow

#### Daglig Rutine:

1. **Morning Check:** `yarn workspace api build` før start
2. **Efter Schema Changes:**
   - Kør `npx prisma generate`
   - Restart TypeScript server i IDE
   - Verificer build status
3. **Før Commit:** Fuld build test af alle workspaces

#### IDE Setup:

- **VS Code:** Installer Prisma extension
- **TypeScript Server:** Restart regelmæssigt (Cmd+Shift+P → "Restart TypeScript Server")
- **Auto-save:** Deaktiver under store refactorings

### 3. Fase-Specifik Implementering

#### Fase 1: Database & Backend Færdiggørelse

**Kritiske Områder:**

- File upload system implementation
- Material management relations
- Search functionality med includes

**Checklist:**

- [ ] Alle nye service metoder har korrekte return types
- [ ] Include relations matcher TypeScript definitions
- [ ] Error handling inkluderer type guards

#### Fase 2: AI Integration

**Kritiske Områder:**

- AI service layer med database integration
- Content processing med file relations
- Vector database integration

**Checklist:**

- [ ] AI service types er korrekt defineret
- [ ] Database queries med AI metadata har korrekte types
- [ ] External API integration har proper type definitions

#### Fase 3: Avancerede Features

**Kritiske Områder:**

- Gamification system med user relations
- Social features med complex queries
- Analytics med aggregated data

**Checklist:**

- [ ] Complex aggregation queries har korrekte return types
- [ ] Social relation queries inkluderer alle nødvendige includes
- [ ] Analytics data structures er type-safe

#### Fase 4: Template System

**Kritiske Områder:**

- CLI generator med dynamic types
- Template configuration system
- Deployment scripts

**Checklist:**

- [ ] CLI types er korrekt eksporteret
- [ ] Template configuration har strict typing
- [ ] Build scripts validerer alle types

---

## Debugging Strategier

### Når TypeScript Fejl Opstår:

1. **Identificer Root Cause:**

   ```bash
   # Tjek Prisma client status
   npx prisma generate

   # Restart TypeScript server
   # I VS Code: Cmd+Shift+P → "Restart TypeScript Server"

   # Clean build
   rm -rf node_modules/.cache
   yarn workspace api build
   ```

2. **Analysér Fejlmeddelelse:**

   - Noter hvilken property der mangler
   - Identificer om det er en relation
   - Tjek om include statement matcher return type

3. **Verificer Prisma Schema:**

   ```bash
   # Tjek schema syntax
   npx prisma validate

   # Tjek generated types
   cat node_modules/.prisma/client/index.d.ts | grep -A 10 "ModelName"
   ```

4. **Fix Strategy:**
   - Opdater service return types først
   - Test med simple query uden includes
   - Tilføj includes gradvist
   - Verificer hver ændring med build

### Common Patterns:

#### Pattern 1: Basic Model med Single Relation

```typescript
// Service method
async getModelWithRelation(id: number): Promise<Model & { relation: RelationType }> {
  return this.prisma.model.findUnique({
    where: { id },
    include: { relation: true }
  });
}
```

#### Pattern 2: Model med Multiple Relations

```typescript
// Service method
async getModelWithMultipleRelations(id: number): Promise<
  Model & {
    relation1: Relation1Type;
    relation2: Relation2Type[];
  }
> {
  return this.prisma.model.findUnique({
    where: { id },
    include: {
      relation1: true,
      relation2: true
    }
  });
}
```

#### Pattern 3: Model med Selective Relation Fields

```typescript
// Service method
async getModelWithSelectiveRelation(id: number): Promise<
  Model & {
    relation: { id: number; name: string } | null;
  }
> {
  return this.prisma.model.findUnique({
    where: { id },
    include: {
      relation: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}
```

---

## Automatisering og Tools

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "yarn workspace api build && yarn workspace web build"
    }
  }
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "prisma.showPrismaDataPlatformNotification": false,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

### Build Scripts

```json
// package.json scripts
{
  "scripts": {
    "type-check": "yarn workspace api build && yarn workspace web build",
    "prisma-reset": "npx prisma generate && yarn type-check",
    "dev-safe": "yarn prisma-reset && yarn dev"
  }
}
```

---

## Fase Implementation Checklist

### Før Start af Ny Fase:

- [ ] Læs denne guide igennem
- [ ] Verificer nuværende build status
- [ ] Backup nuværende working state
- [ ] Planlæg database schema ændringer

### Under Implementation:

- [ ] Implementer én feature ad gangen
- [ ] Test TypeScript compilation efter hver ændring
- [ ] Dokumenter nye type patterns
- [ ] Opdater denne guide hvis nye patterns opstår

### Efter Fase Completion:

- [ ] Fuld test suite kørsel
- [ ] Performance test
- [ ] Security audit af nye endpoints
- [ ] Opdater dokumentation

---

## Emergency Procedures

### Hvis Build Fejler Kritisk:

1. **Revert til sidste working commit**
2. **Identificer ændringer siden sidste working state**
3. **Implementer ændringer én ad gangen**
4. **Test efter hver ændring**

### Hvis Prisma Types er Korrupte:

1. **Slet node_modules og .prisma directories**
2. **Reinstaller dependencies: `yarn install`**
3. **Regenerer Prisma: `npx prisma generate`**
4. **Restart IDE og TypeScript server**

---

## Kontakt og Support

Ved kritiske TypeScript problemer:

1. Dokumenter fejlen i detaljer
2. Inkluder fejlmeddelelse og stack trace
3. Noter hvilke ændringer der blev lavet før fejlen
4. Brug denne guide til systematisk debugging

---

_Denne guide skal opdateres løbende baseret på nye erfaringer under implementering af de resterende faser._
