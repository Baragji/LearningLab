## Kategori 1: Afhængigheder, Modulopløsning og Værktøjskæde

### Fejl ID: DEP-001

- **Trigger-tekst / Fejlkode:**
  - `Error: Cannot find module 'some-package'`
  - `Module not found: Can't resolve 'some-package' in '/path/to/project/apps/web'`
  - Fejl under `yarn build`, `next build`, `nest build`, eller ved runtime start af en applikation.
- **AI Masterprompt:**

  ```
  Min [Next.js web-app i `apps/web` / NestJS API i `apps/api`] fejler med en "Module not found" fejl for pakken '[indsæt pakkenavn her]', selvom jeg mener, den burde være tilgængelig. Projektet bruger Yarn 4.x med `nodeLinker: node-modules` og `pnpMode: loose` i `.yarnrc.yml`.

  Analysér følgende for at finde årsagen:
  1.  Er pakken korrekt deklareret som en dependency (eller devDependency hvis relevant) i den fejlendes workspace's `package.json` (`apps/web/package.json` eller `apps/api/package.json`)?
  2.  Er pakken korrekt installeret og tilgængelig i `node_modules` hierarkiet for det pågældende workspace? Undersøg `yarn.lock` og den faktiske `node_modules` struktur.
  3.  Kan `pnpMode: loose` i `.yarnrc.yml` forårsage uventet PnP-lignende opløsningsadfærd for denne specifikke pakke eller dens transitive afhængigheder?
  4.  Hvis det er en intern workspace-pakke (f.eks. fra `packages/*`), er dens `package.json` `exports` eller `main` felt korrekt konfigureret, og er den bygget korrekt (tjek `dist` mappe)? Specifikt for `@repo/core` og `@repo/config`, tjek deres `dist` output og `package.json` `main`/`types` felter.
  5.  Er der nogen specifikke konfigurationer i `apps/web/next.config.js` (for web) eller `apps/api/webpack-hmr.config.js` / `apps/api/nest-cli.json` (for api), der kunne påvirke modulopløsningen for denne pakke?
  6.  Er der kendte kompatibilitetsproblemer mellem denne pakke og Next.js 13.4.12 / NestJS 10.3.10, især i en monorepo-kontekst med Yarn?

  Foreslå en konkret løsning, f.eks. en patch til `package.json`, en justering i `.yarnrc.yml`, eller en ændring i build-konfigurationen.
  ```

- **Løsningsskabeloner (Eksempler):**
  - **Tilføj manglende dependency:**
    ```bash
    yarn workspace [app-name] add [pakkenavn]
    # Eller for dev dependency:
    yarn workspace [app-name] add -D [pakkenavn]
    ```
  - **Juster `.yarnrc.yml` for specifik pakke (hvis PnP-relateret):**
    ```yaml
    # .yarnrc.yml
    packageExtensions:
      "[pakkenavn]@*":
        dependencies:
          # Tilføj evt. manglende peer dependencies her
        # Eller for at tvinge node-modules resolution for denne pakke specifikt:
        # pnpMode: node-modules # (Dette er avanceret og skal bruges med forsigtighed)
    ```
  - **Korrekt eksport fra intern pakke (`packages/core/package.json`):**
    ```json
    {
      "name": "@repo/core",
      "version": "0.0.0",
      "private": true,
      "main": "./dist/index.js", // Sørg for at dette peger på den korrekte build output
      "types": "./dist/index.d.ts", // Sørg for at dette peger på den korrekte type-definition
      "exports": {
        ".": "./dist/index.js", // Standard eksport
        "./types": "./dist/types/index.js", // Eksempel på subpath for typer
        "./utils": "./dist/utils/index.js" // Eksempel på subpath for utils
      },
      "scripts": {
        "build": "tsc --outDir dist --declaration --declarationMap" // Sørg for at build-scriptet genererer korrekte output-stier
        // ...
      }
    }
    ```

### Fejl ID: DEP-002

- **Trigger-tekst / Fejlkode:**
  - Typefejl under `tsc` eller i IDE'en, der indikerer uoverensstemmelse mellem versioner af samme type fra forskellige pakker (f.eks. `Type 'X' is not assignable to type 'X'. Two different types with this name exist, but they are unrelated.`).
  - Linting-fejl relateret til version-specifikke regler (f.eks. en ESLint-plugin-regel der kun gælder for en bestemt version af React).
  - Subtile runtime-bugs hvor en funktion opfører sig anderledes end forventet pga. forkert version af en dependency.
- **AI Masterprompt:**

  ```
  Jeg oplever [typefejl / linting-fejl / runtime-bugs] i mit [apps/web / apps/api / packages/ui] workspace, som jeg mistænker skyldes inkonsistente versioner af pakken '[indsæt pakkenavn, f.eks. react, @types/react, eslint-plugin-react, typescript]'.
  Mit monorepo bruger Yarn 4.x og har `resolutions` i rod `package.json` for `@types/react` (til "18.2.18") og `typescript` (til "5.3.3").

  Analysér følgende:
  1.  Kør `yarn why [pakkenavn]` i det berørte workspace og i roden for at se, hvilke versioner der er installeret, og hvorfor. Vær opmærksom på, om `resolutions` respekteres.
  2.  Gennemgå `package.json` i alle workspaces (`apps/*`, `packages/*`) for at identificere alle deklarerede versioner af '[pakkenavn]' og relaterede pakker (f.eks. `@types/[pakkenavn]`).
  3.  Er der behov for at tilføje/justere `resolutions` i rod `package.json` for at tvinge en enkelt version af '[pakkenavn]' eller dens relaterede type-pakker?
  4.  Kan `packageExtensions` i `.yarnrc.yml` bruges til at rette op på peer dependency-krav for pakker, der afhænger af '[pakkenavn]' og kræver en specifik, men afvigende, version?
  5.  Hvordan påvirker `turbo.json` build-ordenen og cachen ift. potentielt forskellige interne versioner af denne pakke under build af forskellige workspaces? Er der en risiko for, at et workspace bygges med én version, mens et andet, der afhænger af det, forventer en anden?
  6.  Tjek for version-mismatches i ESLint plugins og parsers (f.eks. `@typescript-eslint/eslint-plugin` og `@typescript-eslint/parser` i `apps/api/.eslintrc.js` og `apps/web/.eslintrc.js` vs. den globale TypeScript-version).

  Foreslå en patch til de relevante `package.json` filer eller `.yarnrc.yml` for at harmonisere versionerne af '[pakkenavn]' på tværs af hele monorepoet. Forklar også eventuelle nødvendige oprydningskommandoer (f.eks. `yarn cache clean`, `find . -name node_modules -type d -prune -exec rm -rf '{}' +`, `yarn install`).
  ```

- **Løsningsskabeloner (Eksempler):**
  - **Tilføj/juster `resolutions` i rod `package.json`:**
    ```json
    // package.json (rod)
    {
      "resolutions": {
        "react": "18.2.0",
        "@types/react": "18.2.18",
        "@types/react-dom": "18.2.18",
        "typescript": "5.3.3",
        "@typescript-eslint/eslint-plugin": "^6.2.1", // Match med parser
        "@typescript-eslint/parser": "^6.2.1" // Match med plugin
      }
    }
    ```
  - **Brug `packageExtensions` i `.yarnrc.yml` for peer dependencies:**
    ```yaml
    # .yarnrc.yml
    packageExtensions:
      "some-package-expecting-older-types@*":
        peerDependenciesMeta:
          "@types/react":
            optional: true # Hvis pakken kan fungere uden, eller du håndterer typerne anderledes
      "another-package@*":
        dependencies:
          "react": "$react" # Brug en variabel for at pege på den løste version
    ```
  - **Oprydningskommandoer:**
    ```bash
    yarn cache clean
    find . -name node_modules -type d -prune -exec rm -rf '{}' + # Slet alle node_modules
    yarn install --check-cache # --check-cache kan hjælpe med at fange korrupte cache entries
    ```

### Fejl ID: DEP-003

- **Trigger-tekst / Fejlkode:**
  - Et workspace bygger fint lokalt, men fejler i CI (især efter `turbo prune`) med "Module not found" for en pakke, der ikke er direkte i dets `package.json`.
  - `npm run build` (som brugt i `package-scripts.js` efter prune) fejler med at finde et script eller en pakke, der var tilgængelig via Yarn hoisting.
- **AI Masterprompt:**

  ```
  Mit CI build for workspacet '[apps/web eller apps/api]' fejler efter `turbo prune` med en "Module not found" for pakken '[pakkenavn]', eller `npm run build` scriptet fejler. Lokalt virker det fint. Jeg mistænker en "phantom dependency".
  Projektet bruger Yarn 4.x (med `nodeLinker: node-modules`). CI-processen (defineret i `.github/workflows/ci.yml` og `package-scripts.js`) bruger `turbo prune --scope=[workspace]` efterfulgt af `cd out && yarn install --frozen-lockfile && npx nps build.ci.[workspace]` (hvor `build.ci` i `package-scripts.js` internt kalder `npm run build` for `web` og `api`).

  Analyser:
  1.  Er '[pakkenavn]' en direkte dependency eller devDependency i `[workspace]/package.json`?
  2.  Hvis nej, hvilket andet workspace eller rod `package.json` trækker '[pakkenavn]' ind, så den er tilgængelig via hoisting lokalt? Brug `yarn why [pakkenavn]` til at spore dette.
  3.  Hvordan sikrer `turbo.json` (pipeline for `build` og `prepare.ci`) at alle *nødvendige* (ikke kun direkte) dependencies er tilgængelige for build-processen i den prunede `out` mappe? Er der `dependsOn: ["^build"]` for interne pakker?
  4.  Kan skiftet fra `yarn install` til `npm run build` i `package-scripts.js` (efter prune) forårsage problemer, hvis scripts i det prunede workspace's `package.json` er Yarn-specifikke eller stoler på Yarn's hoisting-adfærd for bin-stier?

  Foreslå den korrekte måde at deklarere '[pakkenavn]' på i `[workspace]/package.json` og/eller justeringer til `package-scripts.js` for at bruge `yarn` konsekvent i CI.
  ```

- **Løsningsskabeloner (Eksempler):**
  - **Tilføj eksplicit dependency:**
    ```bash
    yarn workspace [workspace-navn] add [pakkenavn]
    # Eller hvis det er en build-time dependency for det specifikke workspace
    yarn workspace [workspace-navn] add -D [pakkenavn]
    ```
  - **Juster `package-scripts.js` til at bruge Yarn (anbefalet):**
    ```javascript
    // package-scripts.js (uddrag for build.ci)
    // ...
    build: {
      // ...
      ci: {
        web: "cd out && yarn build", // Ændret fra npm run build
        api: "cd out && yarn build", // Ændret fra npm run build
      },
    },
    // ...
    ```
  - **Sørg for at `package.json` scripts er kompatible med både Yarn og NPM, eller brug kun Yarn.**

### Fejl ID: TOOL-001

- **Trigger-tekst / Fejlkode:**
  - CI-fejl: `npm ERR! missing script: build` eller `npm ERR! code ELIFECYCLE` efter `turbo prune` og `yarn install` er kørt i `out` mappen, når `package-scripts.js` forsøger at køre `npm run build`.
  - CI-fejl relateret til at `npm` ikke kan finde bin-filer fra pakker installeret med Yarn i den prunede workspace.
- **AI Masterprompt:**

  ```
  Mit CI-workflow (defineret i `.github/workflows/ci.yml` og orkestreret via `package-scripts.js`) bruger `npm run build` i `out`-mappen efter `turbo prune --scope=[app]` og `cd out && yarn install --frozen-lockfile`.
  Projektet er primært et Yarn 4.x-projekt med en `yarn.lock`-fil. Jeg er bekymret for, at skiftet til `npm run build` i denne kontekst kan give problemer, som beskrevet i `Forkert tilgang.docx` (CI-1).

  Analyser:
  1.  Gennemgå `scripts`-sektionen i `apps/api/package.json` og `apps/web/package.json`. Er `build`-scriptet (og eventuelle underscripts det kalder) skrevet, så det er kompatibelt med både `yarn run build` og `npm run build`?
  2.  Hvis scriptsene bruger Yarn-specifikke features eller kommandoer (f.eks. `yarn workspace ...` internt, eller stoler på Yarn's specifikke håndtering af `NODE_PATH` eller `PATH` for bin-filer), vil de fejle med `npm run`.
  3.  Hvordan håndterer `npm run build` bin-stier for dependencies installeret med `yarn install --frozen-lockfile` i den prunede `out`-mappe? Kan der opstå konflikter eller manglende adgang til korrekte bin-filer?

  Foreslå en rettelse til `package-scripts.js` for at bruge `yarn` konsekvent til at køre scripts i CI-miljøet efter `turbo prune`. Alternativt, forklar hvordan `package.json` scripts kan gøres kompatible med begge package managers, selvom konsistent brug af Yarn anbefales.
  ```

- **Løsningsskabeloner (Eksempler):**
  - **Opdater `package-scripts.js` til at bruge `yarn` (anbefalet):**
    ```javascript
    // package-scripts.js
    // ...
    module.exports = {
      scripts: {
        // ...
        build: {
          // ...
          ci: {
            // Sørg for at 'out' mappen indeholder en gyldig package.json og yarn.lock
            // efter 'turbo prune' og 'yarn install' i prepare.ci steppet.
            web: "cd out && yarn workspace web build", // Brug yarn workspace for at sikre korrekt kontekst
            api: "cd out && yarn workspace api build", // Brug yarn workspace for at sikre korrekt kontekst
          },
        },
        // ...
      },
    };
    ```
    _Bemærk: For at `yarn workspace [navn] build` skal virke i `out` mappen, skal `out/package.json` (genereret af `turbo prune`) indeholde workspaces-definitionen, eller også skal kommandoen køres fra `out`-mappens rod med `yarn build` hvis scriptet er defineret i `out/package.json`'s rod-scripts._
    _En mere robust tilgang i `package-scripts.js` for CI build i `out` mappen:_
    ```javascript
    // package-scripts.js
        build: {
          ci: {
            // Antager at 'out' mappen er roden for den prunede applikation
            // og 'yarn install' allerede er kørt der.
            web: "cd out && yarn build", // Hvis 'build' scriptet er i 'out/package.json'
            api: "cd out && yarn build", // Hvis 'build' scriptet er i 'out/package.json'
          }
        }
    ```
    _Sørg for, at `build`-scriptet i `apps/web/package.json` og `apps/api/package.json` er korrekt:_
    ````json
    // apps/web/package.json
    {
      "name": "web",
      // ...
      "scripts": {
        "build": "next build"
        // ...
      }
    }
    ```json
    // apps/api/package.json
    {
      "name": "api",
      // ...
      "scripts": {
        "build": "nest build"
        // ...
      }
    }
    ````

---
