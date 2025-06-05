## Kategori 3: Database (Prisma)

### Fejl ID: DB-001

- **Trigger-tekst / Fejlkode:**
  - `Error: P3000: Failed to create database: database `learninglab_dev` already exists on the SCM server` (under `prisma migrate dev` hvis databasen allerede eksisterer men ikke er initialiseret af Prisma).
  - `Error: P3001: Migration `[migration_name]` failed to apply cleanly to the shadow database.` (ofte efterfulgt af detaljer om SQL-fejl).
  - `Error: Database error: Added the required column `[column_name]`to the`[table_name]` table without a default value. There are [N] rows in this table, it is not possible to execute this migration.`
- **AI Masterprompt:**

  ```
  Jeg har to separate Prisma-opsætninger: en i roden (`prisma/`) og en i `apps/api/prisma/`. Den primære ser ud til at være `apps/api/prisma/` baseret på scripts.
  Jeg oplever fejl under `prisma migrate dev` (kørt via `yarn prisma:migrate` som kalder `scripts/prisma-commands.sh migrate`). Fejlen er typisk "[indsæt specifik Prisma fejlmeddelelse her, f.eks. 'Added the required column X to table Y without a default value']".
  Flere af mine migrationsfiler i `apps/api/prisma/migrations/` (f.eks. `20250517073440_add_user_auth_fields/migration.sql`) tilføjer `NOT NULL` kolonner uden en `DEFAULT` værdi.

  Analyser følgende:
  1.  **Konflikt mellem Prisma-opsætninger:** Kan tilstedeværelsen af rod-`prisma/` mappen (selvom den måske ikke bruges aktivt af scripts) forstyrre Prisma CLI's adfærd eller IDE-integrationer, især ift. `migration_lock.toml`?
  2.  **`NOT NULL` uden `DEFAULT`:** For de migrationer, der tilføjer `NOT NULL` kolonner (som `passwordHash` i `20250517073440_...` eller felter i `20250520211803_...`), hvordan kan disse rettes for at undgå fejl på eksisterende databaser med data? Skal der tilføjes et `DEFAULT` i SQL'en, eller skal migrationen splittes (gøre kolonnen nullbar først, opdatere data, så gøre den `NOT NULL`)?
  3.  **Shadow Database:** Hvis fejlen er relateret til shadow database, hvad er de typiske årsager til dette i en PostgreSQL kontekst? (f.eks. utilstrækkelige rettigheder for databasebrugeren til at oprette/manipulere shadow databasen, eller inkompatible databaseudvidelser).
  4.  **`ensure-db.sh` script:** Sikrer dette script (`scripts/ensure-db.sh`), at databasen er fuldt initialiseret og klar *før* `prisma migrate dev` forsøges kørt? Er der race conditions?

  Foreslå:
  * En strategi for at konsolidere til én Prisma-opsætning (sandsynligvis `apps/api/prisma/`) og fjerne den overflødige.
  * Specifikke rettelser til de SQL migrationsfiler, der tilføjer `NOT NULL` kolonner uden defaults, så de kan køre sikkert.
  * Anbefalinger til at debugge/løse shadow database problemer, hvis det er relevant for den specifikke fejl.
  ```

- **Løsningsskabeloner (Eksempler):**
  - **Konsolidering af Prisma-opsætning:**
    1.  Slet `prisma/` mappen i roden.
    2.  Sørg for at alle scripts og `package.json` (rod og `apps/api`) entydigt peger på `apps/api/prisma` for alle Prisma-kommandoer.
    3.  Opdater `.gitignore` for kun at ignorere den korrekte `apps/api/prisma/*.db` osv.
  - **Rettelse af `NOT NULL` migration (Eksempel for `passwordHash`):**
    - **Metode 1: Tilføj et midlertidigt default (hvis acceptabelt at alle eksisterende brugere får et dummy-password, der så skal ændres):**
      ```sql
      -- In migration.sql for 20250517073440_add_user_auth_fields
      ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT 'temporary_dummy_hash';
      -- Efterfølgende manuelt eller via script: Opdater eksisterende brugeres passwordHash
      -- Derefter, i en NY migration:
      -- ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;
      ```
    - **Metode 2: Gør kolonnen nullbar først (foretrukket hvis data skal bevares og opdateres):**
      ```sql
      -- I en NY migration FØR den der gør den NOT NULL:
      -- ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
      -- Kør et script/manuel opdatering for at sætte passwordHash for alle eksisterende brugere.
      -- Derefter i den oprindelige migration (eller en ny efter dataopdatering):
      -- UPDATE "User" SET "passwordHash" = 'some_valid_hash' WHERE "passwordHash" IS NULL; -- Sæt en valid hash for rækker hvor den er NULL
      -- ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
      ```
      _(Prisma forsøger selv at håndtere dette ved at gøre kolonnen nullbar, tilføje data, og så gøre den NOT NULL, men det kan fejle. Manuel SQL giver mere kontrol)._
  - **Shadow Database Rettigheder (PostgreSQL):**
    - Sørg for at databasebrugeren specificeret i `DATABASE_URL` har `CREATEDB` rettigheder, eller at shadow databasen kan oprettes indenfor det samme skema/database som hoveddatabasen.
    - Tjek PostgreSQL logs for mere detaljerede fejlmeddelelser.

### Fejl ID: DB-002

- **Trigger-tekst / Fejlkode:**
  - `Error: P3005: The migration `[migration_name]` failed to apply cleanly to the shadow database.` (Kan skyldes `NOT NULL` uden default, se DB-001).
  - `Error: P3006: Migration `[migration_name]` failed to apply cleanly to the development database.`
  - Fejl relateret til `migration_lock.toml` der er "fastlåst" eller ude af sync.
- **AI Masterprompt:**

  ```
  Jeg oplever fejl under `prisma migrate dev` (kørt via `yarn prisma:migrate`), som indikerer, at en migration ikke kan anvendes rent på [shadow databasen / udviklingsdatabasen]. Fejlmeddelelsen er: "[indsæt specifik Prisma fejlmeddelelse her, f.eks. P3005 eller P3006]".
  Dette sker i konteksten af en PostgreSQL database. Jeg har to Prisma schema-stier (`prisma/` og `apps/api/prisma/`), men bruger primært den i `apps/api`.

  Analyser følgende:
  1.  **Specifik SQL-fejl:** Hvis Prisma outputtet indeholder en underliggende SQL-fejl, hvad indikerer denne fejl? (f.eks. constraint violation, syntax error i migration.sql).
  2.  **Migrationens indhold:** Gennemgå `migration.sql` filen for den fejlendes migration. Er der operationer, der kan være problematiske (f.eks. tilføjelse af `NOT NULL` kolonner uden default på en tabel med eksisterende data, komplekse data-transformationer, eller ændringer der bryder foreign key constraints midlertidigt)?
  3.  **`migration_lock.toml`:** Kan der være et problem med denne fil? Skal den slettes og `prisma migrate resolve` køres? (Vær forsigtig med dette i et team-miljø).
  4.  **Shadow Database Konflikter:** Er der noget i min lokale databaseopsætning (f.eks. specifikke PostgreSQL version, udvidelser, eller data) der kunne forårsage, at shadow databasen opfører sig anderledes end udviklingsdatabasen?
  5.  **Manuel Intervention:** Kræver denne migration manuel intervention i databasen før den kan anvendes, eller kan selve migrationsscriptet rettes?

  Foreslå en trin-for-trin plan for at løse denne migrationsfejl. Dette kan inkludere:
  * At rette den problematiske `migration.sql` fil.
  * At nulstille databasen (hvis det er et udviklingsmiljø og acceptabelt).
  * At bruge `prisma migrate resolve` til at markere migrationen som anvendt/ikke anvendt.
  * At undersøge og rette den underliggende datastruktur eller data, der forårsager fejlen.
  ```

- **Løsningsskabeloner (Eksempler):**
  - **Nulstil lokal udviklingsdatabase (kun hvis data tab er acceptabelt):**
    ```bash
    yarn workspace api prisma migrate reset
    # Dette sletter databasen og kører alle migrationer igen.
    ```
  - **Ret en problematisk migration (f.eks. `NOT NULL` uden default):**
    - Se løsningsskabeloner under DB-001.
    - Efter rettelse af SQL-filen, prøv `prisma migrate dev` igen. Hvis Prisma allerede har forsøgt og fejlet med denne migration, kan det være nødvendigt at:
      1.  Midlertidigt fjerne den fejlede migrationsmappe.
      2.  Køre `prisma migrate dev --create-only` for at genskabe SQL'en (som du så retter).
      3.  Eller manuelt rette SQL'en og så bruge `prisma db execute --file path/to/corrected/migration.sql --schema apps/api/prisma/schema.prisma` (meget avanceret, vær forsigtig).
  - **Brug `prisma migrate resolve` (med stor forsigtighed):**
    - Hvis du er _sikker_ på, at migrationen _er_ anvendt korrekt manuelt, eller at den _skal_ springes over:
      ```bash
      yarn workspace api prisma migrate resolve --applied [migration_navn_fra_mappenavn]
      # ELLER
      yarn workspace api prisma migrate resolve --rolled-back [migration_navn_fra_mappenavn]
      ```

### Fejl ID: DB-003

- **Trigger-tekst / Fejlkode:**
  - Seed-script (`apps/api/prisma/seed.ts`) fejler med `Error: Environment variable not found: DATABASE_URL.`
  - Seed-script fejler med databaseforbindelsesfejl eller fordi tabeller/relationer ikke eksisterer (hvis migrationer ikke er kørt først).
  - Fejl i CI-pipeline under seeding-step.
- **AI Masterprompt:**

  ```
  Mit Prisma seed-script (`apps/api/prisma/seed.ts`), som køres via `yarn seed` (der kalder `scripts/ensure-db.sh` og derefter `cd apps/api && yarn seed`), fejler [i CI / lokalt]. Fejlmeddelelsen er "[indsæt specifik fejlmeddelelse her]".
  `Seedpensum.txt` bruges til at generere noget af seed-dataen.
  CI-workflow (`.github/workflows/ci.yml`) definerer `DATABASE_URL_CI`.

  Analyser følgende:
  1.  **`DATABASE_URL` Tilgængelighed:** Er `DATABASE_URL` miljøvariablen korrekt sat og tilgængelig i det miljø, hvor seed-scriptet køres?
      * Lokalt: Tjek `.env` filen i `apps/api` og/eller rod `.env` og `.envrc`.
      * CI: Hvordan og hvornår sættes `DATABASE_URL` for det step, der kører seeding? Er `DATABASE_URL_CI` korrekt navngivet og brugt?
  2.  **`ensure-db.sh` Logik:**
      * Starter `scripts/ensure-db.sh` Docker-containeren (`learning-db`) korrekt?
      * Venter scriptet længe nok på, at PostgreSQL er fuldt initialiseret og klar til at acceptere forbindelser, *før* det returnerer succes?
      * Opretter scriptet databasen (`learninglab_dev`), hvis den ikke eksisterer?
  3.  **Migrationsstatus før Seeding:** Sikrer `yarn seed` kommandoen (eller `ensure-db.sh`), at alle Prisma-migrationer er anvendt på databasen, *før* `seed.ts` køres? Hvis `seed.ts` forsøger at indsætte data i tabeller, der endnu ikke er oprettet af migrationer, vil det fejle.
  4.  **Seed-scriptets afhængigheder:** Har `apps/api/prisma/seed.ts` selv brug for adgang til andre miljøvariabler, der måske mangler?
  5.  **Rettigheder:** Har databasebrugeren, der bruges af seed-scriptet, de nødvendige rettigheder til at læse fra `Seedpensum.txt` (hvis det sker i scriptet) og skrive til alle relevante tabeller?

  Foreslå rettelser til `scripts/ensure-db.sh`, CI-workflow, `package.json` scripts, eller selve `seed.ts` for at sikre, at seeding kører pålideligt i alle miljøer.
  ```

- **Løsningsskabeloner (Eksempler):**

  - **Forbedret `ensure-db.sh` (uddrag):**

    ```bash
    # scripts/ensure-db.sh
    # ... (start docker container) ...
    echo "Waiting for PostgreSQL to be ready..."
    # Forbedret wait-loop med pg_isready
    RETRY_COUNT=0
    MAX_RETRIES=30 # Vent op til 60 sekunder
    DB_READY=false
    until [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ] || [ "$DB_READY" = true ]; do
        if docker exec learning-db pg_isready -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" --quiet; then
            DB_READY=true
            echo "PostgreSQL is ready."
        else
            RETRY_COUNT=$((RETRY_COUNT+1))
            echo "Waiting for PostgreSQL... attempt $RETRY_COUNT/$MAX_RETRIES"
            sleep 2
        fi
    done

    if [ "$DB_READY" = false ]; then
        echo "ERROR: PostgreSQL did not become ready in time."
        docker logs learning-db # Vis logs for debugging
        exit 1
    fi

    echo "Ensuring database '$DB_NAME' exists..."
    # ... (opret database hvis den ikke eksisterer) ...

    echo "Applying migrations before seeding..."
    # Kør migrationer fra roden af projektet, pegende på API's schema
    (cd "$REPO_ROOT/apps/api" && npx prisma migrate deploy) # Brug deploy for CI/automatiseret setup

    echo "Database is ready and migrations applied."
    ```

  - **Opdater `yarn seed` script i rod `package.json`:**
    ```json
    {
      "scripts": {
        "seed": "yarn ensure-db && yarn workspace api ts-node prisma/seed.ts"
        // Eller hvis seed er et script i api/package.json:
        // "seed": "yarn ensure-db && yarn workspace api run seed"
      }
    }
    ```
    _(Sørg for at `ts-node` er en devDependency i `apps/api` eller globalt, hvis du bruger `ts-node prisma/seed.ts` direkte)._
  - **Sæt `DATABASE_URL` i CI for seed-steppet:**
    ```yaml
    # .github/workflows/ci.yml
    # ...
    - name: Seed database (if needed for tests or specific builds)
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL_CI }} # Eller den relevante DB URL for dette step
      run: yarn seed
    ```

### Fejl ID: DB-004

- **Trigger-tekst / Fejlkode:**
  - Runtime fejl i Docker container: `Error: Query engine library for current platform "[platform]" could not be found.`
  - `Invalid `prisma.generate()` invocation:` efterfulgt af platform-relaterede fejl.
  - Langsom opstart af API i Docker pga. Prisma forsøger at downloade query engine.
- **AI Masterprompt:**

  ````
  Min NestJS API (`apps/api`) har problemer med Prisma Client i Docker-miljøet. Jeg bruger `node:22-alpine` som base image.
  `Dockerfile.api` kører `yarn workspace api prisma generate` i `builder`-stadiet.

  Analyser følgende:
  1.  **`binaryTargets` i `apps/api/prisma/schema.prisma`:** Er `linux-musl` (eller `linux-musl-openssl-1.1.x` / `linux-musl-openssl-3.0.x` afhængigt af OpenSSL version i Alpine og Prisma version) specificeret som en `binaryTarget` i `generator client` blokken?
      ```prisma
      generator client {
        provider      = "prisma-client-js"
        binaryTargets = ["native", "linux-musl-openssl-3.0.x"] // Eksempel
      }
      ```
  2.  **OpenSSL Version i Alpine:** Hvilken version af OpenSSL bruger `node:22-alpine`? Dette kan tjekkes med `docker run --rm node:22-alpine apk info -v openssl`. Match `binaryTargets` med denne version. Prisma 5.x og nyere har bedre auto-detection, men eksplicit angivelse er sikrest.
  3.  **`prisma generate` placering i `Dockerfile.api`:**
      * Køres `prisma generate` *efter* `COPY . .` og *efter* `yarn install` i `builder`-stadiet, så den har adgang til det korrekte `schema.prisma` og `node_modules`? (Ja, det ser sådan ud).
      * Kopieres den genererede Prisma Client (`node_modules/.prisma/client` og potentielt `node_modules/@prisma/client`) korrekt fra `builder`-stadiet til det endelige `runner`-stadie? `Dockerfile.api` kopierer hele `node_modules` fra `deps` stadiet og kører derefter `yarn install --production`. Dette kan potentielt fjerne den genererede client, hvis den ikke er en produktionsafhængighed. `prisma generate` bør måske køres i `runner` stadiet efter `yarn install --production`, eller den genererede client skal kopieres eksplicit.
  4.  **Filrettigheder:** Er der filrettighedsproblemer i Docker containeren, der forhindrer Prisma Client i at tilgå query engine binaries? (Brugen af `apiuser` i `Dockerfile.api` er god praksis).

  Foreslå rettelser til `apps/api/prisma/schema.prisma` og/eller `Dockerfile.api` for at sikre, at den korrekte Prisma query engine er genereret og tilgængelig i Docker containeren. Overvej om `prisma generate` skal køres i det endelige `runner` stadie.
  ````

- **Løsningsskabeloner (Eksempler):**

  - **Opdater `binaryTargets` i `apps/api/prisma/schema.prisma`:**
    ```prisma
    // apps/api/prisma/schema.prisma
    generator client {
      provider      = "prisma-client-js"
      // Tilføj den korrekte target for Alpine Linux. For Prisma 5.6+ og OpenSSL 3.x i Alpine:
      binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
      // Hvis du bruger en ældre Prisma version eller Alpine med OpenSSL 1.1.x:
      // binaryTargets = ["native", "linux-musl-openssl-1.1.x"]
      // "native" er til lokal udvikling.
    }
    ```
  - **Juster `Dockerfile.api` for at sikre Prisma Client i produktionsimaget:**
    **Metode A: Kør `prisma generate` i runner-stadiet (efter production install):**

    ```dockerfile
    # Dockerfile.api (uddrag af runner-stadiet)
    # ... (kopier package.json, yarn.lock, .yarnrc.yml, .yarn)
    # Install production dependencies
    RUN yarn install --production --frozen-lockfile && \
        rm -rf /tmp/.yarn* ~/.yarn/berry/cache ~/.cache/yarn

    # Kopier Prisma schema EFTER production install, hvis det ikke allerede er der
    COPY --chown=apiuser:apiuser --from=builder /app/apps/api/prisma ./apps/api/prisma

    # Generer Prisma client specifikt for produktionsmiljøet
    RUN yarn workspace api prisma generate # Eller npx prisma generate --schema=./apps/api/prisma/schema.prisma

    USER apiuser
    EXPOSE 3001 # Eller den port API'en lytter på
    CMD ["node", "apps/api/dist/main.js"]
    ```

    **Metode B: Kopier den genererede client eksplicit (hvis `generate` er langsom):**

    ```dockerfile
    # Dockerfile.api (uddrag af runner-stadiet)
    # ... (kopier package.json, yarn.lock, .yarnrc.yml, .yarn)
    # Install production dependencies
    RUN yarn install --production --frozen-lockfile && \
        rm -rf /tmp/.yarn* ~/.yarn/berry/cache ~/.cache/yarn

    # Kopier den allerede genererede Prisma client fra builder-stadiet
    COPY --chown=apiuser:apiuser --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
    COPY --chown=apiuser:apiuser --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client # Afhængig af Prisma version

    USER apiuser
    EXPOSE 3001
    CMD ["node", "apps/api/dist/main.js"]
    ```

    _(Metode A er ofte mere robust, da den sikrer, at clienten genereres i det præcise runtime-miljø)._

---

Markdown er ved at blive genereret...
