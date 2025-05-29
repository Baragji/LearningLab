

## Kategori 2: TypeScript, Konfiguration og Sti-Aliaser

### Fejl ID: TS-001
* **Trigger-tekst / Fejlkode:**
    * `error TS2307: Cannot find module '@repo/core/utils' or its corresponding type declarations.`
    * `error TS2307: Cannot find module '@/*' or its corresponding type declarations.`
    * Fejl under `tsc`, `next build`, `nest build`, eller i Jest tests, hvor sti-aliaser ikke opløses korrekt.
    * IDE'en (VSCode/Cursor) kan opløse aliaset, men build/test fejler.
* **AI Masterprompt:**
    ```
    Mit projekt har problemer med at opløse TypeScript path aliases (f.eks. `@repo/core/*` eller `@/*`) i [workspacet `apps/web` / workspacet `apps/api` / Jest tests for `[workspace]`].
    Lokalt i IDE'en ser det ud til at virke, men [build-processen / Jest] fejler med "Cannot find module".

    Jeg bruger følgende konfigurationer:
    - Rod `tsconfig.json` med project references.
    - Workspace-specifikke `tsconfig.json` (f.eks. `apps/web/tsconfig.json`, `apps/api/tsconfig.json`) der arver fra `packages/tsconfig/nextjs.json` eller `packages/tsconfig/nestjs.json`.
    - `packages/tsconfig/base.json` definerer `baseUrl` og `paths`.
    - For `apps/api` bruges `apps/api/tsconfig.build.json` til NestJS build.
    - For Jest, `moduleNameMapper` er konfigureret i [relevant `jest.config.js` eller `package.json`].
    - `turbo.json` orkestrerer builds.

    Analyser følgende for at finde årsagen til, at aliaser ikke opløses korrekt i den fejlendes kontekst:
    1.  **`tsconfig.json` hierarki:** Er `baseUrl` og `paths` korrekt defineret og arvet ned gennem `extends` kæden til det specifikke workspace's `tsconfig.json` (og `tsconfig.build.json` for API)? Stierne i `paths` skal være relative til `baseUrl`.
    2.  **Output fra referencede projekter:** Peger `paths` for `@repo/core` og `@repo/config` korrekt på deres `dist` mapper (f.eks. `../../packages/core/dist/index`)? Er disse pakker bygget *før* det afhængige workspace, som defineret i `turbo.json` `pipeline`?
    3.  **Next.js specifik (`apps/web`):** Er `next.config.js` Webpack-konfiguration (hvis den modificeres) korrekt sat op til at forstå disse aliaser, eller stoler den udelukkende på `tsconfig.json`?
    4.  **NestJS specifik (`apps/api`):** Hvordan håndterer `nest build` (via `nest-cli.json` og `tsconfig.build.json`) `paths` aliaser? Er der behov for yderligere Webpack-konfiguration via `webpack-hmr.config.js` for produktionsbuilds ift. aliaser?
    5.  **Jest specifik:** Er `moduleNameMapper` i Jest-konfigurationen (f.eks. i `apps/api/package.json` eller `apps/web/jest.config.js`) korrekt mappet til at matche `paths` i `tsconfig.json`? Husk at Jest bruger regex.
    6.  **Build output:** Hvad er den faktiske filstruktur i `dist` eller `.next` mapperne? Peger de kompilerede imports korrekt?

    Foreslå en patch til den/de relevante konfigurationsfiler (`tsconfig.json`, `jest.config.js`, `next.config.js`, `nest-cli.json`) for at løse problemet.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Korrekt `paths` i `tsconfig.json` (f.eks. i `apps/web/tsconfig.json`):**
        ```json
        {
          "extends": "../../packages/tsconfig/nextjs.json",
          "compilerOptions": {
            "baseUrl": ".", // Vigtigt for at stierne nedenfor er relative til `apps/web`
            "paths": {
              "@/*": ["./src/*"],
              "@repo/core": ["../../packages/core/dist"], // Peger på build output
              "@repo/core/*": ["../../packages/core/dist/*"],
              "@repo/config": ["../../packages/config/dist"],
              "@repo/config/*": ["../../packages/config/dist/*"]
            }
            // ... andre options
          },
          "references": [ // Sørg for at bygge interne pakker først
            { "path": "../../packages/core" },
            { "path": "../../packages/config" }
          ]
        }
        ```
    * **Korrekt `moduleNameMapper` i `apps/web/jest.config.js`:**
        ```javascript
        // apps/web/jest.config.js
        module.exports = {
          // ...
          moduleNameMapper: {
            '^@/(.*)$': '<rootDir>/src/$1',
            '^@repo/core(|/.*)$': '<rootDir>/../../packages/core/src$1', // Peger på src for tests, ikke dist
            '^@repo/config(|/.*)$': '<rootDir>/../../packages/config/src$1'
          },
          // ...
        };
        ```
    * **Sørg for `dependsOn: ["^build"]` i `turbo.json` for apps:**
        ```json
        // turbo.json
        {
          "pipeline": {
            "build": {
              "dependsOn": ["^build"], // Bygger alle afhængigheder først
              "outputs": [".next/**", "dist/**"]
            },
            "lint": {},
            "dev": {
              "cache": false
            }
          }
        }
        ```

### Fejl ID: TS-002
* **Trigger-tekst / Fejlkode:**
    * `Nest can't resolve dependencies of the [ServiceName] (?). Please make sure that the argument [DependencyName] at index [0] is available in the [ModuleName] context.`
    * Advarsler om "potential circular dependency" under NestJS applikationens opstart.
    * Runtime fejl hvor en injiceret service er `undefined`.
* **AI Masterprompt:**
    ```
    Min NestJS API i `apps/api` viser "Nest can't resolve dependencies" fejl eller "potential circular dependency" advarsler for [specifik Service/Module, f.eks. AuthService i AppModule, eller mellem UsersService og AuthModule].
    Jeg har allerede brugt `forwardRef()` i `apps/api/src/auth/auth.module.ts` for `UsersModule`, og `apps/api/docs/circular-dependencies.md` diskuterer dette.

    Analyser følgende for at identificere og løse den cirkulære afhængighed eller manglende provider-registrering:
    1.  **Modul Imports/Exports:**
        * Er den service/provider, der ikke kan opløses ([DependencyName]), korrekt eksporteret fra det modul, hvor den er defineret?
        * Er modulet, der definerer [DependencyName], korrekt importeret i `imports`-arrayet i [ModuleName]?
        * Hvis `forwardRef()` bruges, er det brugt korrekt på *begge* sider af den cirkulære afhængighed (både i imports-array og ved `@Inject(forwardRef(...))` i service constructor)?
    2.  **Providers Array:** Er [DependencyName] (eller dens service) inkluderet i `providers`-arrayet i det modul, hvor den er defineret? `Forkert tilgang.docx` (TS-2) nævner en risiko for, at en provider fejlagtigt registreres i `imports` i stedet for `providers`.
    3.  **Global Modules:** Hvis [DependencyName] kommer fra et globalt modul (markeret med `@Global()`), er dette globale modul importeret én gang i rod-`AppModule` (`apps/api/src/app.module.ts`)?
    4.  **Struktur af `AppModule`:** Gennemgå `apps/api/src/app.module.ts`. Er alle feature-moduler (som `AuthModule`, `UsersModule`, `CoursesModule` osv.) korrekt importeret?
    5.  **Shared Modules:** Er `SharedModule` (`apps/api/src/shared/shared.module.ts`) korrekt konfigureret, og eksporterer den de nødvendige providers/moduler (f.eks. `JwtModule`) som andre moduler forventer?

    Foreslå en patch til de relevante `*.module.ts` filer for at løse afhængighedsopløsningsproblemet. Dette kan involvere at tilføje/flytte en provider til `providers`-arrayet, justere `exports`, korrekt anvende `forwardRef()`, eller omstrukturere modulafhængigheder.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Korrekt brug af `forwardRef()` (eksempel for AuthModule og UsersModule):**
        ```typescript
        // apps/api/src/auth/auth.module.ts
        import { Module, forwardRef } from '@nestjs/common';
        import { UsersModule } from '../users/users.module';
        // ... andre imports
        @Module({
          imports: [
            forwardRef(() => UsersModule), // UsersModule importeres her
            // ...
          ],
          providers: [AuthService, JwtStrategy, LocalStrategy],
          exports: [AuthService],
        })
        export class AuthModule {}

        // apps/api/src/users/users.module.ts
        import { Module, forwardRef } from '@nestjs/common';
        import { AuthModule } from '../auth/auth.module'; // Vigtigt for UsersService evt. afhængighed
        // ... andre imports
        @Module({
          imports: [
            forwardRef(() => AuthModule), // AuthModule importeres her hvis UsersService afhænger af AuthService
            PersistenceModule,
          ],
          controllers: [UsersController],
          providers: [UsersService],
          exports: [UsersService],
        })
        export class UsersModule {}

        // apps/api/src/auth/auth.service.ts
        import { Injectable, Inject, forwardRef } from '@nestjs/common';
        import { UsersService } from '../users/users.service';
        export class AuthService {
          constructor(
            @Inject(forwardRef(() => UsersService)) // Injicer UsersService
            private usersService: UsersService,
            // ...
          ) {}
        }
        ```
    * **Sikre at en service er i `providers` og `exports` i sit eget modul:**
        ```typescript
        // some.module.ts
        import { Module } from '@nestjs/common';
        import { SomeService } from './some.service';

        @Module({
          providers: [SomeService], // SomeService skal være her
          exports: [SomeService],   // Og her, hvis den skal bruges af andre moduler
        })
        export class SomeModule {}
        ```
    * **Sikre at et modul importeres korrekt i et andet modul:**
        ```typescript
        // another.module.ts
        import { Module } from '@nestjs/common';
        import { SomeModule } from '../some/some.module'; // Importer SomeModule
        import { AnotherService } from './another.service';

        @Module({
          imports: [SomeModule], // SomeModule skal være i imports-arrayet
          providers: [AnotherService],
        })
        export class AnotherModule {}
        ```

### Fejl ID: TS-003
* **Trigger-tekst / Fejlkode:**
    * `error TS2300: Duplicate identifier 'Request'.` (eller andre Express-relaterede typer)
    * Fejlen opstår typisk under `tsc` eller i IDE'en, især efter ændringer eller under inkrementelle builds.
* **AI Masterprompt:**
    ```
    Min NestJS API i `apps/api` giver en "Duplicate identifier 'Request'" (eller lignende for andre Express-typer) fejl.
    Jeg har en custom type-definitionsfil i `apps/api/src/types/express.d.ts` og har også `@types/express` (version "^4.17.21") som en devDependency i `apps/api/package.json`.
    Min `apps/api/tsconfig.json` arver fra `packages/tsconfig/nestjs.json`, som igen arver fra `packages/tsconfig/base.json`. `base.json` har `skipLibCheck: true`.

    Analyser følgende for at finde årsagen til den duplikerede identifier:
    1.  **Indhold af `apps/api/src/types/express.d.ts`:** Udvider eller re-deklarerer denne fil globale typer fra Express (som `Express.Request`) på en måde, der konflikter med de officielle definitioner fra `@types/express`?
    2.  **TypeScript's Type Resolution:** Hvordan opløser TypeScript typerne? Kan det være, at både den custom `d.ts`-fil og `@types/express` forsøger at definere den samme globale type?
    3.  **`skipLibCheck: true`:** Selvom dette normalt undertrykker typecheckning af `d.ts`-filer i `node_modules`, kan det i nogle tilfælde stadig føre til konflikter, hvis globale namespace-udvidelser er uforenelige.
    4.  **`typeRoots` i `apps/api/tsconfig.json`:** Er `typeRoots` konfigureret korrekt? Den indeholder `["./node_modules/@types", "../../node_modules/@types", "./src/types"]`. Kan rækkefølgen eller inkluderingen af `./src/types` her forårsage problemet?

    Foreslå en løsning. Dette kan involvere at:
    * Justere indholdet af `apps/api/src/types/express.d.ts` for at undgå direkte konflikter (f.eks. ved at sikre, at den kun *udvider* eksisterende interfaces via module augmentation i stedet for at re-deklarere dem).
    * Fjerne den custom `express.d.ts` hvis dens funktionalitet kan opnås anderledes eller er dækket af nyere `@types/express` versioner.
    * Justere `typeRoots` eller `include` i `apps/api/tsconfig.json`.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Korrekt Module Augmentation i `apps/api/src/types/express.d.ts`:**
        ```typescript
        // apps/api/src/types/express.d.ts
        import { User as CoreUser } from '@repo/core'; // Eller den relevante User type

        declare global {
          namespace Express {
            // Udvid det eksisterende Request interface
            export interface Request {
              user?: Omit<CoreUser, 'passwordHash'>; // Tilføj din custom 'user' property
              userId?: number; // Eksempel på en anden custom property
            }
          }
        }

        // Vigtigt: Sørg for at denne fil behandles som et modul ved at have mindst én top-level import eller export.
        // Hvis filen ikke har nogen imports/exports, kan du tilføje:
        export {}; // Dette tvinger TypeScript til at behandle filen som et modul.
        ```
        *Ved at bruge `declare global { namespace Express { ... } }` og have en `export {}` (eller en anden import/export), sikrer du, at du udvider det globale Express namespace korrekt i stedet for at forsøge at overskrive det.*
    * **Fjern custom `express.d.ts`:** Hvis de typer, du tilføjer, allerede er dækket af `req.user` sat af Passport/JwtStrategy, eller kan håndteres via custom decorators, kan det være simplere at fjerne filen.
    * **Juster `typeRoots` i `apps/api/tsconfig.json`:** Det er generelt bedst at lade TypeScript automatisk finde typer i `node_modules/@types`. Hvis `./src/types` er i `typeRoots`, kan det ændre opløsningsprioriteten. Overvej at fjerne `./src/types` fra `typeRoots` og i stedet inkludere den via `include` eller direkte import, hvis nødvendigt, og sikre at den bruger module augmentation korrekt.

### Fejl ID: TS-004 (Oprindeligt TS-004 i Developer 1's analyse)
* **Trigger-tekst / Fejlkode:**
    * TypeScript fejlmeddelelser relateret til Material-UI (MUI) eller React-typer, f.eks. `Type 'X' is not assignable to type 'Y' from '@mui/material'`.
    * Problemer med at bruge `sx` prop i MUI-komponenter med TypeScript.
    * Konflikter mellem `@types/react` versioner, der påvirker MUI-komponenters props.
    * Fejl relateret til Emotion (`@emotion/react`, `@emotion/styled`) i kombination med MUI og TypeScript.
* **AI Masterprompt:**
    ```
    Min Next.js applikation i `apps/web` bruger Material-UI (MUI v5.14.3) og React (v18.2.0 via resolutions). `packages/ui` indeholder også MUI-komponenter og bruger `@emotion/react` og `@emotion/styled`. Jeg oplever typefejl specifikt relateret til MUI-komponenter, deres props, eller interaktionen med React-typer.

    Analyser følgende for at finde årsagen:
    1.  **`@types/react` Version Kompatibilitet:** Selvom `resolutions` i rod `package.json` sætter `@types/react` til "18.2.18", undersøg om denne version er fuldt ud kompatibel med MUI v5.14.3 og de specifikke Emotion-versioner, der bruges i `packages/ui/package.json` (`@emotion/react: "^11.11.1"`, `@emotion/styled: "^11.11.0"`). Er der kendte problemer?
    2.  **`packageExtensions` i `.yarnrc.yml`:** Filen indeholder en `packageExtension` for `@mui/material@*` der specificerer en peerDependency på `@types/react: "*"`. Hvordan interagerer dette med `resolutions`? Kan dette føre til, at en uventet version af `@types/react` forsøges opløst internt af MUI, på trods af den globale resolution?
    3.  **MUI Theme og TypeScript:** Hvis jeg udvider MUI-temaet (som i `packages/ui/theme/index.ts`) eller bruger avancerede `sx` prop funktioner, er TypeScript-typerne for temaet korrekt sat op og udvidet, så TypeScript forstår custom tema-nøgler eller `sx`-propens muligheder?
    4.  **Props for MUI Komponenter:** Opstår typefejlene ved specifikke props på MUI-komponenter? Er disse props korrekt typet i min egen kode, og matcher de MUI's forventede typer?
    5.  **Emotion Integration:** Er Emotion-opsætningen (provider, `styled` funktion) korrekt konfigureret med TypeScript, især i `packages/ui`? Kan der være typekonflikter mellem Emotion's typer og MUI's eller React's typer?

    Foreslå løsninger, der kan inkludere:
    * Justering af versioner for `@types/react`, MUI, eller Emotion-pakker i `package.json` (og `resolutions`).
    * Ændringer til `packageExtensions` i `.yarnrc.yml` for at sikre korrekt peer dependency opløsning.
    * Forbedringer til TypeScript-definitionerne for et udvidet MUI-tema.
    * Korrektioner i brugen af props på MUI-komponenter.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Sikre kompatible `@types/react` og MUI versioner:**
        * Research MUI's dokumentation for v5.14.3 for at se, hvilken version af `@types/react` den officielt understøtter eller forventer.
        * Overvej at justere `resolutions` i rod `package.json` hvis en lidt anden patch-version af `@types/react@18.2.x` er bedre egnet.
    * **Korrekt typning af udvidet MUI-tema:**
        ```typescript
        // Eksempel: packages/ui/theme/index.ts (eller en separat types.d.ts fil)
        import { ThemeOptions, Theme } from '@mui/material/styles';

        declare module '@mui/material/styles' {
          interface CustomThemeOptions extends ThemeOptions {
            customPalette?: {
              extraLight?: string;
            };
          }
          interface CustomTheme extends Theme {
            customPalette: {
              extraLight: string;
            };
          }
          // Allow to pass CustomTheme to createTheme
          export function createTheme(options?: CustomThemeOptions): CustomTheme;
        }

        // ... i din createTheme kald:
        // export const theme = createTheme({
        //   palette: { /* ... */ },
        //   customPalette: { extraLight: '#f0f0f0' },
        // });
        ```
    * **Korrekt brug af `sx` prop med stærk typning:**
        ```typescript
        import { Box, SxProps, Theme } from '@mui/material';

        const myComponentStyles: SxProps<Theme> = (theme) => ({
          backgroundColor: theme.palette.primary.main, // Korrekt typechecket temaadgang
          padding: theme.spacing(2),
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        });

        function MyStyledComponent() {
          return <Box sx={myComponentStyles}>Hello</Box>;
        }
        ```
    * **Tjek `packageExtensions` i `.yarnrc.yml`:**
        ```yaml
        # .yarnrc.yml
        packageExtensions:
          "@mui/material@*":
            peerDependencies:
              "@types/react": "*" # Dette tillader MUI at bruge den version af @types/react, der er løst i projektet.
                                 # Hvis der er konflikter, kan det være nødvendigt at specificere et mere præcist version range her,
                                 # eller sikre at den globale resolution er 100% kompatibel.
        ```

### Fejl ID: TS-004.5 (Tidligere TS-005)
* **Trigger-tekst / Fejlkode:**
    * Zod valideringsfejl for miljøvariabler der kastes ved opstart af API'en (`apps/api/src/main.ts` via `serverEnv()` import fra `@repo/config`).
    * Fejl som `Error: Ugyldige server-side miljøvariabler. Tjek .env filen og konsollen.`
* **AI Masterprompt:**
    ```
    Min NestJS API (`apps/api`) fejler ved opstart med en Zod valideringsfejl relateret til miljøvariabler, som håndteres i `packages/config/src/env.ts`.
    Funktionen `parseServerEnv` i `env.ts` har en betingelse for `process.env.CI || (process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION === 'true')`, hvor den kan returnere dummy-værdier eller springe validering over.

    Analyser følgende:
    1.  **Miljøvariabler i det aktuelle miljø:** Hvilke miljøvariabler er sat (eller mangler) når fejlen opstår (lokalt, Docker, CI)? Tjek `.env` filer (`envfiler.txt` viser flere), `docker-compose.yml` (environment section), og CI workflow-filer (`.github/workflows/ci.yml`).
    2.  **Zod Skema i `packages/config/src/env.ts`:** Er `serverSchema` korrekt defineret til at matche de *faktisk påkrævede* miljøvariabler for API'en? Er alle felter, der *skal* være der, markeret som påkrævede (ikke `.optional()`)?
    3.  **Logik i `parseServerEnv`:** Er betingelsen for at springe validering over (`process.env.CI || (process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION === 'true')`) korrekt og dækker den alle relevante scenarier? Hvad er værdien af `SKIP_ENV_VALIDATION` i produktionslignende builds?
    4.  **Importrækkefølge:** Importeres og kaldes `serverEnv()` fra `@repo/config` *før* alle nødvendige miljøvariabler er indlæst af NestJS's `ConfigModule` (som specificeret i `apps/api/src/config/config.module.ts` og `apps/api/src/main.ts`)?

    Foreslå en løsning. Dette kan involvere at:
    * Korrigere de manglende/forkerte miljøvariabler i det relevante miljø.
    * Justere `serverSchema` i `packages/config/src/env.ts` til at matche de reelle krav (f.eks. gøre visse felter valgfri med `.optional()` eller give dem defaults, hvis det er acceptabelt).
    * Revurdere logikken for at springe validering over i `parseServerEnv`.
    * Sikre at NestJS's `ConfigModule` indlæser `.env` filen *før* `@repo/config/env` importeres og validerer.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Sikre at `.env` indlæses tidligt i `apps/api/src/main.ts` (hvis ikke allerede håndteret af `@nestjs/config`):**
        ```typescript
        // apps/api/src/main.ts
        // import * as dotenv from 'dotenv';
        // dotenv.config(); // Kald dette FØR import af AppModule eller @repo/config hvis nødvendigt

        import { AppModule } from './app.module';
        // ... resten af bootstrap
        ```
        *(Bemærk: `@nestjs/config`'s `ConfigModule.forRoot({ isGlobal: true, envFilePath: ... })` bør normalt håndtere indlæsning af `.env` filer globalt og tidligt nok. Problemet kan ligge i, at `packages/config/src/env.ts` selv kalder `serverEnv()` ved modul-load, hvilket kan ske før NestJS's `ConfigModule` har parset alle env-filer, hvis `@repo/config` importeres på et højt niveau i `AppModule` eller en af dens direkte imports.)*
    * **Juster `serverSchema` i `packages/config/src/env.ts` (eksempel):**
        ```typescript
        // packages/config/src/env.ts
        export const serverSchema = z.object({
          DATABASE_URL: z.string().url(),
          JWT_SECRET: z.string().min(32),
          SOME_OPTIONAL_VAR: z.string().optional(), // Gør en variabel valgfri
          ANOTHER_VAR_WITH_DEFAULT: z.string().default("default_value"), // Tilføj default
          // ...
        });
        ```
    * **Sæt `SKIP_ENV_VALIDATION=true` i produktionslignende Docker builds, hvis det er intentionen at springe Zod-validering over der.**

### Fejl ID: TS-005 (Nyt - Baseret på Developer 2's TS-3)
* **Trigger-tekst / Fejlkode:**
    * `error TS2344: Type 'X' does not satisfy the constraint 'Y'.`
    * `error TS2559: Type 'X' has no properties in common with type 'Y'.`
    * TypeScript kompileringsfejl, der indikerer, at `strictNullChecks` eller andre `strict` flags opfører sig forskelligt i `apps/api` sammenlignet med andre pakker, der måske forventer fuld strict-mode.
* **AI Masterprompt:**
    ```
    Min kodebase har en potentiel konflikt i TypeScript strict-indstillinger.
    `packages/tsconfig/base.json` sætter `"strict": true`.
    Men `packages/tsconfig/nestjs.json` (som `apps/api/tsconfig.json` arver fra) deaktiverer specifikke strict-flags:
    - `"strictNullChecks": false`
    - `"noImplicitAny": false`
    - `"strictBindCallApply": false`

    Dette kan føre til inkonsistent typecheckning og potentielt maskere fejl i `apps/api` som ville blive fanget i andre dele af monorepoet, der arver `base.json` mere direkte eller ikke overskriver disse flags.

    Analyser:
    1.  **Konsekvenser:** Hvilke konkrete risici eller typer af fejl kan opstå i `apps/api` specifikt på grund af `strictNullChecks: false` og `noImplicitAny: false`?
    2.  **Årsag til Override:** Er der en specifik grund til, at disse flags er deaktiveret i NestJS-preset'et? Er det pga. ældre afhængigheder eller NestJS-specifikke mønstre, der er svære at typechecke strengt?
    3.  **Mulighed for Harmonisering:** Er det muligt at genaktivere disse strict-flags i `apps/api/tsconfig.json` (eller `packages/tsconfig/nestjs.json`) og rette de typefejl, der måtte opstå?
    4.  **Påvirkning på `@repo/core`:** Hvis `@repo/core` er bygget med fuld strict-mode, og `apps/api` konsumerer det med `strictNullChecks: false`, kan der opstå uventede null/undefined værdier på grænsefladen mellem dem?

    Foreslå en strategi for at håndtere denne uoverensstemmelse. Bør vi:
    a) Forsøge at aktivere alle strict-flags i `apps/api` og rette de resulterende fejl?
    b) Dokumentere præcist, hvorfor disse flags er deaktiveret for `apps/api` og acceptere risikoen?
    c) Lave en mere gradvis overgang til fuld strict-mode for `apps/api`?

    Hvis løsning (a) vælges, identificer de primære områder i `apps/api` koden, der sandsynligvis vil kræve ændringer for at blive `strictNullChecks` og `noImplicitAny` kompatible.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Aktiver strict flags i `packages/tsconfig/nestjs.json` eller `apps/api/tsconfig.json`:**
        ```json
        // packages/tsconfig/nestjs.json (eller apps/api/tsconfig.json)
        {
          "extends": "./base.json", // Eller "../../packages/tsconfig/base.json"
          "compilerOptions": {
            // ... andre NestJS specifikke options ...
            // Fjern eller sæt til true:
            // "strictNullChecks": false, (fjern for at arve fra base.json)
            // "noImplicitAny": false, (fjern for at arve fra base.json)
            // "strictBindCallApply": false, (fjern for at arve fra base.json)

            // Hvis du vil være eksplicit:
            "strictNullChecks": true,
            "noImplicitAny": true,
            "strictBindCallApply": true
          }
        }
        ```
    * **Typiske kodeændringer for `strictNullChecks: true`:**
        * Tilføj `| null` eller `| undefined` til typer hvor værdier kan være fraværende.
        * Brug non-null assertion operator (`!`) med forsigtighed, kun hvor du er sikker på, at værdien ikke er null/undefined.
        * Brug optional chaining (`?.`) og nullish coalescing (`??`).
        * Tilføj eksplicitte checks for `null` eller `undefined` før brug af en variabel.
    * **Typiske kodeændringer for `noImplicitAny: true`:**
        * Tilføj eksplicitte typer til alle funktionsparametre, variable og returtyper, hvor TypeScript ikke kan udlede typen.

---