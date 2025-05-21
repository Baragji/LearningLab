# Monorepo Debugging Playbook

*NestJS + Next.js + Prisma + Turborepo*

---

## 0. Reproducer fejlen præcist

| Checkpoint        | Kommando                                                                           | Formål                    |
| ----------------- | ---------------------------------------------------------------------------------- | ------------------------- |
| **Clean clone**   | `git clone <repo> learninglab-debug && cd learninglab-debug`                       | Fjern lokale artefakter   |
| **Match Node**    | `fnm use 22.15`                                                                    | Samme version som prod/CI |
| **Fresh install** | `rm -rf node_modules && yarn install --immutable`                                  | Respekter *yarn.lock*     |
| **Spin services** | `docker compose up -d db`  →  `yarn prisma migrate deploy && yarn prisma generate` | DB‑schema ↔ Prisma Client |
| **Start dev**     | `turbo run dev --filter=api,web`                                                   | Reproducer loggen         |

---

## 1. TypeScript‑fejl

### 1.1 “Debug Failure. Output generation failed”

1. **Isolér**: `npx tsc --build apps/api/tsconfig.json --diagnostics`
2. **Type‑only import** i `userProgress.controller.ts`:

   ```ts
   import type { AuthenticatedRequest } from '../types/express';
   ```
3. **Sørg for modul** i `express.d.ts` (inkl. `export {}` nederst).
4. **Genstart** TS‑server / webpack.

### 1.2 “Can’t resolve '../types/express'”

* Behold relativ sti *eller* lav alias i `tsconfig`:

  ```jsonc
  "paths": { "@types/*": ["src/types/*"] }
  ```

### 1.3 Casing‑fejl (TS1261)

* Slå `"forceConsistentCasingInFileNames": true` til.
* Omdøb via `git mv`.

---

## 2. Prisma – unikke constraints & client‑sync

1. Sikr constraint‑navn i `schema.prisma`:

   ```prisma
   @@unique([userId, lessonId, quizId], name: "userId_lessonId_quizId_unique_constraint")
   ```
2. Genmigrér & generér:

   ```bash
   npx prisma migrate dev --name sync_unique_constraints
   npx prisma generate
   ```

---

## 3. Runtime & porte

* Dræb zombie‑processer:

  ```bash
  lsof -i:3000-3010 | awk '{print $2}' | xargs kill -9
  ```
* Fast‑assign porte i `next.config.js` eller `package.json`:

  ```json
  "dev": "next dev -p 3000"
  ```

---

## 4. Automatisér – “fails fast” pipeline

| Trin           | Kommando                                                                       | Miljø           |
| -------------- | ------------------------------------------------------------------------------ | --------------- |
| **Lint**       | `turbo run lint`                                                               | Pre‑commit & CI |
| **Type‑check** | `turbo run typecheck`                                                          | Lokal + CI      |
| **Unit tests** | `turbo run test`                                                               | CI              |
| **Build**      | `turbo run build`                                                              | CI              |
| **E2E smoke**  | `pnpm exec start-server-and-test web:build https://localhost:4173 cypress run` | CI              |

---

## 5. Forebyggelse

1. VS Code auto‑fix on save (ESLint + Prettier).
2. Dependabot/Renovate for patch‑opdateringer.
3. Story‑branch → PR → review.
4. Snapshot‑test af `schema.prisma` i CI.
5. Gem denne playbook som `/docs/debugging.md` og link fra README.

---

**Næste skridt:** Kør sektion 0 → 1 → 2 i rækkefølge, push små commits, hold CI grønt. Føj nye fejl til checklisten efter behov.
