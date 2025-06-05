# 🚀 KOMPLET KODEBASE REFAKTORERING & OPRYDNINGSPLAN

## 📋 EXECUTIVE SUMMARY
Dette dokument beskriver en systematisk tilgang til at refaktorere, debugge og optimere hele LearningLab monorepo'et med fokus på:
- Eliminering af duplikeret kode
- Konsolidering af UI komponenter
- Dependency management og version locking
- Docker optimering
- Fjernelse af forældede filer
- Best practice implementering

## 🎯 HOVEDMÅL
1. **UI Konsolidering**: Samle alle genbrugelige UI komponenter i `packages/ui`
2. **Dependency Cleanup**: Opdatere og låse alle dependencies til stabile versioner
3. **Code Deduplication**: Fjerne duplikeret kode på tværs af projektet
4. **Docker Optimering**: Implementere best practice Docker setup
5. **Legacy Cleanup**: Fjerne forældede og irrelevante filer
6. **Type Safety**: Sikre komplet TypeScript coverage
7. **Testing**: Implementere omfattende test coverage

## 📊 NUVÆRENDE STRUKTUR ANALYSE

### Monorepo Oversigt
```
learninglab-monorepo/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── ui/           # UI komponenter (MUI baseret)
│   ├── core/         # Delte typer og utilities
│   ├── config/       # ESLint, Tailwind, PostCSS config
│   ├── tsconfig/     # TypeScript konfigurationer
│   └── create-solid-wow/ # CLI tool
└── gcp-migration/    # GCP deployment scripts
```

### 🚨 IDENTIFICEREDE PROBLEMER

#### 1. UI DUPLIKERING
- **packages/ui/components/**: MUI-baserede komponenter
- **apps/web/src/components/ui/**: Shadcn/ui komponenter
- **Konflikt**: To forskellige UI systemer bruges samtidigt

#### 2. DEPENDENCY ISSUES
- Inkonsistente versioner på tværs af packages
- Manglende version locking
- Forældede dependencies
- Sikkerhedssårbarheder

#### 3. DOCKER PROBLEMER
- Manglende Docker konfiguration for nogle services
- Ikke-optimerede Docker images
- Manglende multi-stage builds

#### 4. LEGACY FILER
- `.git_backup/` - gamle backup filer
- `_old_lies_backup/` - forældede backup filer
- Duplikerede konfigurationsfiler
- Ubrugte scripts

## 🗺️ DETALJERET IMPLEMENTERINGSPLAN

### FASE 1: ANALYSE OG FORBEREDELSE (Dag 1-2)

#### 1.1 Dependency Audit
```bash
# Kør dependency audit på alle packages
yarn audit --all
npm audit --audit-level high
```

#### 1.2 Code Analysis
```bash
# Find duplikeret kode
npx jscpd --min-lines 10 --min-tokens 50 apps/ packages/
```

#### 1.3 TypeScript Errors
```bash
# Check alle TypeScript fejl
yarn typecheck
```

### FASE 2: UI KONSOLIDERING (Dag 3-5)

#### 2.1 UI System Beslutning
**ANBEFALING**: Konsolidere til MUI system i `packages/ui`

#### 2.2 Komponent Mapping
```typescript
// Mapping mellem eksisterende komponenter
const componentMapping = {
  // Fra apps/web/src/components/ui/ til packages/ui/components/
  'button.tsx': 'mui/Button/Button.tsx',
  'card.tsx': 'mui/Card/Card.tsx',
  'dialog.tsx': 'mui/Dialog/Dialog.tsx',
  'input.tsx': 'mui/TextField/TextField.tsx',
  'table.tsx': 'mui/Table/Table.tsx',
  // ... osv
};
```

#### 2.3 Migration Strategy
1. **Audit eksisterende komponenter**
2. **Merge funktionalitet**
3. **Opdater imports**
4. **Test alle komponenter**
5. **Fjern duplikater**

### FASE 3: DEPENDENCY MANAGEMENT (Dag 6-8)

#### 3.1 Version Research
Researche stabile versioner for:
- React 18.3.1 (latest stable)
- Next.js 14.2.x (latest stable)
- NestJS 10.x (latest stable)
- MUI 6.x (latest stable)
- Prisma 6.x (latest stable)

#### 3.2 Lock File Strategy
```json
{
  "resolutions": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@types/react": "18.3.1",
    "@types/react-dom": "18.3.1",
    "typescript": "5.4.5",
    "next": "14.2.5",
    "@nestjs/core": "10.3.10"
  }
}
```

### FASE 4: DOCKER OPTIMERING (Dag 9-10)

#### 4.1 Multi-stage Dockerfile
```dockerfile
# Optimeret Dockerfile struktur
FROM node:20-alpine AS base
FROM base AS deps
FROM base AS builder
FROM base AS runner
```

#### 4.2 Docker Compose Optimering
- Health checks
- Resource limits
- Environment separation
- Volume optimization

### FASE 5: CODE CLEANUP (Dag 11-12)

#### 5.1 Legacy File Removal
```bash
# Filer til fjernelse
rm -rf .git_backup/
rm -rf gcp-migration/_old_lies_backup/
rm -rf .qodo/
# ... andre forældede filer
```

#### 5.2 Code Deduplication
- Identificer duplikeret business logic
- Flytte til `packages/core`
- Opdater imports

### FASE 6: TESTING & VALIDATION (Dag 13-14)

#### 6.1 Test Coverage
```bash
# Sikre minimum 80% test coverage
yarn test:ci --coverage
```

#### 6.2 E2E Testing
```bash
# Playwright tests
yarn test:e2e
```

## 🔧 TEKNISKE SPECIFIKATIONER

### Dependency Versions (Research Required)
```json
{
  "react": "18.3.1",
  "next": "14.2.5",
  "@nestjs/core": "10.3.10",
  "@mui/material": "6.0.0",
  "prisma": "6.8.2",
  "typescript": "5.4.5",
  "turbo": "2.5.3"
}
```

### UI Component Architecture
```
packages/ui/
├── components/
│   ├── base/          # Grundlæggende komponenter
│   ├── composite/     # Sammensatte komponenter
│   ├── layout/        # Layout komponenter
│   └── feedback/      # Feedback komponenter
├── hooks/             # Delte hooks
├── utils/             # Utility funktioner
├── theme/             # MUI theme konfiguration
└── types/             # TypeScript definitioner
```

### Docker Architecture
```
docker/
├── api/
│   ├── Dockerfile
│   └── .dockerignore
├── web/
│   ├── Dockerfile
│   └── .dockerignore
└── docker-compose.yml
```

## 📋 IMPLEMENTERINGS CHECKLIST

### Pre-Implementation
- [ ] Backup af nuværende kodebase
- [ ] Dependency audit rapport
- [ ] UI komponent inventory
- [ ] Test coverage baseline

### Fase 1: Analyse
- [ ] Kør dependency audit
- [ ] Identificer duplikeret kode
- [ ] TypeScript error rapport
- [ ] Performance baseline

### Fase 2: UI Konsolidering
- [ ] Komponent mapping dokument
- [ ] Merge MUI og Shadcn komponenter
- [ ] Opdater alle imports
- [ ] Test alle UI komponenter
- [ ] Fjern duplikerede filer

### Fase 3: Dependencies
- [ ] Research stabile versioner
- [ ] Opdater package.json filer
- [ ] Test kompatibilitet
- [ ] Lock versions
- [ ] Security audit

### Fase 4: Docker
- [ ] Multi-stage Dockerfiles
- [ ] Optimeret docker-compose
- [ ] Health checks
- [ ] Resource limits
- [ ] Test deployment

### Fase 5: Cleanup
- [ ] Fjern legacy filer
- [ ] Code deduplication
- [ ] Unused imports cleanup
- [ ] Dead code elimination

### Fase 6: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] Security tests

## 🚀 SUCCESS METRICS

### Code Quality
- [ ] 0 TypeScript errors
- [ ] 0 ESLint errors
- [ ] 80%+ test coverage
- [ ] 0 security vulnerabilities

### Performance
- [ ] Build time < 5 minutter
- [ ] Bundle size reduction 20%+
- [ ] Docker image size < 500MB
- [ ] Startup time < 30 sekunder

### Maintainability
- [ ] Single UI system
- [ ] Locked dependencies
- [ ] Comprehensive documentation
- [ ] Clear folder structure

## 🔄 MAINTENANCE PLAN

### Weekly
- Dependency security updates
- Test coverage monitoring
- Performance metrics review

### Monthly
- Dependency version updates
- Code quality metrics
- Docker image optimization

### Quarterly
- Major version upgrades
- Architecture review
- Performance optimization

## 📞 NEXT STEPS

1. **Godkend denne plan**
2. **Tildel ressourcer**
3. **Start med Fase 1**
4. **Daglige status updates**
5. **Kontinuerlig testing**

---

*Dette dokument vil blive opdateret løbende under implementeringen.*