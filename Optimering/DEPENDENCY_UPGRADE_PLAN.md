# 🔄 DEPENDENCY UPGRADE & VERSION LOCKING PLAN

## 📊 NUVÆRENDE VS ANBEFALEDE VERSIONER

### Core Framework Versions
| Package | Nuværende | Anbefalet | Grund |
|---------|-----------|-----------|-------|
| React | 18.2.0 | 18.2.0 | Seneste stabile version |
| Next.js | 13.4.12 | 14.2.0 | App Router forbedringer, HMR optimeringer |
| NestJS | 10.3.10 | 11.1.1 | Bedre performance og Node.js 22 support |
| TypeScript | 5.3.3 | 5.4.5 | Bedre type inference, bug fixes |
| Node.js | 22.x | 22.x LTS | Stabil og moderne runtime |

### UI & Styling
| Package | Nuværende | Anbefalet | Grund |
|---------|-----------|-----------|-------|
| @mui/material | 5.14.3 | 6.1.6 | Planlagt opgradering til MUI 6 |
| @emotion/react | 11.11.1 | 11.13.3 | Kompatibilitet med MUI 6.x |
| Tailwind CSS | - | 3.4.15 | Hvis vi beholder Shadcn komponenter |

### Database & ORM
| Package | Nuværende | Anbefalet | Grund |
|---------|-----------|-----------|-------|
| Prisma | 6.8.2 | 6.8.2 | Allerede seneste, ingen ændring |
| @prisma/client | 6.8.2 | 6.8.2 | Match Prisma version |

### Build Tools
| Package | Nuværende | Anbefalet | Grund |
|---------|-----------|-----------|-------|
| Turbo | 2.5.3 | 2.5.3 | Seneste stabile |
| Yarn | 4.9.1 | 4.9.1 | Seneste stabile |

## 🎯 UPGRADE STRATEGI

### Fase 1: Node.js & Core Runtime
```bash
# Opdater Node.js til LTS version
nvm install 20.18.0
nvm use 20.18.0
```

### Fase 2: Framework Upgrades
```bash
# React ecosystem
yarn add react@18.3.1 react-dom@18.3.1
yarn add -D @types/react@18.3.1 @types/react-dom@18.3.1

# Next.js upgrade
yarn add next@14.2.15

# NestJS upgrade (major version)
yarn workspace api add @nestjs/core@11.1.1 @nestjs/common@11.1.1
```

### Fase 3: UI Library Consolidation
```bash
# Downgrade MUI til stabil version
yarn workspace ui add @mui/material@6.1.6 @mui/icons-material@6.1.6
yarn workspace ui add @emotion/react@11.13.3 @emotion/styled@11.13.3
```

## 🔒 VERSION LOCKING STRATEGI

### Root package.json Resolutions
```json
{
  "resolutions": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@types/react": "18.3.1",
    "@types/react-dom": "18.3.1",
    "typescript": "5.4.5",
    "next": "14.2.15",
    "@nestjs/core": "11.1.1",
    "@nestjs/common": "11.1.1",
    "@mui/material": "6.1.6",
    "@emotion/react": "11.13.3",
    "prisma": "6.8.2",
    "@prisma/client": "6.8.2",
    "express": "4.19.2"
  }
}
```

### Yarn Constraints
```yaml
# .yarnrc.yml
constraints:
  - field: "dependencies.react"
    range: "18.3.1"
  - field: "dependencies.typescript"
    range: "5.4.5"
```

## 🚨 BREAKING CHANGES & MIGRATION

### Next.js 13 → 14 Migration
```typescript
// app/layout.tsx - Metadata API changes
export const metadata: Metadata = {
  title: 'LearningLab',
  description: 'Modern educational platform'
}
```

### NestJS 10 → 11 Migration
```typescript
// main.ts - Bootstrap changes
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Nye options for v11
    bufferLogs: true,
  });
  
  await app.listen(3001);
}
```

### MUI 7 → 6 Downgrade
```typescript
// theme/index.ts - Theme API changes
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  // v6 theme structure
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});
```

## 🧪 TESTING STRATEGI

### Pre-Upgrade Testing
```bash
# Baseline tests
yarn test:ci
yarn build
yarn typecheck
```

### Post-Upgrade Validation
```bash
# Validation efter hver upgrade
yarn install
yarn typecheck
yarn build
yarn test:ci
yarn test:e2e
```

### Rollback Plan
```bash
# Git tags for hver fase
git tag -a "pre-upgrade-baseline" -m "Before dependency upgrades"
git tag -a "phase-1-node-upgrade" -m "After Node.js upgrade"
git tag -a "phase-2-frameworks" -m "After framework upgrades"
```

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation
- [ ] Backup nuværende yarn.lock
- [ ] Tag current state i git
- [ ] Run baseline tests
- [ ] Document current versions

### Phase 1: Node.js
- [ ] Update Node.js til 20.18.0 LTS
- [ ] Update .nvmrc file
- [ ] Update Docker base images
- [ ] Test basic functionality

### Phase 2: Core Frameworks
- [ ] Upgrade React til 18.3.1
- [ ] Upgrade Next.js til 14.2.15
- [ ] Upgrade NestJS til 11.1.1
- [ ] Update TypeScript til 5.4.5
- [ ] Fix breaking changes
- [ ] Run tests

### Phase 3: UI Libraries
- [ ] Consolidate MUI version
- [ ] Remove conflicting UI libraries
- [ ] Update component imports
- [ ] Test UI components

### Phase 4: Lock Versions
- [ ] Add resolutions til root package.json
- [ ] Update yarn constraints
- [ ] Regenerate yarn.lock
- [ ] Verify locked versions

### Phase 5: Validation
- [ ] Full test suite
- [ ] E2E tests
- [ ] Performance benchmarks
- [ ] Security audit

## 🔍 MONITORING & MAINTENANCE

### Weekly Checks
```bash
# Security vulnerabilities
yarn audit
npm audit

# Outdated packages
yarn outdated
```

### Monthly Updates
```bash
# Patch version updates only
yarn upgrade --pattern "@nestjs/*" --latest
yarn upgrade --pattern "@mui/*" --latest
```

### Quarterly Reviews
- Major version upgrade evaluation
- Performance impact assessment
- Security posture review

## 🚀 SUCCESS CRITERIA

### Technical Metrics
- [ ] 0 security vulnerabilities
- [ ] All tests passing
- [ ] Build time < 5 minutes
- [ ] Bundle size maintained or reduced
- [ ] TypeScript strict mode enabled

### Operational Metrics
- [ ] Deployment success rate 100%
- [ ] Zero downtime upgrades
- [ ] Rollback capability tested
- [ ] Documentation updated

---

*Denne plan sikrer en systematisk og sikker upgrade af alle dependencies med minimal risiko.*