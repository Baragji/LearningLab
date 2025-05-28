## Project Rules – LearningLab Mono-repo 📚

### 1. Code Standards
- Use **TypeScript strict** everywhere. No `any`.
- Follow `eslint-config-learninglab` and `.prettierrc`. Trae must lint-fix before commit.

### 2. Folder Conventions
- **Backend**: NestJS modules live in `apps/api/src/modules/<name>/`.
- **Frontend**: Next 13 App Router components in `apps/web/src/app/(routes)/`.
- Do **NOT** create new folders at repo root; place shared code in `packages/`.

### 3. Database
- Prisma schema file is `apps/api/prisma/schema.prisma`.
- Any schema change ⇒  
  1. Create a `migration.sql` via Prisma Migrate,  
  2. Add a matching `rollback.sql`,  
  3. Update `docs/db-changelog.md`.

### 4. Testing
- Every new service/controller/component **must** ship with Jest or Playwright tests.
- Target coverage ≥ 90 % lines for new code.

### 5. Protected Paths
- `migrations/legacy/**` – **read-only**. Never modify or delete.
- `seed/**` – may read, but changes require human approval.
- `packages/config/**` – do not rename files; other packages import by path.

### 6. Commit / PR policy
- One logical feature per PR; PR title in conventional-commits format.
- Agents must run `turbo run lint test` and pass before pushing.

### 7. Emergency Stop
If the string **STOP-AGENT** appears in chat, cancel current task and roll back un-pushed edits.
