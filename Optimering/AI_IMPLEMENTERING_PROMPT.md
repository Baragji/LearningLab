# 🤖 AI IMPLEMENTERING PROMPT - KOMPLET KODEBASE REFAKTORERING

## 🎯 MISSION STATEMENT

Du er en ekspert AI-udvikler der skal udføre en komplet, systematisk refaktorering af LearningLab monorepo'et. Din opgave er at transformere en 668-fil kodebase til en fejlfri, optimeret og production-ready platform gennem præcis implementering af de udarbejdede planer.

## 📋 KRITISKE KRAV - INGEN UNDTAGELSER

### Absolut Nul-Tolerance

- **0 TypeScript fejl** - Hver fil skal kompilere fejlfrit
- **0 ESLint fejl** - Perfekt code quality
- **0 sikkerhedssårbarheder** - Komplet security audit
- **0 broken imports** - Alle references skal fungere
- **0 test failures** - 100% test success rate

### Kvalitetsstandarder

- **80%+ test coverage** - Omfattende testing
- **Strict TypeScript** - Aktivér strict mode overalt
- **Performance targets** - 50% hurtigere builds, 40% mindre bundles
- **Single source of truth** - Eliminér al duplikering

## 📊 KODEBASE KONTEKST

### Nuværende Struktur

```
learninglab-monorepo/ (668 filer)
├── apps/
│   ├── api/ (NestJS 10.3.10, Node.js 22)
│   └── web/ (Next.js 13.4.12, React 18.2.0)
├── packages/
│   ├── ui/ (MUI 5.14.3 komponenter)
│   ├── core/ (Delte typer)
│   ├── config/ (ESLint, Tailwind)
│   ├── tsconfig/ (TypeScript configs)
│   └── create-solid-wow/ (CLI tool)
└── gcp-migration/ (Python deployment)
```

### Hovedproblemer

1. **UI Duplikering**: packages/ui (MUI) vs apps/web/src/components/ui (Shadcn)
2. **Dependency Hell**: Inkonsistente versioner, sikkerhedssårbarheder
3. **Legacy Pollution**: ~30% forældede filer
4. **Docker Inefficiency**: Ikke-optimerede images
5. **Type Unsafety**: Manglende strict mode

## 🗓️ IMPLEMENTERINGSSEKVENS (14 DAGE)

### FASE 1: FUNDAMENT (Dag 1-2)

```bash
# DAG 1: Baseline & Backup
1. git tag "baseline-$(date +%Y%m%d)"
2. Kør yarn test:ci && yarn typecheck && yarn build
3. Dokumentér baseline metrics
4. yarn audit --all > security-baseline.txt

# DAG 2: Dependency Audit
1. yarn outdated > outdated-packages.txt
2. npx jscpd --min-lines 10 apps/ packages/ > duplicates.txt
3. Identificér alle sikkerhedssårbarheder
4. Plan upgrade sekvens
```

### FASE 2: DEPENDENCY UPGRADE (Dag 3-4)

```bash
# DAG 3: Core Frameworks
1. nvm use 22.0.0 && echo "22.0.0" > .nvmrc
2. yarn add react@18.2.0 react-dom@18.2.0
3. yarn add -D @types/react@18.2.18 @types/react-dom@18.2.18
4. yarn workspace web add next@14.2.0
5. Test: yarn typecheck && yarn build

# DAG 4: Backend & Lock Versions
1. yarn workspace api add @nestjs/core@11.1.1 @nestjs/common@11.1.1
2. yarn add -D typescript@5.4.5
3. Implementér resolutions i root package.json:
   {
     "resolutions": {
      "react": "18.2.0",
      "react-dom": "18.2.0",
      "@types/react": "18.2.18",
      "@types/react-dom": "18.2.18",
      "typescript": "5.4.5",
      "next": "14.2.0",
      "@nestjs/core": "11.1.1",
      "@nestjs/common": "11.1.1"
     }
   }
4. rm yarn.lock && yarn install
5. Test: yarn test:ci
```

### FASE 3: UI KONSOLIDERING (Dag 5-9)

```bash
# DAG 5-6: Komponent Enhancement
1. Analysér packages/ui/components/mui/ vs apps/web/src/components/ui/
2. Merge Shadcn funktionalitet ind i MUI komponenter:
   - Button: Tilføj variant="destructive|outline|ghost|link"
   - Card: Tilføj CardHeader, CardContent, CardFooter exports
   - Dialog: Merge Shadcn dialog patterns
   - Input: Extend TextField med Shadcn styling
3. Opdatér alle komponent exports i packages/ui/index.tsx
4. Test: yarn workspace ui test

# DAG 7: Legacy Cleanup
1. rm -rf .git_backup/ gcp-migration/_old_lies_backup/ rag_env/
2. mkdir -p archive/{scripts,docs,configs}
3. mv install-code-assistant*.sh archive/scripts/
4. mv MCPEnterprise_Agent_Prompt.md archive/docs/
5. Konsolidér .env.example filer
6. find . -name "*.log" -delete
7. find . -name ".DS_Store" -delete

# DAG 8-9: Import Migration
1. Automated replacement:
   find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
     -e 's|from "../../components/ui/button"|from "@repo/ui/Button"|g' \
     -e 's|from "../../components/ui/card"|from "@repo/ui/Card"|g'
2. Manual verification af alle imports
3. rm -rf apps/web/src/components/ui/
4. Test: yarn workspace web build && yarn workspace web dev
```

### FASE 4: DOCKER OPTIMERING (Dag 10-11)

```bash
# DAG 10: Dockerfile Optimization
1. Opret docker/api/Dockerfile med multi-stage build:
   - Base: node:22-alpine
   - Security: non-root user, dumb-init
   - Cache: --mount=type=cache optimizations
   - Size: production dependencies only
2. Opret docker/web/Dockerfile med Next.js standalone
3. Test builds: docker build -t learninglab/api:test .

# DAG 11: Production Compose
1. Opret docker-compose.prod.yml med:
   - Health checks for alle services
   - Resource limits
   - Secret management
   - Network isolation
2. Setup secrets: openssl rand -base64 32 > secrets/postgres_password.txt
3. Test: docker-compose -f docker-compose.prod.yml up -d
```

### FASE 5: TESTING & VALIDATION (Dag 12-13)

```bash
# DAG 12: Comprehensive Testing
1. yarn test:ci --coverage (kræv 80%+)
2. yarn typecheck (0 fejl)
3. yarn lint (0 fejl)
4. yarn build (success)
5. yarn test:e2e (alle tests pass)

# DAG 13: Performance & Security
1. Bundle analysis: npx @next/bundle-analyzer
2. Security scan: yarn audit (0 vulnerabilities)
3. Docker security: docker run --rm -v $(pwd):/app clair-scanner
4. Performance: lighthouse http://localhost:3000 (score 90+)
```

### FASE 6: FINALISERING (Dag 14)

```bash
# DAG 14: Documentation & Deployment
1. Opdatér alle README.md filer
2. Generer API dokumentation
3. Final test suite: yarn test:ci && yarn build
4. Success metrics dokumentation
5. git tag "refactoring-complete-$(date +%Y%m%d)"
```

## 🔧 SPECIFIKKE IMPLEMENTERINGSKRAV

### TypeScript Strict Mode

```json
// tsconfig.json - SKAL implementeres
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### ESLint Configuration

```json
// .eslintrc.js - SKAL være fejlfri
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error"
  }
}
```

### UI Component Standards

```typescript
// Eksempel på korrekt komponent struktur
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { forwardRef } from 'react';

export interface ButtonProps extends MuiButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', ...props }, ref) => {
    const muiVariant = mapShadcnToMuiVariant(variant);
    const muiSize = mapShadcnToMuiSize(size);

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        size={muiSize}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

### Docker Best Practices

```dockerfile
# Eksempel på korrekt Dockerfile struktur
FROM node:22-alpine AS base
WORKDIR /app
RUN apk update && apk upgrade && \
    apk add --no-cache openssl dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/app/.turbo \
    yarn build

FROM base AS runtime
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

## 🚨 KRITISKE FEJL DER SKAL UNDGÅS

### Absolutte Forbudte Handlinger

1. **ALDRIG slet filer uden backup** - Brug git tags
2. **ALDRIG ignorer test failures** - Fix alle fejl
3. **ALDRIG commit med TypeScript fejl** - 0 tolerance
4. **ALDRIG skip security audit** - Alle vulnerabilities skal fixes
5. **ALDRIG bryd eksisterende API** - Backward compatibility

### Validation Efter Hver Ændring

```bash
# SKAL køres efter hver større ændring
yarn typecheck    # 0 fejl
yarn lint         # 0 fejl
yarn test:ci      # 100% pass
yarn build        # Success
yarn audit        # 0 high/critical
```

## 📊 SUCCESS METRICS - MÅLBARE RESULTATER

### Performance Targets

- **Build Time**: Fra nuværende til <5 minutter (50% forbedring)
- **Bundle Size**: 40% reduktion i web bundle størrelse
- **Startup Time**: <30 sekunder for alle services
- **Memory Usage**: 30% reduktion i Docker memory footprint

### Quality Targets

- **TypeScript Coverage**: 100% (strict mode aktiveret)
- **Test Coverage**: 80%+ på alle packages
- **ESLint Score**: 0 fejl, 0 warnings
- **Security Score**: 0 vulnerabilities
- **Lighthouse Score**: 90+ på alle metrics

### Maintainability Targets

- **File Reduction**: 30% færre filer (cleanup af legacy)
- **Dependency Conflicts**: 0 version conflicts
- **Code Duplication**: <5% duplicate code
- **Documentation Coverage**: 100% af public APIs

## 🔍 VALIDATION CHECKLIST

### Pre-Implementation Validation

- [ ] Backup oprettet (git tag)
- [ ] Baseline metrics dokumenteret
- [ ] Development environment klar
- [ ] Alle planer gennemgået

### Daily Validation (SKAL køres hver dag)

```bash
#!/bin/bash
echo "=== Daily Validation $(date) ==="
echo "TypeScript errors: $(yarn typecheck 2>&1 | grep -c 'error')"
echo "ESLint errors: $(yarn lint 2>&1 | grep -c 'error')"
echo "Test failures: $(yarn test:ci 2>&1 | grep -c 'FAIL')"
echo "Security issues: $(yarn audit --level high 2>&1 | grep -c 'vulnerabilities')"
echo "Build status: $(yarn build >/dev/null 2>&1 && echo 'SUCCESS' || echo 'FAILED')"
```

### Final Validation (Dag 14)

- [ ] 0 TypeScript fejl
- [ ] 0 ESLint fejl
- [ ] 0 test failures
- [ ] 0 security vulnerabilities
- [ ] 80%+ test coverage
- [ ] Build time <5 minutter
- [ ] Bundle size reduced 40%+
- [ ] All documentation updated
- [ ] Docker images optimized
- [ ] Production deployment ready

## 🎯 EXECUTION MINDSET

### Precision Requirements

- **Læs hver plan grundigt** før implementering
- **Følg sekvensen nøjagtigt** - ingen shortcuts
- **Test efter hver ændring** - incremental validation
- **Dokumentér alle beslutninger** - traceability
- **Backup før store ændringer** - safety first

### Problem-Solving Approach

1. **Identificér root cause** - ikke bare symptoms
2. **Research best practices** - brug web search for latest info
3. **Implementér systematisk** - step by step
4. **Validate thoroughly** - test everything
5. **Document learnings** - for future reference

### Quality Mindset

- **Perfection over speed** - kvalitet er vigtigere end hastighed
- **Measure twice, cut once** - tænk før du handler
- **Leave it better** - forbedre alt du rører
- **Zero technical debt** - fix problems, don't work around them

## 🚀 FINAL INSTRUCTIONS

Du har nu alle nødvendige planer og specifikationer. Din opgave er at:

1. **Implementér systematisk** hver fase i den angivne rækkefølge
2. **Validér kontinuerligt** med de angivne tests og metrics
3. **Dokumentér progress** dagligt med metrics og noter
4. **Eskalér problemer** hvis du støder på uventede issues
5. **Lever perfekte resultater** - ingen kompromiser på kvalitet

**Start med Fase 1, Dag 1 og arbejd dig systematisk gennem hele planen. Held og lykke med at transformere LearningLab til en world-class platform!**

---

_Denne prompt sikrer præcis, systematisk og succesfuld implementering af den komplette refaktorering._
