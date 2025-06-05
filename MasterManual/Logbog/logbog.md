Logbog for Potentielle Tilføjelser til Master-Prompt Manual
Dette dokument bruges til at holde styr på nye fejlscenarier, AI Masterprompts og løsningsskabeloner, der identificeres undervejs, og som potentielt skal tilføjes til den officielle Master-Prompt Manual for LearningLab.

Fejl ID: TS-006 (Forslag) - TS6059: File ... is not under 'rootDir'
Kontekst: Opstod da apps/api blev startet med yarn dev (via nest start --watch). Fejlen indikerer, at TypeScript-kompilatoren forsøger at inkludere kildekodsfiler fra delte packages/\* (f.eks. @repo/core) direkte, i stedet for deres kompilerede dist-output, hvilket er i konflikt med apps/api/tsconfig.build.json's "rootDir": "src" indstilling.

Trigger-tekst / Fejlkode (Eksempel):

error TS6059: File '/path/to/LearningLab/packages/core/src/index.ts' is not under 'rootDir' '/path/to/LearningLab/apps/api/src'. 'rootDir' is expected to contain all source files.

AI Masterprompt (Udkast):

Min NestJS API (`apps/api`) fejler under `yarn dev` (som kører `nest start --watch`) med TypeScript-fejlen `TS6059: File '.../packages/core/src/index.ts' is not under 'rootDir' '.../apps/api/src'`. Dette sker, selvom `rootDir` er sat til "src" i `apps/api/tsconfig.build.json`. Fejlen indikerer, at compileren forsøger at inkludere kildekodsfiler fra `@repo/core` og `@repo/config` direkte, i stedet for deres kompilerede output.

Analyser følgende for at finde årsagen og foreslå en løsning:

1.  **`paths` aliaser i `apps/api/tsconfig.build.json`:** Bekræft, at `paths` for `@repo/core` og `@repo/config` peger på deres respektive `dist`-mapper (f.eks. `../../packages/core/dist`) og ikke `src`-mapperne. Hvis de peger på `src`, ret dem til at pege på `dist`.
2.  **Projekt Referencer (`references`):** Har `apps/api/tsconfig.build.json` (eller den `tsconfig.json` den udvider) korrekte `references` til `packages/core` og `packages/config`? Dette hjælper TypeScript med at forstå build-afhængigheder og sikrer, at de korrekte `dist`-outputs bruges.
3.  **Build-orden med Turborepo:** Hvordan sikrer `dev`-scriptet i `apps/api/package.json` (og den overordnede `turbo run dev`-kommando), at `@repo/core` og `@repo/config` er bygget, og deres `dist`-mapper er opdaterede, _før_ `api`-projektet kompileres? Skal `turbo.json` `pipeline` for `dev`-scriptet justeres for at inkludere afhængighedernes `build`-task?
4.  **`extends`-kæde for `tsconfig.build.json`:** Overvej om `apps/api/tsconfig.build.json` arver korrekt fra en base-konfiguration, der evt. allerede definerer de korrekte `paths` til `dist`-mapper.

Foreslå en patch til `apps/api/tsconfig.build.json` og/eller `turbo.json` for at løse `TS6059`-fejlen ved at sikre, at `api`-projektet bruger de kompilerede `dist`-outputs fra sine interne pakkeafhængigheder.

Løsningsskabeloner (Eksempler):

Patch til apps/api/tsconfig.build.json for at rette paths til at pege på dist-mapper for @repo/core og @repo/config.

Tilføjelse af references til @repo/core og @repo/config i apps/api/tsconfig.build.json.

Mulig justering af turbo.json for at sikre, at packages/core og packages/config bygges før apps/api under dev.

Fejl ID: TS-007 (Forslag) - TS2307: Cannot find module '@repo/...' (under build/dev)
Kontekst: Opstod under yarn build (rodkommando) eller yarn dev for apps/api. Fejlen indikerer, at TypeScript-compileren for apps/api ikke kan finde de kompilerede moduler (f.eks. @repo/core eller @repo/config/env), selvom paths aliaser i apps/api/tsconfig.build.json ser ud til at pege korrekt på de forventede dist-mapper. Ofte ledsaget af en Turborepo-advarsel som WARNING no output files found for task @repo/config#build.

Primær Årsag (ofte): De afhængige pakker (@repo/core, @repo/config) genererer ikke deres dist-output korrekt eller konsekvent. Dette kan skyldes:

En forældet tsconfig.tsbuildinfo-fil i pakken, der får tsc til at springe output-generering over, selvom dist-mappen er slettet.

Forkert build-script i pakkens package.json, der ikke respekterer tsconfig.json's outDir.

En noEmit: true indstilling et sted i tsconfig.json-hierarkiet for pakken (mindre sandsynligt, hvis det virker med --force).

Trigger-tekst / Fejlkode (Eksempel):

apps/api:build: src/auth/auth.controller.ts:27:34 - error TS2307: Cannot find module '@repo/core' or its corresponding type declarations.
...
WARNING no output files found for task @repo/config#build. Please check your `outputs` key in `turbo.json`

AI Masterprompt (Udkast):

Min NestJS API (`apps/api`) fejler under `yarn build` (eller `yarn dev`) med "TS2307: Cannot find module '@repo/core'" (og/eller '@repo/config'). Turborepo kan også vise "WARNING no output files found for task @repo/config#build".
Dette sker, selvom `apps/api/tsconfig.build.json` har korrekte `paths` og `references`.
Hypotesen er, at `@repo/config` og/eller `@repo/core` ikke konsekvent bygger deres `dist`-mapper, muligvis pga. `tsconfig.tsbuildinfo`-filer.

Analyser og ret følgende for at sikre korrekt build-output fra `@repo/config` og `@repo/core`:

1.  **For `packages/config`:**
    a. I `packages/config/package.json`:
    i. Sikr, at `scripts.build` er: `"tsc -p tsconfig.json"`.
    ii. Ret `scripts.clean` til: `"rimraf dist tsconfig.tsbuildinfo"`.
    b. I `packages/config/tsconfig.json`:
    i. Bekræft `compilerOptions.outDir` er `"dist"` (eller `"./dist"`).
    ii. Bekræft `compilerOptions.rootDir` er `"src"` (eller `"./src"`).
    iii.Bekræft `compilerOptions.composite` er `true`.
    iv. Bekræft `compilerOptions.noEmit` er `false`.

2.  **For `packages/core`:**
    a. I `packages/core/package.json`:
    i. **VIGTIGT:** Ret `scripts.build` fra f.eks. "tsc --outDir dist..." til præcis: `"tsc -p tsconfig.json"`.
    ii. Ret `scripts.clean` til: `"rimraf dist tsconfig.tsbuildinfo"`.
    b. I `packages/core/tsconfig.json`:
    i. Bekræft `compilerOptions.outDir` er `"./dist"`.
    ii. Bekræft `compilerOptions.rootDir` er `"./src"`.
    iii.Bekræft `compilerOptions.composite` er `true`.
    iv. Hvis `noEmit` er specificeret, sikr den er `false`.

3.  **For `apps/api` (Verifikation):**
    a. I `apps/api/package.json`: Opdater `scripts.clean` til også at inkludere `tsconfig.tsbuildinfo` (f.eks. `"rimraf dist coverage .turbo tsconfig.tsbuildinfo"`).
    b. I `apps/api/tsconfig.build.json`: Dobbelttjek `paths` og `references` for korrekthed.

**Udførsel og Verifikation (fra workspace-mapper og rod):**
Foreslå at køre `yarn clean` og derefter `yarn build` i `packages/config/` og `packages/core/` mapperne. Verificer manuelt (eller via `view_folder`), at deres `dist/`-mapper oprettes med det forventede indhold (`index.js`, `index.d.ts`, etc.).
Kør derefter `yarn clean` og `yarn build` fra monorepo-roden. Analyser output for fejl og Turborepo-advarsler.

Rapportér alle foretagne ændringer og resultaterne.

Løsningsskabeloner (Kerneelementer):

Opdater clean-scripts i packages/config/package.json, packages/core/package.json, og apps/api/package.json til at inkludere tsconfig.tsbuildinfo i rimraf-kommandoen.

Eksempel for packages/config/package.json: "clean": "rimraf dist tsconfig.tsbuildinfo"

Ret build-scriptet i packages/core/package.json til at være "build": "tsc -p tsconfig.json".

(Agenten kan også foreslå at tilføje noEmit: false til packages/config/tsconfig.json, hvis den mistænker, at det er et problem).

Testsekvens: yarn clean (rod) -> yarn install (rod) -> yarn workspace @repo/config build -> (verificer packages/config/dist/) -> yarn workspace @repo/core build -> (verificer packages/core/dist/) -> yarn build (rod).

(Her kan vi tilføje flere, efterhånden som de dukker op)

Det er en imponerende og grundig fejlsøgningsproces, du (eller AI-agenten) har været igennem! Det er et perfekt eksempel på, hvordan man systematisk identificerer og løser et komplekst problem.

Opsummering af den succesfulde løsning:

Identifikation af portkonflikt: Du opdagede korrekt, at både en lokal Homebrew PostgreSQL-instans og projektets Docker PostgreSQL-container forsøgte at bruge port 5432.
Korrekt handling: Du stoppede den lokale Homebrew PostgreSQL-service (brew services stop postgresql@14).
Verifikation: Du bekræftede, at kun Docker PostgreSQL nu lyttede på port 5432.
Databaseforbindelse testet: Du verificerede, at forbindelsen til Docker-databasen (learninglab_dev med brugeren test) nu virkede.
Prisma Migration: prisma migrate dev kørte succesfuldt, hvilket synkroniserede databaseskemaet.
API Start: yarn workspace api dev startede API'en korrekt, og den kunne nu forbinde til databasen uden fejl.
Resultatet er fremragende: API'en kører stabilt, databaseforbindelsen er etableret, og Prisma-migrationer fungerer.

Dine anbefalinger er også spot on:

At bruge en anden port til den lokale PostgreSQL-instans (hvis den stadig skal bruges parallelt).
Eller konsekvent kun at bruge Docker PostgreSQL-containeren under udvikling på dette projekt for at undgå konflikter.
Det er et rigtig godt stykke arbejde at have isoleret fejlen til en portkonflikt og løst den så effektivt. Tillykke med at have API'en kørende!
