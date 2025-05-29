
## Kategori 5: Build, CI/CD og Docker

### Fejl ID: CI-001
* **Trigger-tekst / Fejlkode:**
    * GitHub Actions workflow fejler under "Install dependencies" eller "Build" steps.
    * Fejlmeddelelser som `Integrity checksum failed`, `Error: Node.js version [X] does not satisfy requirement [Y]`, eller script-fejl pga. uoverensstemmelse mellem `npm` og `yarn`.
* **AI Masterprompt:**
    ```
    Min GitHub Actions CI-pipeline (`.github/workflows/ci.yml`) fejler under [dependency installation / build / test].
    Workflow'et bruger `actions/setup-node@v4` med `node-version: 22` og `cache: 'yarn'`.
    Projektet bruger Yarn 4.x, og `package-scripts.js` bruges til at orkestrere nogle CI-kommandoer, hvor det tidligere har brugt `npm run` i stedet for `yarn run` efter `turbo prune`.

    Analyser følgende:
    1.  **Node.js Version:** Er Node.js versionen (22) i CI konsistent med `.node-version` filen (22) og `package.json` `engines` feltet (>=22 <23)? Er der risiko for, at en ældre Node-version utilsigtet bruges i et job (f.eks. hvis `qodana_code_quality.yml` specificerer en anden version)?
    2.  **Yarn Cache:** Fungerer `actions/setup-node@v4` med `cache: 'yarn'` korrekt for Yarn 4.x's cache-struktur? Er der tegn på cache-korruption eller ineffektivitet?
    3.  **Script Konsistens (`package-scripts.js` vs. `yarn`):** Er alle scripts, der køres i CI (især efter `turbo prune` i `out` mappen), nu konsekvent kaldt med `yarn` (f.eks. `yarn build`, `yarn test:ci`) i stedet for `npm run`? (TOOL-001 dækkede dette, men det er værd at genbesøge i CI-kontekst).
    4.  **`turbo prune` og Dependencies:** Sikrer `turbo prune` (som brugt i `package-scripts.js` `prepare.ci` steps) at *alle* nødvendige dependencies (inkl. devDependencies der kræves for build) er til stede i `out` mappen, og at `yarn install --frozen-lockfile` i `out` mappen fungerer korrekt?
    5.  **Qodana Workflow (`qodana_code_quality.yml`):** Bruger dette workflow den korrekte Node.js version og JDK (`projectJDK: "21"` er specificeret i `qodana.yaml`)? Kan Qodana's analyse fejle pga. forkerte miljøopsætninger?

    Foreslå rettelser til `.github/workflows/ci.yml`, `qodana_code_quality.yml`, `package-scripts.js`, eller `turbo.json` for at sikre en stabil og korrekt CI-pipeline.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Sikre konsistent Node.js version i alle workflows:**
        ```yaml
        # .github/workflows/ci.yml og qodana_code_quality.yml
        # ...
        steps:
          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version-file: '.node-version' # Læs fra .node-version filen
              cache: 'yarn'
        # ...
        ```
    * **Forbedret Yarn caching (hvis `setup-node` ikke er nok):**
        ```yaml
        # .github/workflows/ci.yml
        # ...
        - name: Get yarn cache directory path
          id: yarn-cache-dir-path
          run: echo "dir=$(yarn cache dir)" >> $GITHUB_OUTPUT

        - name: Cache yarn dependencies
          uses: actions/cache@v3 # Eller nyere version
          id: yarn-cache
          with:
            path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
            key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
            restore-keys: |
              ${{ runner.os }}-yarn-
        # ...
        # Kør `yarn install --immutable` efter cache restore/save
        ```
    * **Sikre Yarn bruges i `package-scripts.js` (gentagelse fra TOOL-001 for klarhed):**
        ```javascript
        // package-scripts.js (uddrag for build.ci)
        ci: {
          web: "cd out && yarn build",
          api: "cd out && yarn build",
        },
        ```

### Fejl ID: CI-002
* **Trigger-tekst / Fejlkode:**
    * CI build fejler i et `turbo prune`'d workspace (`out` mappen) med fejl som `Cannot find script "build"` eller `Module not found` for en dependency der burde være der.
    * Forskellig opførsel mellem `turbo run build` i roden og build i den prunede `out` mappe.
* **AI Masterprompt:**
    ```
    Mit CI-workflow bruger `turbo prune --scope=[app]` til at isolere et workspace (f.eks. `apps/web`) i en `out`-mappe, hvorefter `yarn install --frozen-lockfile` og `yarn build` (via `package-scripts.js`) køres i denne `out`-mappe.
    Jeg oplever, at buildet fejler i `out`-mappen, selvom `turbo run build --filter=[app]` virker fint i roden af monorepoet.

    Analyser følgende:
    1.  **`turbo.json` `pipeline` for `build`:**
        * Har `build`-tasken for det prunede workspace (f.eks. `web#build`) korrekte `dependsOn` (især `^build` for at bygge interne package dependencies først)?
        * Er `outputs` for interne pakker (f.eks. `packages/core`, `packages/ui`) korrekt specificeret, så `turbo` ved, hvilke artefakter der skal kopieres til `out`-mappen for det prunede workspace?
    2.  **`package.json` i det prunede workspace:** Når `turbo prune` genererer `out/package.json`, indeholder den alle nødvendige `dependencies` og `devDependencies` (hvis de er nødvendige for build-processen, f.eks. `typescript`, `next`, `nest`)?
    3.  **`yarn.lock` i `out`-mappen:** Genereres `out/yarn.lock` korrekt af `turbo prune`, og respekterer `yarn install --frozen-lockfile` i `out` mappen denne låsefil og de prunede afhængigheder?
    4.  **Sti-opløsning i `out`-mappen:** Hvis det prunede workspace's `tsconfig.json` eller `next.config.js` bruger relative stier til andre pakker i monorepoet (f.eks. `../../packages/core`), fungerer disse stier stadig korrekt fra `out/apps/[appname]`-konteksten? `turbo prune` bør omskrive disse.

    Foreslå justeringer til `turbo.json` (f.eks. `pipeline.[task].outputs` for `packages/*`) eller build scripts for at sikre, at den prunede `out`-mappe er en fuldt funktionel, isoleret version af workspacet.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Korrekt `outputs` for interne pakker i `turbo.json`:**
        ```json
        // turbo.json
        {
          "pipeline": {
            "build": { // Generel build task
              "dependsOn": ["^build"],
              "outputs": ["dist/**", ".next/**", "storybook-static/**"]
            },
            "core#build": { // Specifik for @repo/core
              "dependsOn": ["^build"],
              "outputs": ["dist/**"] // Sørg for at `dist` er outputtet
            },
            "ui#build": { // Specifik for @repo/ui (selvom den har "No build step")
              "outputs": [] // Hvis den vitterligt ingen output har der skal caches/kopieres
            },
            // ... andre specifikke build tasks
          }
        }
        ```
        *Vigtigt: `turbo prune` bruger `outputs` til at vide, hvad der skal kopieres. Hvis en pakke som `@repo/ui` reelt set ikke har et build-step, men dens filer skal kopieres, kan det være nødvendigt at definere en "build" task for den i `turbo.json` der blot har `outputs: ["components/**", "index.tsx", osv.]` for at specificere hvilke kilde-filer der skal med.*
    * **Sikre at `devDependencies` nødvendige for build er med:**
        * `turbo prune` forsøger at være smart ift. devDependencies. Hvis en devDependency (som `typescript`) er nødvendig for `build`-scriptet i `apps/web/package.json`, skal den være listet der, og ikke kun i rod-`package.json`.

### Fejl ID: DOCKER-001
* **Trigger-tekst / Fejlkode:**
    * Runtime fejl i Docker container: `Error: Query engine library for current platform "linux-musl-openssl-x.x.x" could not be found.`
    * `Invalid `prisma.generate()` invocation:` efterfulgt af platform-relaterede fejl.
    * Langsom opstart af API i Docker pga. Prisma forsøger at downloade query engine.
* **AI Masterprompt:**
    ```
    Min NestJS API (`apps/api`) har problemer med Prisma Client i Docker-miljøet. Jeg bruger `node:22-alpine` som base image i `Dockerfile.api`.
    `Dockerfile.api` kører `yarn workspace api prisma generate` i `builder`-stadiet.
    Min `apps/api/prisma/schema.prisma` har `binaryTargets` sat til `["native", "linux-musl-openssl-3.0.x"]`.

    Analyser følgende:
    1.  **OpenSSL Version i Alpine:** Matcher `linux-musl-openssl-3.0.x` den faktiske OpenSSL version i `node:22-alpine` imaget? Kør `docker run --rm node:22-alpine apk info -v openssl` for at verificere. Hvis der er et mismatch, skal `binaryTargets` opdateres.
    2.  **`prisma generate` og `node_modules` i Docker Stages:**
        * `Dockerfile.api`'s `runner`-stadie kører `yarn install --production --frozen-lockfile`. Dette vil fjerne `prisma` CLI (som er en devDependency). Hvis `prisma generate` ikke er kørt korrekt i `builder`-stadiet med den rigtige target, eller hvis den genererede client ikke kopieres korrekt/bliver overskrevet, kan det fejle.
        * Kopieres den genererede Prisma Client (typisk i `node_modules/.prisma/client` og `node_modules/@prisma/client`) korrekt og fuldstændigt fra `builder`-stadiet (hvor `prisma generate` køres) til det endelige `runner`-stadie?
        * Overvej om `prisma generate` bør køres *efter* `yarn install --production` i `runner`-stadiet, hvilket ville kræve at `prisma` CLI og `typescript` midlertidigt installeres, generate køres, og de så fjernes igen for at holde imaget lille. Dette er dog mere komplekst.
    3.  **`output` sti for Prisma Client:** Er `output` i `generator client` blokken i `schema.prisma` sat til standard (`node_modules/.prisma/client`), eller en custom sti der håndteres korrekt i Docker?
    4.  **Installation af `openssl` i Dockerfile:** `Dockerfile.api` installerer `openssl` i `deps` og `runner` stadierne. Er dette den korrekte version, som Prisma's binary target forventer?

    Foreslå rettelser til `apps/api/prisma/schema.prisma` (`binaryTargets`) og/eller `Dockerfile.api` (rækkefølge af `COPY`, `RUN yarn install --production`, og `prisma generate` eller kopiering af genereret client) for at sikre, at den korrekte Prisma query engine er genereret og tilgængelig i Docker containeren.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Verificer og opdater `binaryTargets` i `apps/api/prisma/schema.prisma`:**
        * Kør `docker run --rm node:22-alpine apk info -v openssl` (eller `openssl version` inde i en kørende container) for at finde OpenSSL versionen.
        * Opdater `binaryTargets` til at matche, f.eks.:
        ```prisma
        // apps/api/prisma/schema.prisma
        generator client {
          provider      = "prisma-client-js"
          // Eksempel: Hvis Alpine bruger OpenSSL 3.0.x
          binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
          // Eksempel: Hvis Alpine bruger OpenSSL 1.1.x
          // binaryTargets = ["native", "linux-musl-openssl-1.1.x"]
        }
        ```
    * **Juster `Dockerfile.api` for at sikre korrekt Prisma Client i produktionsimaget:**
        ```dockerfile
        # Dockerfile.api

        # 1. deps: Install all dependencies including devDependencies for prisma generate
        FROM node:22-alpine AS deps
        WORKDIR /app
        RUN apk add --no-cache openssl # Sørg for at OpenSSL er tilgængelig
        COPY package.json yarn.lock .yarnrc.yml* ./
        COPY .yarn ./.yarn
        COPY apps/api/package.json ./apps/api/
        # ... (kopier andre relevante package.json for workspaces api afhænger af for build)
        COPY packages/core/package.json ./packages/core/
        COPY packages/config/package.json ./packages/config/
        RUN yarn install --frozen-lockfile

        # 2. builder: Build @repo/core, generate Prisma client, then build the api
        FROM deps AS builder
        WORKDIR /app
        COPY . . # Kopier al kildekode
        RUN yarn workspace @repo/core build # Byg afhængigheder først
        RUN yarn workspace @repo/config build # Byg afhængigheder først
        RUN yarn workspace api prisma generate # Generer Prisma client i Alpine-miljøet
        RUN yarn workspace api build # Byg API

        # 3. runner: Minimal production image
        FROM node:22-alpine AS runner
        WORKDIR /app
        RUN apk add --no-cache openssl # Sørg for at OpenSSL er tilgængelig for runtime
        ENV NODE_ENV production
        ENV PORT 3001
        RUN addgroup -S apiuser && adduser -S apiuser -G apiuser

        # Kopier kun nødvendige produktions-dependencies og build output
        COPY --chown=apiuser:apiuser --from=builder /app/apps/api/dist ./apps/api/dist
        COPY --chown=apiuser:apiuser --from=builder /app/packages/core/dist ./packages/core/dist
        COPY --chown=apiuser:apiuser --from=builder /app/packages/config/dist ./packages/config/dist
        
        # Kopier package.json filer nødvendige for 'yarn install --production'
        COPY --chown=apiuser:apiuser --from=deps /app/package.json \
             --chown=apiuser:apiuser --from=deps /app/yarn.lock \
             --chown=apiuser:apiuser --from=deps /app/.yarnrc.yml* \
             ./
        COPY --chown=apiuser:apiuser --from=deps /app/.yarn ./.yarn
        COPY --chown=apiuser:apiuser --from=deps /app/apps/api/package.json ./apps/api/
        COPY --chown=apiuser:apiuser --from=deps /app/packages/core/package.json ./packages/core/
        COPY --chown=apiuser:apiuser --from=deps /app/packages/config/package.json ./packages/config/
        
        # Installer KUN produktionsafhængigheder
        RUN yarn install --production --frozen-lockfile && \
            # Kopier den allerede genererede Prisma client fra builder stadiet.
            # Dette er vigtigt, da 'prisma generate' kræver devDependencies (som 'prisma' CLI),
            # der er fjernet af 'yarn install --production'.
            cp -R /app/node_modules/.prisma/client ./node_modules/.prisma/client && \
            # Også @prisma/client, hvis den er adskilt
            (test -d /app/node_modules/@prisma/client && cp -R /app/node_modules/@prisma/client ./node_modules/@prisma/client || echo "@prisma/client not found in builder, skipping copy") && \
            rm -rf /tmp/.yarn* ~/.yarn/berry/cache ~/.cache/yarn

        USER apiuser
        EXPOSE 3001
        CMD ["node", "apps/api/dist/main.js"]
        ```
        *Nøgleændring: Sikrer at den `prisma generate`'de client fra `builder`-stadiet (som blev bygget i Alpine med korrekte binaries) kopieres over *efter* `yarn install --production` har fjernet dev-dependencies i `runner`-stadiet.*

### Fejl ID: DOCKER-002
* **Trigger-tekst / Fejlkode:**
    * Nginx returnerer 502 Bad Gateway for requests til API eller Web.
    * WebSocket-forbindelser (f.eks. til Next.js HMR) fejler med 101 Switching Protocols fejl eller timeout.
    * CORS-fejl i browseren når frontend forsøger at kalde API via Nginx.
* **AI Masterprompt:**
    ```
    Min Docker-opsætning (`docker-compose.yml`) bruger Nginx (`nginx.conf`) som reverse proxy for API'en (`apps/api` på intern port 3000, mappet til `api:3000` i Nginx) og web-app'en (`apps/web` på intern port 3001, mappet til `web:3001` i Nginx).
    Jeg oplever [502 Bad Gateway fejl / WebSocket forbindelsesfejl / CORS fejl] når jeg tilgår applikationerne gennem Nginx på host port 80.

    Analyser følgende konfigurationer:
    1.  **`nginx.conf` (den der bruges af Docker Compose, typisk rod `nginx.conf`):**
        * Er `proxy_pass` direktiverne korrekte (f.eks. `http://api:3000/` for `/api/` location, og `http://web:3001/` for `/` location)? Servicenavnene (`api`, `web`) skal matche dem i `docker-compose.yml`.
        * For WebSocket-forbindelser (især Next.js HMR på `/_next/webpack-hmr`, men også potentielle API WebSockets): Er `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;` og `proxy_set_header Connection "upgrade";` (eller `'upgrade'`) korrekt sat for den relevante `location` blok?
        * Hvordan håndteres CORS-headers? Videresender Nginx `Access-Control-Allow-Origin` og andre CORS-relaterede headers fra backend-API'en, eller tilføjer/overskriver Nginx dem? NestJS API'en i `apps/api/src/main.ts` har `app.enableCors()` konfigureret.
    2.  **`docker-compose.yml`:**
        * Er servicenavnene (`api`, `web`) konsistente med dem brugt i `nginx.conf` `proxy_pass`?
        * Er de interne porte (API på 3000, Web på 3001) korrekte og matcher de, hvad applikationerne lytter på internt i deres containere?
        * Er alle services (`nginx`, `api`, `web`, `postgres`) på det samme Docker-netværk (`app-network`)?
    3.  **Applikationslogs (`docker-compose logs api`, `docker-compose logs web`):** Viser applikationerne selv fejl ved opstart eller request-håndtering, som Nginx så blot reflekterer som en 502-fejl?

    Foreslå rettelser til `nginx.conf` for at sikre korrekt proxying, WebSocket-understøttelse og CORS-håndtering.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Korrekt Nginx-konfiguration for WebSockets og CORS (uddrag af rod `nginx.conf`):**
        ```nginx
        # nginx.conf
        http {
            # ... (andre indstillinger)

            server {
                listen 80;
                server_name localhost; # Eller dit domæne

                location /api/ {
                    proxy_pass http://api:3000/; # Matcher service:port fra docker-compose
                    proxy_http_version 1.1;
                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection 'upgrade'; # Korrekt værdi for WebSockets
                    proxy_set_header Host $host;
                    proxy_set_header X-Real-IP $remote_addr;
                    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                    proxy_set_header X-Forwarded-Proto $scheme;
                    proxy_cache_bypass $http_upgrade;

                    # Videresend CORS headers fra backend, eller tilføj dem her hvis nødvendigt
                    # For at videresende:
                    # proxy_pass_header Access-Control-Allow-Origin;
                    # proxy_pass_header Access-Control-Allow-Credentials;
                    # Eller for at sætte dem her (hvis backend ikke håndterer det godt nok via proxy):
                    # add_header 'Access-Control-Allow-Origin' '$http_origin' always; # Vær forsigtig med $http_origin i produktion
                    # add_header 'Access-Control-Allow-Credentials' 'true' always;
                    # add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
                    # add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, X-Requested-With' always;
                    # if ($request_method = 'OPTIONS') {
                    #    add_header 'Access-Control-Max-Age' 1728000;
                    #    add_header 'Content-Type' 'text/plain charset=UTF-8';
                    #    add_header 'Content-Length' 0;
                    #    return 204;
                    # }
                }

                # Next.js HMR WebSockets (hvis web app kører dev server, ellers ikke nødvendig for prod build)
                location /_next/webpack-hmr {
                    proxy_pass http://web:3001; # Matcher service:port for web app
                    proxy_http_version 1.1;
                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection "upgrade"; # Korrekt værdi
                    proxy_set_header Host $host;
                    proxy_cache_bypass $http_upgrade;
                }

                location / {
                    proxy_pass http://web:3001; # Matcher service:port for web app
                    proxy_set_header Host $host;
                    proxy_set_header X-Real-IP $remote_addr;
                    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                    proxy_set_header X-Forwarded-Proto $scheme;
                }
            }
        }
        ```
    * **Tjek `docker-compose.yml` for korrekte service navne og porte:**
        ```yaml
        # docker-compose.yml
        services:
          api:
            container_name: learning-api
            # ... lytter internt på PORT=3000 (sat i Dockerfile.api eller her)
            networks:
              - app-network
          web:
            container_name: learning-web
            # ... lytter internt på PORT=3001 (sat i Dockerfile.web eller her)
            networks:
              - app-network
          nginx:
            # ...
            ports:
              - "80:80" # Host port 80 mapper til Nginx container port 80
            networks:
              - app-network
        # ...
        networks:
          app-network:
            driver: bridge
        ```

### Fejl ID: DOCKER-003
* **Trigger-tekst / Fejlkode:**
    * Applikationer i Docker fejler ved opstart med fejl om manglende miljøvariabler (f.eks. `DATABASE_URL`, `JWT_SECRET`).
    * Zod-validering i `packages/config/src/env.ts` fejler inde i Docker, fordi en påkrævet variabel ikke er sat.
    * Applikationen bruger default/dummy-værdier i stedet for de korrekte konfigurationsværdier.
* **AI Masterprompt:**
    ```
    Mine applikationer (`apps/api` og/eller `apps/web`) fejler ved opstart eller opfører sig forkert inde i Docker-containere på grund af manglende eller forkerte miljøvariabler.
    Jeg bruger en rod `.env`-fil sammen med `docker-compose.yml` til at sætte miljøvariabler. `packages/config/src/env.ts` bruger Zod til at validere server-side variabler.

    Analyser følgende:
    1.  **`docker-compose.yml` - `environment` vs. `env_file`:**
        * Hvordan sættes miljøvariabler for `api` og `web` services? Bruges `environment`-sektionen direkte, eller bruges `env_file` til at pege på en `.env`-fil?
        * Hvis `env_file` bruges, er stien til `.env`-filen korrekt ift. `docker-compose.yml`'s placering?
        * Er der konflikter, hvor en variabel sættes både i `environment` og via `env_file`?
    2.  **Rod `.env`-fil:** Indeholder rod `.env`-filen (den som `docker-compose` automatisk læser) *alle* de nødvendige variabler, som `api` og `web` services forventer (se `apps/api/.env.example`, `apps/web/.env.example`, og `packages/config/src/env.ts`)?
    3.  **Variabelnavne:** Er variabelnavnene konsistente mellem `.env`-filen, `docker-compose.yml`, og hvordan de tilgås i koden (f.eks. `process.env.DATABASE_URL` vs. `env.DATABASE_URL` hvis `serverEnv()` bruges)?
    4.  **`packages/config/src/env.ts`:**
        * Er alle variabler, der er *påkrævede* for Docker-miljøet, defineret som non-optional i `serverSchema` og `clientSchema`?
        * Kan Zod-valideringen fejle, fordi en variabel, der er valgfri i Zod-skemaet (med `.optional()` eller `.default()`), reelt er påkrævet for applikationens funktionalitet i Docker?
    5.  **Build-time vs. Runtime Variabler:** Er der variabler, der skal være tilgængelige under Docker *build* (via `ARG` i Dockerfile) versus dem, der kun er nødvendige ved *runtime* (via `ENV` i Dockerfile eller `environment`/`env_file` i `docker-compose.yml`)?

    Foreslå rettelser til `docker-compose.yml` og/eller `.env`-fil(er) for at sikre korrekt injektion og tilgængelighed af alle nødvendige miljøvariabler for både API og web-applikationen i Docker.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Korrekt brug af `env_file` i `docker-compose.yml`:**
        ```yaml
        # docker-compose.yml
        services:
          api:
            # ...
            env_file:
              - ./.env # Sørg for at denne fil eksisterer og indeholder alle nødvendige variabler
            # Du kan også sætte specifikke variabler her, som overskriver dem fra .env-filen
            environment:
              - NODE_ENV=production # Overskriver evt. NODE_ENV fra .env
              - PORT=3000 # Intern port for API containeren
            # ...
          web:
            # ...
            env_file:
              - ./.env
            environment:
              - NODE_ENV=production
              - PORT=3001 # Intern port for Web containeren
              # NEXT_PUBLIC_ variabler skal også være her eller i .env
              - NEXT_PUBLIC_API_URL=http://nginx/api # Peger på Nginx internt i Docker-netværket
            # ...
        ```
    * **Eksempel på indhold i rod `.env`-fil (til Docker Compose):**
        ```env
        # .env (i projektets rod)
        DATABASE_URL=postgresql://test:test@postgres:5432/learninglab_dev?schema=public
        JWT_SECRET=dit_meget_lange_og_sikre_jwt_secret_til_docker
        JWT_EXPIRES_IN=1h
        # ... alle andre variabler krævet af serverSchema og clientSchema i @repo/config/env.ts
        # ... og variabler krævet af apps/api/.env.example og apps/web/.env.example

        # For web appen, der kører bag Nginx:
        NEXT_PUBLIC_API_URL=http://localhost/api # Eller hvad end din Nginx er konfigureret til eksternt
        ```
        *Vigtigt: `NEXT_PUBLIC_API_URL` i `.env` filen (som Next.js build processen kan se) skal pege på den *eksterne* URL, som browseren vil bruge. Internt i `docker-compose.yml` kan `web` servicen have en `NEXT_PUBLIC_API_URL=http://nginx/api` for at tale med Nginx via Docker-netværket.*

---
