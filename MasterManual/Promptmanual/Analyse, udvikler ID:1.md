Jeg er gået i gang med en dybdegående analyse af din kodebase (`repomix-output.xml`) og de mange supplerende dokumenter, du har leveret.

Her er en **indledende liste** over potentielle fejl og problemområder, der er skræddersyet til din "LearningLab" monorepo-opsætning. For hvert punkt forklarer jeg, *hvorfor* det er en reel mulighed i netop dit system, ofte med henvisning til specifikke filer eller konfigurationer.

-----

## Potentielle Fejl og Problemområder i LearningLab Monorepo

### Kategori 1: Afhængigheder, Modulopløsning og Værktøjskæde

**Fejl ID: DEP-001**

  * **Fejlbeskrivelse:** `Module not found` fejl under build (f.eks. `next build` eller `nest build`) eller runtime, på trods af at pakken er installeret.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Du bruger Yarn 4.x med `nodeLinker: node-modules` men også `pnpMode: loose` i din `.yarnrc.yml`[cite: 76]. Selvom `node-modules` er den primære linker, kan `pnpMode: loose` stadig introducere PnP-lignende opløsningsadfærd for visse pakker, som ikke alle værktøjer (f.eks. ældre Webpack-loadere, Next.js interne mekanismer, Jest-transforms) håndterer fejlfrit.
      * Next.js (v. 13.4.12 i `apps/web` [cite: 76]) og NestJS (v. 10.3.10 i `apps/api` [cite: 76]) har komplekse build-systemer. Hvis en transitiv afhængighed eller en loader ikke opløses korrekt via den kombinerede Yarn-opsætning, kan det føre til "module not found".
      * `Forkert tilgang.docx` nævner et lignende scenarie (D-1) specifikt for Next.js builds med Yarn PnP. Selvom du primært bruger `node-modules`, er risikoen ikke helt elimineret med `pnpMode: loose`.
  * **Relevante filer/steder:** `.yarnrc.yml`[cite: 76], `apps/web/next.config.js`[cite: 76], `apps/api/webpack-hmr.config.js`[cite: 76], diverse `package.json` for korrekt dependency-deklaration.

**Fejl ID: DEP-002**

  * **Fejlbeskrivelse:** Inconsistente versioner af kritiske delte afhængigheder (f.eks. React, TypeScript, ESLint-plugins) på tværs af workspaces, hvilket fører til typefejl, linting-fejl eller subtile runtime-bugs.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Monorepo-strukturen med mange `package.json`-filer (`apps/api/package.json`, `apps/web/package.json`, `packages/ui/package.json` osv. [cite: 76]) øger risikoen for version-drift.
      * Selvom du har `resolutions` i rod `package.json` for `@types/react` og `typescript`[cite: 76], kan andre pakker (især ESLint-plugins, Babel-plugins, eller specifikke framework-afhængigheder) stadig trække divergerende versioner ind, hvis de ikke også er dækket af resolutions eller `packageExtensions` i `.yarnrc.yml`[cite: 76].
      * `stackinfo-mismatch-report.md` og `debugging-plan.md` [cite: 1, 76] har tidligere peget på versionsproblemer (f.eks. med React-typer og TypeScript-kompatibilitet for NestJS-generatorer).
  * **Relevante filer/steder:** Alle `package.json` filer[cite: 76], rod `.yarnrc.yml` [cite: 76] (for `packageExtensions`), `turbo.json` (hvordan den håndterer builds med potentielt forskellige interne versioner).

**Fejl ID: DEP-003**

  * **Fejlbeskrivelse:** "Phantom dependencies" - et workspace bruger en pakke, der ikke er eksplicit deklareret i dets `package.json`, men er tilgængelig via hoisting fra et andet workspace eller roden. Dette kan fejle i CI eller efter en `turbo prune`.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Yarn's `node-modules` linker med hoisting kan maskere manglende dependencies lokalt.
      * `turbo prune` (brugt i `package-scripts.js` for CI [cite: 76]) skaber en isoleret version af et workspace med kun dets *direkte* afhængigheder. Hvis en pakke var en phantom dependency, vil den mangle i den prunede build.
      * `package-scripts.js` bruger `npm run build` i `out` mappen efter `turbo prune` og `yarn install --frozen-lockfile`[cite: 76]. Skift af package manager (fra yarn til npm for build-scriptet) i en prunet kontekst kan også afsløre/forårsage problemer, hvis `package-lock.json` ikke er synkroniseret eller hvis scripts er package manager-specifikke.
  * **Relevante filer/steder:** Alle `package.json` (især `dependencies` og `devDependencies`), `package-scripts.js`[cite: 76], `turbo.json`.

**Fejl ID: TOOL-001**

  * **Fejlbeskrivelse:** `package-scripts.js` bruger `npm run build` i CI efter `turbo prune`, men projektet bruger Yarn og har en `yarn.lock`. Dette kan føre til, at scripts ikke findes eller at forkerte dependency-versioner bruges.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `package-scripts.js` indeholder linjer som `web: "cd out && npm run build"` og `api: "cd out && npm run build"` under `build.ci`[cite: 76].
      * Den forudgående `prepare.ci` step for både web og api kører `yarn install --frozen-lockfile` i `out` mappen[cite: 76].
      * Hvis `package.json` scripts i de prunede `apps/api` og `apps/web` workspaces (i `out` mappen) ikke er kompatible med `npm run build` (f.eks. de er defineret til kun at virke med `yarn run`), vil dette fejle. Dette er direkte påpeget i `Forkert tilgang.docx` (CI-1)[cite: 1].
  * **Relevante filer/steder:** `package-scripts.js`[cite: 76], `package.json` scripts i `apps/api` og `apps/web`.

### Kategori 2: TypeScript, Konfiguration og Sti-Aliaser

**Fejl ID: TS-001**

  * **Fejlbeskrivelse:** TypeScript path aliases (f.eks. `@/*`, `@repo/core`) virker i udvikling men fejler under build, test (Jest), eller i Docker container.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Du har path aliases defineret i flere `tsconfig.json` filer (f.eks. `apps/api/tsconfig.json`[cite: 76], `apps/web/tsconfig.json` [cite: 76]).
      * Disse skal være konsistent konfigureret og forstået af alle dele af din toolchain:
          * TypeScript compileren (`tsc`).
          * Next.js's build system (kræver korrekt `baseUrl` og `paths` i `apps/web/tsconfig.json` og evt. Webpack alias-konfiguration i `next.config.js` [cite: 76]).
          * NestJS's build system (kræver korrekt `baseUrl` og `paths` i `apps/api/tsconfig.json` og `apps/api/tsconfig.build.json` [cite: 76]).
          * Jest (`moduleNameMapper` i `jest.config.js` eller `package.json` for hvert workspace). `apps/web/jest.config.js` [cite: 76] er til stede; `apps/api/package.json` [cite: 76] indeholder en Jest-konfiguration.
          * ESLint (`eslint-import-resolver-typescript` hvis brugt).
          * Docker builds, hvor sti-konteksten kan være anderledes.
      * `Forkert tilgang.docx` (D-3) [cite: 1] og `debugging-plan.md` [cite: 76] nævner specifikt risikoen for, at `paths` aliaser fra `packages/tsconfig/*.json` kan overskrive hinanden i stedet for at blive merged, hvis de ikke er sat korrekt op med `extends` og relative stier.
      * Dine `apps/api/tsconfig.json` og `apps/web/tsconfig.json` refererer til `dist`-mapper for `@repo/core` og `@repo/config`[cite: 76]. Det er vigtigt, at disse `dist`-mapper altid er bygget og opdaterede, før apps der afhænger af dem bygges. `turbo.json` [cite: 76] skal definere denne afhængighed korrekt i pipelines.
  * **Relevante filer/steder:** Alle `tsconfig.json` filer[cite: 76], `next.config.js`[cite: 76], Jest konfigurationer (i `package.json` eller `jest.config.js` [cite: 76]), `turbo.json`[cite: 76].

**Fejl ID: TS-002**

  * **Fejlbeskrivelse:** Cirkulære afhængigheder mellem moduler i NestJS (`apps/api`), hvilket fører til "potential circular dependency" advarsler under opstart eller uforudsete runtime fejl, hvor en service er `undefined` ved injektion.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `apps/api/src/auth/auth.module.ts` bruger `forwardRef(() => UsersModule)`[cite: 76], og `apps/api/src/users/users.module.ts` kunne potentielt have brug for at importere `AuthModule` (som nævnt i kommentaren dér)[cite: 76]. Dette er en klassisk opskrift på cirkulære afhængigheder.
      * `apps/api/docs/circular-dependencies.md` [cite: 76] dokumenterer eksplicit dette problem og brugen af `forwardRef()`. Selvom `forwardRef()` løser den umiddelbare load-time fejl, kan det maskere dybere designproblemer, der kan føre til subtile bugs.
      * Mange controllere og services i `apps/api/src/controllers` [cite: 25] og `apps/api/src/services` [cite: 25] kan potentielt skabe komplekse afhængighedsgrafer. F.eks. hvis `UserGroupsService` importerer `UsersService` og omvendt.
  * **Relevante filer/steder:** Alle `*.module.ts` filer i `apps/api/src`[cite: 25], især `auth.module.ts` [cite: 76] og `users.module.ts`[cite: 76]. `apps/api/docs/circular-dependencies.md`[cite: 76].

**Fejl ID: TS-003**

  * **Fejlbeskrivelse:** "Duplicate identifier" fejl fra TypeScript compileren, ofte under inkrementelle builds, pga. konflikter mellem globale type-deklarationer.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Du har en custom `apps/api/src/types/express.d.ts` fil[cite: 76].
      * Samtidig har `apps/api/package.json` en devDependency på `@types/express": "^4.17.21"`[cite: 76].
      * Hvis din custom `express.d.ts` forsøger at re-definere eller udvide globale typer på en måde, der konflikter med de officielle `@types/express`, kan TypeScript blive forvirret, især med `skipLibCheck: true` (som er i `packages/tsconfig/base.json` [cite: 76] og `nestjs.json` [cite: 76]) der kan maskere problemet indtil bestemte build-scenarier. `Forkert tilgang.docx` (TS-3) identificerede dette[cite: 1].
  * **Relevante filer/steder:** `apps/api/src/types/express.d.ts`[cite: 76], `apps/api/package.json`[cite: 76], `apps/api/tsconfig.json`[cite: 76].

**Fejl ID: TS-004**

  * **Fejlbeskrivelse:** Typefejl relateret til MUI (v5.14.3 i `apps/web` og `packages/ui` [cite: 76]) og React (v18.2.0, via resolutions [cite: 76]), især med `styled-components` eller Emotion, hvis de bruges forkert sammen, eller hvis `@types/react` versionen ikke er fuldt ud kompatibel med den specifikke MUI version eller dens interne typeafhængigheder.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `packages/ui/package.json` inkluderer `@emotion/react` og `@emotion/styled`[cite: 76]. Korrekt opsætning af ThemeProvider og typning af `sx` props eller `styled()` komponenter er afgørende.
      * Din `.yarnrc.yml` har en `packageExtension` for `@mui/material@*` der specificerer en peerDependency på `@types/react: "*"`[cite: 76]. Dette er en god start, men hvis den løste version af `@types/react` (via resolutions eller hoisting) ikke er 100% kompatibel med MUI v5.14.3's forventninger, kan typefejl opstå.
      * Komplekse komponenter, der overskriver MUI tema-elementer eller bruger avancerede `sx` prop funktioner, kan være sårbare.
  * **Relevante filer/steder:** Alle komponenter i `packages/ui` [cite: 25] og `apps/web` [cite: 25] der bruger MUI, `packages/ui/theme/index.ts`[cite: 76], `apps/web/pages/_app.tsx` [cite: 76] (hvor ThemeProvider typisk sættes op).

**Fejl ID: TS-005**

  * **Fejlbeskrivelse:** Zod valideringsfejl for miljøvariabler, der ikke fanges under build, men først ved runtime i `packages/config/src/env.ts`.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `packages/config/src/env.ts` bruger Zod til at validere `process.env` variabler[cite: 76].
      * Funktionen `parseServerEnv` har en betingelse for `process.env.CI || process.env.NODE_ENV === 'production'` hvor den returnerer dummy-værdier eller de angivne værdier uden at køre `serverSchema.safeParse`[cite: 76], hvis `SKIP_ENV_VALIDATION === 'true'` i produktion[cite: 76]. Hvis `SKIP_ENV_VALIDATION` ikke er sat korrekt i et produktionslignende miljø (f.eks. staging, eller en Docker-build der simulerer produktion), eller hvis dummy-værdierne ikke er tilstrækkelige for visse build-steps af andre pakker, kan fejl opstå.
      * Selve valideringen (kaldet til `serverEnv()`) i `packages/config/src/env.ts` sker ved modul-load[cite: 76]. Hvis en app eller et script importerer dette modul uden at alle nødvendige env-vars er sat (og det ikke er et CI/prod build der skipper validering), vil det kaste en fejl.
  * **Relevante filer/steder:** `packages/config/src/env.ts`[cite: 76], alle `.env` filer (specielt `envfiler.txt` [cite: 76] viser flere), Docker-filer og `docker-compose.yml` [cite: 76] (hvordan env vars injiceres), CI workflows (`.github/workflows/ci.yml` [cite: 76]).

### Kategori 3: Database (Prisma)

**Fejl ID: DB-001**

  * **Fejlbeskrivelse:** Konflikt mellem de to Prisma-opsætninger: én i roden (`prisma/`) og én i `apps/api/prisma/`. Dette kan føre til forvirring om, hvilket skema der er "sandheden", hvilke migrationer der skal køres, og hvilken Prisma Client der genereres og bruges.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `struktur.txt` [cite: 25] og `repomix-output.xml` viser tydeligt to separate `prisma/schema.prisma` filer og to `migrations` mapper[cite: 76].
      * `apps/api/package.json` har scripts der peger på `prisma generate`, `prisma migrate dev` osv., hvilket antageligt bruger `apps/api/prisma/schema.prisma`[cite: 76].
      * Rod `package.json` har også `prisma:*` scripts, der bruger `scripts/prisma-commands.sh`[cite: 76], som `cd apps/api` før den kører Prisma-kommandoer[cite: 76]. Dette indikerer, at `apps/api/prisma` er den primære, men tilstedeværelsen af den anden kan skabe problemer, især hvis VScode-udvidelser eller andre værktøjer automatisk detekterer rod-`prisma`-mappen.
      * `Forkert tilgang.docx` (DB-2) [cite: 1] peger på risiko for `migration_lock.toml` konflikter, især i Docker build-kontekst, hvis begge stier er tilgængelige.
  * **Relevante filer/steder:** `prisma/schema.prisma`[cite: 76], `prisma/migrations/`[cite: 76], `apps/api/prisma/schema.prisma`[cite: 76], `apps/api/prisma/migrations/`[cite: 76], `apps/api/package.json` (prisma scripts)[cite: 76], `scripts/prisma-commands.sh`[cite: 76], `Dockerfile.api` (hvordan Prisma client genereres).

**Fejl ID: DB-002**

  * **Fejlbeskrivelse:** `prisma migrate dev` fejler med "Added the required column … without default value" for `NOT NULL` kolonner.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Flere af dine migrationer i `apps/api/prisma/migrations/`, f.eks. `20250517073440_add_user_auth_fields/migration.sql` (tilføjer `passwordHash TEXT NOT NULL`) [cite: 76] og `20250520211803_add_pensum_and_quiz_models/migration.sql` (tilføjer mange `NOT NULL` felter)[cite: 76], tilføjer nye `NOT NULL` kolonner uden en `DEFAULT` værdi.
      * Hvis der allerede er data i tabellerne, når sådan en migration køres, vil Prisma fejle, da den ikke ved, hvilken værdi den skal sætte for eksisterende rækker. Dette er et kendt Prisma-problem, som påpeget i `Forkert tilgang.docx` (DB-1)[cite: 1].
  * **Relevante filer/steder:** Alle SQL migrationsfiler i `apps/api/prisma/migrations/` [cite: 76] der tilføjer `NOT NULL` kolonner.

**Fejl ID: DB-003**

  * **Fejlbeskrivelse:** Seed-script (`apps/api/prisma/seed.ts`) fejler, især i CI-miljøer, pga. manglende `DATABASE_URL` eller fordi databasen ikke er klar/migreret endnu.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `Seedpensum.txt` [cite: 76] og `apps/api/prisma/seed.ts` [cite: 76] indikerer et komplekst seed-script.
      * GitHub workflow `ci.yml` [cite: 76] definerer `DATABASE_URL_CI` som et secret, men det er ikke klart, om dette secret altid er tilgængeligt for alle jobs, der måtte køre seed-scriptet (f.eks. hvis et web-build-job indirekte trigger seeding).
      * Rod `package.json` scriptet `seed` kører `yarn ensure-db && cd apps/api && yarn seed`[cite: 76]. `ensure-db.sh` [cite: 76] forsøger at starte Docker og oprette databasen. Hvis dette script fejler eller ikke venter længe nok på, at databasen er fuldt initialiseret og migreret, før `yarn seed` køres, vil seedingen fejle.
      * `Forkert tilgang.docx` (DB-3) [cite: 1] nævner, at CI-workflow kun sætter `DB_URL` i `api-ci` jobbet, ikke `web-ci`. Hvis `web-ci` (eller et andet job) forsøger at køre tests, der initialiserer Prisma Client (som kan ske ved import af `@repo/core` hvis den bruger Prisma), kan det fejle.
  * **Relevante filer/steder:** `apps/api/prisma/seed.ts`[cite: 76], `scripts/ensure-db.sh`[cite: 76], `.github/workflows/ci.yml`[cite: 76], `package.json` (seed script)[cite: 76].

**Fejl ID: DB-004**

  * **Fejlbeskrivelse:** Problemer med Prisma Client generation i Docker-miljøer, især hvis `prisma generate` køres på et forkert tidspunkt i Dockerfile ift. kopiering af `schema.prisma` eller `node_modules`.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `Dockerfile.api` kører `yarn workspace api prisma generate` i `builder` stadiet, efter `COPY . .`[cite: 76]. Hvis ændringer i `packages/core` (som kan indeholde delte Prisma-relaterede typer) ikke er bygget *før* Prisma client genereres, eller hvis `schema.prisma` ændres uden at `node_modules/.prisma/client` genopbygges korrekt ift. platformen (Alpine Linux i Docker vs. macOS/Windows lokalt), kan det give runtime fejl.
      * Alpine Linux (brugt i `node:22-alpine` [cite: 76]) kræver specifikke Prisma binary targets (`linux-musl`). Hvis `prisma generate` køres lokalt (ikke-Alpine) og `node_modules` så kopieres ind i Docker-imaget uden en ny `prisma generate` *inde i Alpine-miljøet*, kan det føre til "missing binary" fejl. `Dockerfile.api` ser ud til at håndtere dette korrekt ved at køre `prisma generate` i `builder`-stadiet, som er Alpine-baseret, men det er et kendt problemområde.
  * **Relevante filer/steder:** `Dockerfile.api`[cite: 76], `apps/api/prisma/schema.prisma`[cite: 76].

### Kategori 4: Next.js (Frontend) Specifikke Fejl

**Fejl ID: NEXT-001**

  * **Fejlbeskrivelse:** Konflikter eller uventet opførsel pga. sameksistensen af Next.js Pages Router (`apps/web/pages/`) og App Router (`apps/web/app/`).
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `struktur.txt` [cite: 25] og `repomix-output.xml` [cite: 76] viser, at `apps/web` indeholder både en `pages/` mappe (med f.eks. `_app.tsx`, `index.tsx`, `login.tsx`) og en `app/` mappe (med f.eks. `admin/users/page.tsx`, `search/page.tsx`, `layout.tsx`).
      * Next.js 13.4.12 [cite: 76] understøtter gradvis adoption af App Router, men hvis ruter overlapper (f.eks. en `pages/courses/[slug].tsx` og en `app/courses/[slug]/page.tsx`), kan det føre til build-fejl eller uforudsigelig routing-adfærd. `Forkert tilgang.docx` (N-1) peger på denne risiko[cite: 1].
      * Middleware, datahentning og layout-håndtering er forskellig mellem de to routere, hvilket kan føre til inkonsistenser.
  * **Relevante filer/steder:** `apps/web/pages/`[cite: 25], `apps/web/app/`[cite: 25], `apps/web/next.config.js`[cite: 76].

**Fejl ID: NEXT-002**

  * **Fejlbeskrivelse:** Hydration errors i React/Next.js, hvor server-genereret HTML ikke matcher client-side genereret HTML.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Brug af `useEffect` eller `useState` der modificerer DOM-struktur betinget på klienten uden korrekt håndtering (f.eks. brug af `typeof window !== 'undefined'` tjek før rendering af client-specifikt indhold).
      * Inkonsistent datahentning mellem server-side (SSR/SSG) og client-side, hvis data ændrer sig mellem server-render og client-hydration.
      * Forkert brug af `dangerouslySetInnerHTML` eller tredjepartsbiblioteker, der manipulerer DOM direkte.
      * `apps/web/src/components/layout/Layout.tsx` [cite: 76] og `apps/web/pages/_app.tsx` [cite: 76] er centrale for den overordnede sidestruktur og er steder, hvor sådanne fejl ofte kan introduceres.
  * **Relevante filer/steder:** Alle React-komponenter i `apps/web`[cite: 25], især dem der henter data eller har client-specifik logik. `pages/_app.tsx`[cite: 76], `pages/_document.tsx` (hvis den findes).

**Fejl ID: NEXT-003**

  * **Fejlbeskrivelse:** Problemer med state management (Redux Toolkit via `apps/web/src/store/services/api.ts` [cite: 76]) i SSR/SSG kontekst, f.eks. state-lækage mellem requests eller forkert initialisering af store.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * RTK Query (`createApi`) bruges til datahentning[cite: 76]. Korrekt opsætning for SSR (f.eks. at sikre at store initialiseres per request på serveren og rehydreres korrekt på klienten) er afgørende.
      * Hvis `api.ts` eller `store/index.ts` [cite: 76] ikke håndterer server-side konfiguration korrekt, kan state fra én brugers request potentielt påvirke en anden.
      * `apps/web/pages/_app.tsx` [cite: 76] wrapper applikationen i `<ReduxProvider store={store}>`, hvilket er standard, men den underliggende konfiguration af `makeStore` og `api` skal være SSR-sikker.
  * **Relevante filer/steder:** `apps/web/src/store/index.ts`[cite: 76], `apps/web/src/store/services/api.ts`[cite: 76], `apps/web/pages/_app.tsx`[cite: 76], alle sider der bruger `getServerSideProps` eller `getStaticProps` med Redux.

**Fejl ID: NEXT-004**

  * **Fejlbeskrivelse:** Forkert konfiguration eller brug af `next/image` for billedoptimering, især med eksterne billedkilder eller i Docker-miljøer.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `apps/web` indeholder `next/image`-komponenter (f.eks. i `app/admin/users/[id]/page.tsx` [cite: 76]).
      * Hvis `next.config.js` [cite: 76] ikke korrekt definerer `images.remotePatterns` (eller det ældre `images.domains`) for alle eksterne billedkilder, vil Next.js nægte at optimere dem.
      * I Docker-miljøer kan Next.js' billedoptimeringsservice have problemer, hvis nødvendige biblioteker (som `sharp`'s systemafhængigheder) mangler i Docker-imaget, eller hvis filsystemadgange er begrænsede. `Dockerfile.web` [cite: 76] bruger `node:22-alpine`, som er minimalistisk.
  * **Relevante filer/steder:** `apps/web/next.config.js`[cite: 76], alle steder hvor `<Image />` bruges, `Dockerfile.web`[cite: 76].

### Kategori 5: Build, CI/CD og Docker

**Fejl ID: CI-001**

  * **Fejlbeskrivelse:** GitHub Actions workflow (`.github/workflows/ci.yml`) fejler pga. forkerte cache-nøgler for Yarn 4, forkerte Node.js versioner, eller script-uoverensstemmelser.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Workflow'et bruger `actions/setup-node@v4` med `cache: 'yarn'`[cite: 76]. Yarn 4 ændrede sin cache-struktur (f.eks. `.yarn/cache/*.zip`). Hvis `actions/cache` (som `setup-node` bruger internt) ikke er fuldt opdateret til at håndtere Yarn 4's nye struktur korrekt, kan det give "Integrity checksum failed" eller ineffektiv caching. Dette blev nævnt i `Forkert tilgang.docx` (CI-2)[cite: 1].
      * Workflow'et specificerer `node-version: 22`[cite: 76], mens `stackinfo.txt` [cite: 76] oprindeligt nævnte `20.12.2` og `Forkert tilgang.docx` (CI-3) [cite: 1] pegede på en potentiel konflikt med en CI matrix der brugte Node 16. Det er vigtigt at Node versionen er konsistent mellem lokal udvikling (`.node-version`), Docker (`Dockerfile.api`[cite: 76], `Dockerfile.web` [cite: 76] bruger Node 22) og CI. Hvis der stadig er rester af Node 16 i CI, kan det give problemer med native moduler.
      * Som nævnt i DEP-003 og TOOL-001, bruger `package-scripts.js` [cite: 76] `npm run build` i `out` mappen efter `turbo prune`, hvilket kan fejle med en Yarn-baseret opsætning.
  * **Relevante filer/steder:** `.github/workflows/ci.yml`[cite: 76], `.github/workflows/qodana_code_quality.yml`[cite: 76], `.node-version`[cite: 25], `package-scripts.js`[cite: 76].

**Fejl ID: CI-002**

  * **Fejlbeskrivelse:** `turbo prune` skaber en ufuldstændig eller forkert opsætning i `out` mappen, hvilket fører til build-fejl i CI-jobs, der opererer på denne prunede version.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `package-scripts.js` bruger `npx turbo prune --scope=web` og `--scope=api`[cite: 76].
      * Hvis `turbo.json` [cite: 76] ikke korrekt specificerer alle afhængigheder (inkl. transitive eller devDependencies der er nødvendige for build-processen) for de prunede workspaces, kan de mangle i `out` mappen.
      * Hvis `yarn install --frozen-lockfile` i `out` mappen efter prune ikke kan opløse alle nødvendige pakker pga. en ufuldstændig `yarn.lock` i `out` eller problemer med workspace-links i den prunede kontekst, vil efterfølgende builds fejle.
  * **Relevante filer/steder:** `turbo.json`[cite: 76], `package-scripts.js`[cite: 76], `yarn.lock`[cite: 76].

**Fejl ID: DOCKER-001**

  * **Fejlbeskrivelse:** Prisma Client generation fejler eller virker ikke korrekt inde i Docker containeren pga. mismatch i binary targets (f.eks. `linux-musl` for Alpine vs. `debian-openssl` for andre Linux-distroer).
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `Dockerfile.api` bruger `node:22-alpine` som base image[cite: 76]. Alpine Linux bruger `musl` libc, mens mange andre systemer (inkl. udviklerens lokale maskine) bruger `glibc`.
      * Prisma genererer platformsspecifikke query engine binaries. Hvis `prisma generate` køres på en `glibc`-maskine og `node_modules/.prisma/client` derefter kopieres ind i et `musl`-baseret Docker image (eller omvendt), vil den forkerte binary være til stede.
      * `Dockerfile.api` kører `yarn workspace api prisma generate` *inde i `builder`-stadiet*, som er Alpine-baseret[cite: 76]. Dette er den korrekte tilgang. Fejl kan dog stadig opstå hvis:
          * `schema.prisma` ændres, og `prisma generate` ikke re-køres korrekt under build.
          * `output` for Prisma client i `schema.prisma` er sat til en sti, der ikke er korrekt ift. Docker-konteksten.
          * OpenSSL-versioner er inkompatible. `Dockerfile.api` installerer `openssl` i Alpine[cite: 76]. `Forkert tilgang.docx` (DO-1) [cite: 1] nævner, at Prisma 5.x's pre-built binaries for Alpine linker til OpenSSL 1.1, mens Node 22 Alpine kan have en nyere version. Dette kan kræve, at Prisma bruger `linux-musl-openssl-1.1.x` binary target.
  * **Relevante filer/steder:** `Dockerfile.api`[cite: 76], `apps/api/prisma/schema.prisma` [cite: 76] (især `generator client` blokken med `binaryTargets`), `package.json` (Prisma version).

**Fejl ID: DOCKER-002**

  * **Fejlbeskrivelse:** Nginx reverse proxy (`nginx.conf` [cite: 76]) konfigureret i `docker-compose.yml` [cite: 76] fejler med at proxy'e requests korrekt til API (`:3000`) eller Web (`:3001`) services, især for WebSockets (brugt af Next.js HMR).
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * Din `nginx.conf` (både i `packages/config` og roden [cite: 76]) specificerer `proxy_pass http://api:3000/` og `http://web:3001` (eller `http://localhost:5002` og `http://localhost:3000` for lokal Nginx [cite: 76]). Servicenavne (`api`, `web`) skal matche dem defineret i `docker-compose.yml`.
      * For WebSockets (f.eks. Next.js HMR via `/_next/webpack-hmr`) kræves specifikke `proxy_set_header` direktiver som `Upgrade $http_upgrade` og `Connection "upgrade"`[cite: 76]. Hvis disse mangler eller er forkerte, vil WebSocket-forbindelsen fejle (ofte med 502 Bad Gateway eller 101 Switching Protocols fejl), som nævnt i `Forkert tilgang.docx` (DO-2)[cite: 1].
      * CORS-headers kan også blive et problem, hvis Nginx ikke er konfigureret til at videresende dem korrekt eller selv tilføjer restriktive headers.
  * **Relevante filer/steder:** `nginx.conf` [cite: 76] (i `packages/config` og/eller roden), `docker-compose.yml` [cite: 76] (service navne, port mappings, netværk).

**Fejl ID: DOCKER-003**

  * **Fejlbeskrivelse:** Manglende eller forkert håndtering af environment variables i Docker-containere, hvilket fører til, at applikationerne ikke starter eller opfører sig forkert.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `docker-compose.yml` [cite: 76] definerer environment variables for `api` og `web` services (f.eks. `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`).
      * `Dockerfile.api` og `Dockerfile.web` [cite: 76] sætter også `NODE_ENV=production`.
      * Hvis `.env` filen (som `docker-compose up` kan læse fra) mangler variabler, eller hvis de ikke overføres korrekt til containerne (f.eks. hvis `env_file` direktivet i `docker-compose.yml` ikke bruges eller er forkert), vil applikationerne fejle.
      * `packages/config/src/env.ts` [cite: 76] udfører Zod-validering af env vars. Hvis Docker-miljøet ikke leverer alle påkrævede variabler, vil API'en fejle ved opstart.
  * **Relevante filer/steder:** `docker-compose.yml`[cite: 76], `.env` (rod), `Dockerfile.api`[cite: 76], `Dockerfile.web`[cite: 76], `packages/config/src/env.ts`[cite: 76].

### Kategori 6: Specifikke Linting og Kodekvalitetsfejl (fra `code-review-issues.md`)

**Fejl ID: LINT-001**

  * **Fejlbeskrivelse:** Ubrugte variabler og imports i `apps/api`.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `code-review-issues.md` [cite: 76] lister specifikt:
          * `CsrfMiddleware` defineret men ikke brugt i `apps/api/src/app.module.ts`.
          * `consumer` defineret men ikke brugt i `apps/api/src/app.module.ts`.
          * `Matches` defineret men ikke brugt i `apps/api/src/auth/dto/login.dto.ts`.
          * Ubrugte dekonstruerede variabler i `apps/api/src/auth/strategies/jwt/jwt.ts`.
          * `User` import ubrugt i `apps/api/src/controllers/quizAttempt.controller.ts` og `userProgress.controller.ts`.
      * Disse er typiske under udvikling, men bør rettes for at forbedre kodekvalitet og reducere forvirring.
  * **Relevante filer/steder:** De specifikke filer nævnt ovenfor i `apps/api`[cite: 76].

**Fejl ID: LINT-002**

  * **Fejlbeskrivelse:** ESLint-advarsler for `react-hooks/exhaustive-deps` i `apps/web`.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `backlog.txt` (P1 - fix(web): Resolve ESLint warnings for react-hooks/exhaustive-deps) [cite: 76] identificerer dette som et kendt problem.
      * Manglende dependencies i `useEffect`, `useCallback`, `useMemo` hooks kan føre til stale closures og uforudsigelig opførsel.
  * **Relevante filer/steder:** `apps/web/app/admin/groups/[id]/page.tsx`, `apps/web/app/admin/users/[id]/page.tsx`, `apps/web/app/admin/users/page.tsx`, `apps/web/app/search/page.tsx`, `apps/web/pages/admin/user-groups/index.tsx`, `apps/web/src/contexts/ProgressContext.tsx`[cite: 76].

**Fejl ID: LINT-003**

  * **Fejlbeskrivelse:** Brug af `<img>` tags i stedet for Next.js `<Image>` komponenten i `apps/web`.
  * **Hvorfor muligt i din kodebase (LearningLab):**
      * `backlog.txt` (P1 - fix(web): Replace \<img\> with Next.js Image component) [cite: 76] identificerer dette.
      * Manglende brug af `<Image>` går glip af Next.js' automatiske billedoptimering (størrelse, format, lazy loading).
  * **Relevante filer/steder:** Filer nævnt i `backlog.txt`[cite: 76], f.eks. `app/admin/groups/[id]/page.tsx` og andre admin-sider.

-----

Dette er en første, omfattende gennemgang. Listen er lang, men den afspejler kompleksiteten i dit system og de mange potentielle faldgruber. Næste skridt, når du er klar, er at jeg for hvert relevant punkt kan begynde at generere:

1.  **Trigger-tekst / fejlkode** (hvordan fejlen typisk viser sig).
2.  En **Master-AI-prompt** (klar til at blive brugt i Cursor/Trae for at bede AI'en om at diagnosticere/rette fejlen specifikt i din kontekst).
3.  **Patch-/kommando-skabeloner** (eksempler på, hvordan en løsning kan se ud).

Gennemgå venligst listen, og lad mig vide, om der er punkter, du mener er mindre relevante, eller om der er noget, jeg har overset baseret på din dybere viden om projektet.