# Master-Prompt Manual for LearningLab (Del 2: Next.js, Build, CI/CD & Docker Fejl)

Dette dokument er en fortsættelse af Master-Prompt Manualen og fokuserer på potentielle fejl og problemområder specifikt relateret til Next.js frontend-applikationen (`apps/web`), samt generelle build-, CI/CD- og Docker-udfordringer i LearningLab-monorepoet.

---

## Indholdsfortegnelse (for denne del)

4.  [Next.js (Frontend) Specifikke Fejl](#kategori-4-nextjs-frontend-specifikke-fejl)
5.  [Build, CI/CD og Docker](#kategori-5-build-cicd-og-docker)
6.  [Linting, Kodekvalitet og Projektregler](#kategori-6-linting-kodekvalitet-og-projektregler)

---

## Kategori 4: Next.js (Frontend) Specifikke Fejl

### Fejl ID: NEXT-001
* **Trigger-tekst / Fejlkode:**
    * Build-fejl: `Error: Route /courses/[slug] conflicts with /courses/[slug] in /app. Please switch to the App Router or remove the conflicting route.`
    * Uforudsigelig routing, hvor den ene router (Pages eller App) tager forrang over den anden.
    * Advarsler i konsollen om route overlap.
* **AI Masterprompt:**
    ```
    Min Next.js applikation i `apps/web` (version 13.4.12) bruger både Pages Router (`pages/`) og App Router (`app/`). Jeg oplever [build-fejl om route overlap / uforudsigelig routing] for ruten `[indsæt den problematiske rute, f.eks. /courses/[slug]]`.

    Analyser følgende for at identificere og løse konflikter mellem Pages Router og App Router:
    1.  **Mappestruktur:** Gennemgå både `apps/web/pages/` og `apps/web/app/` mapperne. Findes der filer/mapper, der definerer den samme URL-sti (f.eks. `pages/courses/[slug].tsx` og `app/courses/[slug]/page.tsx`)?
    2.  **Next.js Version:** Bekræft at Next.js 13.4.12 håndterer sameksistens af disse routere som forventet. Er der specifikke konfigurationer i `next.config.js`, der er nødvendige for at understøtte denne sameksistens, eller som kan forårsage konflikter?
    3.  **Middleware:** Hvis `middleware.ts` (eller `.js`) bruges, påvirker den routingen for både Pages og App Router på en uventet måde for den problematiske rute?
    4.  **Strategi for Migration:** Hvad er den langsigtede strategi for overgang til App Router? Er den nuværende overlapning en del af en midlertidig migrationsfase, eller er det en utilsigtet fejl?

    Foreslå en løsning. Dette kan indebære at:
    * Omdøbe eller slette en af de konflikterende ruter.
    * Justere `next.config.js` hvis der er relevante indstillinger.
    * Anbefale en klar strategi for fuld overgang til App Router for de berørte stier for at undgå fremtidige konflikter.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Fjernelse af duplikat rute:**
        * Hvis `app/courses/[slug]/page.tsx` er den nye standard, slet `pages/courses/[slug].tsx`.
        * Eller omvendt, hvis Pages Router stadig er primær for denne sti.
    * **Strategisk migration:**
        * Planlæg at flytte al funktionalitet fra den ældre router-fil til den nyere for den specifikke sti.
        * Opdater alle interne links til at pege på den korrekte version af ruten.
    * **Tjek `next.config.js`:**
        * Selvom Next.js 13.4 tillader sameksistens, er der sjældent specifikke config-flags for at løse direkte sti-overlap udover at fjerne en af dem. Fokus er på filsystem-baseret routing.

### Fejl ID: NEXT-002
* **Trigger-tekst / Fejlkode:**
    * `Error: Hydration failed because the initial UI does not match what was rendered on the server.`
    * `Warning: Expected server HTML to contain a matching <div> in <div>.`
    * Forskelle i UI mellem første load (SSR/SSG) og efter client-side hydration.
    * Indhold "hopper" eller ændrer sig pludseligt efter siden er loadet.
* **AI Masterprompt:**
    ```
    Min Next.js applikation i `apps/web` oplever hydration errors på siden `[indsæt side-URL eller komponentnavn]`. Den server-renderede HTML matcher ikke den client-side renderede HTML.

    Analyser følgende for at finde årsagen til hydration mismatchet:
    1.  **Client-Side Kun Logik:** Er der kode i komponenten (eller dens børn), der kun kører på klienten og ændrer DOM-strukturen, *uden* at dette er korrekt håndteret (f.eks. med `useEffect` og en state-variabel, der initialiseres til at matche serveren og først opdateres efter mount)? Eksempler:
        * Brug af `window`, `localStorage`, `navigator` objekter direkte i render-logik.
        * Betinget rendering baseret på client-side state, der er forskellig fra server-state ved initial render.
    2.  **Tilfældighed eller Tidsafhængighed:** Bruger komponenten `Math.random()`, `new Date()`, eller lignende, der kan give forskellige værdier på server og klient under initial render?
    3.  **Forkert Brug af `useEffect`:** Bruges `useEffect` til at modificere DOM direkte på en måde, der ikke afspejles i den virtuelle DOM, eller som sker før hydration er komplet?
    4.  **Data Hentning:** Hvis siden bruger `getServerSideProps` eller `getStaticProps`, er der en risiko for, at dataen, der sendes til komponenten, er forskellig fra den data, klienten forventer eller henter igen? (Mindre sandsynligt for hydration error, men kan påvirke UI).
    5.  **Tredjepartsbiblioteker:** Bruger siden tredjepartsbiblioteker, der manipulerer DOM direkte og potentielt forstyrrer Reacts hydration-proces?
    6.  **`apps/web/pages/_app.tsx` og `Layout.tsx` (`apps/web/src/components/layout/Layout.tsx`):** Er der global state eller logik i disse filer, der kan forårsage forskelle mellem server- og client-render?
    7.  **CSS/Styling:** Kan CSS (især CSS-in-JS løsninger, hvis de bruges forkert) forårsage, at server-renderet markup har andre dimensioner/layout end client-renderet, hvilket fører til mismatches? (Mindre typisk for direkte hydration error, men kan bidrage til layout shifts).

    Identificer den specifikke kode, der forårsager hydration-fejlen, og foreslå en patch. Dette kan involvere at flytte client-specifik logik ind i en `useEffect` hook, bruge en state-variabel til at kontrollere rendering af client-specifikt indhold, eller sikre at data er konsistent.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Håndtering af client-side kun rendering:**
        ```typescript
        // I en React komponent
        import { useState, useEffect } from 'react';

        function MyComponent() {
          const [isClient, setIsClient] = useState(false);

          useEffect(() => {
            setIsClient(true);
          }, []);

          if (!isClient) {
            // Returner null eller en placeholder, der matcher server-render
            return null; // Eller <p>Loading...</p> hvis serveren også sender det
          }

          // Nu kan du rendere client-specifikt indhold
          return <div>Current window width: {window.innerWidth}</div>;
        }
        ```
    * **Undgå tilfældighed i render:**
        * Hvis en unik ID er nødvendig, generer den på serveren og send den som prop, eller brug `useId` hook fra React 18.
        * For datoer, hvis de skal være "nu", overvej at formatere dem konsistent eller passere dem som props fra serveren.
    * **Korrekt brug af `useEffect` for DOM manipulation (sjældent nødvendigt):**
        * DOM manipulationer bør primært ske gennem Reacts state og props. Hvis direkte manipulation er uundgåelig, sørg for det sker *efter* første mount i `useEffect`.

### Fejl ID: NEXT-003
* **Trigger-tekst / Fejlkode:**
    * `Warning: "fetch" is not available. Please supply a custom "fetchFn" property to use "fetchBaseQuery" on SSR environments.` (Denne er fra Developer 2, N-3, og er relevant her).
    * State fra en brugers request "lækker" til en anden brugers request under SSR.
    * Uforudsigelig opførsel af Redux Toolkit (RTK) Query cache på serveren.
* **AI Masterprompt:**
    ```
    Min Next.js applikation i `apps/web` bruger Redux Toolkit (RTK) Query via `apps/web/src/store/services/api.ts` for datahentning. Jeg er bekymret for korrekt SSR/SSG-integration og potentielle problemer som state-lækage eller `fetch is not available` fejl under tests.
    `apps/web/pages/_app.tsx` wrapper applikationen i `<ReduxProvider store={store}>`.
    `apps/web/jest.setup.js` har pt. ingen eksplicit global `fetch` polyfill.

    Analyser følgende:
    1.  **`makeStore` Funktion (`store/index.ts`):** Opretter `makeStore` en *ny* Redux store instans for hver server-side request, eller genbruges en global store-instans? Genbrug kan føre til state-lækage.
    2.  **RTK Query `fetchBaseQuery` Konfiguration (`store/services/api.ts`):**
        * Er `fetchBaseQuery` korrekt konfigureret til SSR, især ift. `fetchFn`? Hvis Next.js's indbyggede `fetch` ikke er tilgængelig eller opfører sig anderledes i visse server-kontekster (eller Jest-testmiljøet), kan en custom `fetchFn` være nødvendig.
        * Hvordan håndteres caching på serveren? Er der risiko for, at cachet data fra én bruger serveres til en anden?
    3.  **Datahentning i `getServerSideProps`/`getStaticProps`:** Hvis RTK Query hooks bruges inde i disse funktioner (indirekte via `store.dispatch(api.endpoints.someEndpoint.initiate())` og `await Promise.all(api.util.getRunningOperationPromises())`), hvordan sikres det, at dataen er korrekt serialiseret og rehydreret på klienten?
    4.  **Jest Testmiljø (`apps/web/jest.setup.js`):** Manglen på en eksplicit `fetch` polyfill (som `whatwg-fetch`) kan forårsage, at RTK Query-kald fejler i tests med "fetch is not available", da `jest-environment-jsdom`'s `fetch` måske ikke er tilstrækkelig.

    Foreslå:
    * Eventuelle nødvendige ændringer til `makeStore` for at sikre, at en ny store oprettes per request på serveren.
    * Anbefalinger til konfiguration af `fetchBaseQuery` for SSR, inklusiv om en custom `fetchFn` er nødvendig.
    * Hvordan man korrekt bruger RTK Query til datahentning i `getServerSideProps`/`getStaticProps`.
    * En patch til `apps/web/jest.setup.js` for at tilføje en `fetch` polyfill, hvis det vurderes nødvendigt for at RTK Query kan køre i tests.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Sikre ny store per request (typisk håndteret af `next-redux-wrapper`, men hvis manuelt):**
        ```typescript
        // apps/web/src/store/index.ts (konceptuelt)
        export function makeStore() {
          return configureStore({ /* ... */ });
        }
        // I _app.tsx eller datahentningsfunktioner, sørg for at kalde makeStore() for hver request/render på serveren.
        // next-redux-wrapper håndterer dette elegant.
        ```
    * **Tilføj `fetch` polyfill til `apps/web/jest.setup.js`:**
        ```javascript
        // apps/web/jest.setup.js
        import '@testing-library/jest-dom/extend-expect';
        import 'whatwg-fetch'; // Tilføj denne linje

        jest.mock('next/router', () => require('next-router-mock'));
        ```
    * **Brug af RTK Query i `getServerSideProps` (eksempel med `next-redux-wrapper`):**
        ```typescript
        // pages/some-page.tsx
        import { wrapper } from '../src/store'; // Fra din next-redux-wrapper opsætning
        import { api, useGetSomeDataQuery } from '../src/store/services/api';

        export const getServerSideProps = wrapper.getServerSideProps(
          (store) => async (context) => {
            // Start datahentning på serveren
            store.dispatch(api.endpoints.getSomeData.initiate('arg'));
            
            // Vent på at alle operationer er færdige
            await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()));
            
            return {
              props: {}, // Data vil være i storen og rehydreres
            };
          }
        );

        function SomePage() {
          const { data, error, isLoading } = useGetSomeDataQuery('arg');
          // ... render data ...
        }
        export default SomePage;
        ```

### Fejl ID: NEXT-004
* **Trigger-tekst / Fejlkode:**
    * Fejlmeddelelse: `Error: Invalid src prop (https://example.com/image.jpg) on `next/image`, hostname "example.com" is not configured under images in your `next.config.js``
    * Billeder loader ikke, eller der vises en brudt billed-ikon.
    * Dårlig billedperformance (store, uoptimerede billeder serveres).
    * Build-fejl i Docker relateret til `sharp` (hvis Next.js forsøger at optimere lokalt i containeren uden `sharp`'s native dependencies).
* **AI Masterprompt:**
    ```
    Min Next.js applikation i `apps/web` bruger `<Image />` komponenten fra `next/image` (version 13.4.12). Jeg oplever problemer med [billeder fra eksterne domæner loader ikke / dårlig billedperformance / build-fejl relateret til 'sharp' i Docker].
    Min `Dockerfile.web` bruger `node:22-alpine` som base image.

    Analyser følgende:
    1.  **`next.config.js` - `images` konfiguration:**
        * Er `images.remotePatterns` (eller det ældre `images.domains`) korrekt konfigureret til at tillade alle de eksterne hostnames, hvorfra jeg henter billeder?
        * Er andre `images` indstillinger (f.eks. `deviceSizes`, `imageSizes`, `formats`) optimale for mit brugsscenarie?
    2.  **Brug af `<Image />` komponenten:**
        * Angives `width` og `height` props korrekt for billeder, der ikke er `layout="fill"`?
        * Bruges `priority` prop for LCP (Largest Contentful Paint) billeder?
        * Bruges `quality` prop for at justere kompressionsniveau?
        * Anvendes `sizes` prop korrekt for responsive billeder med `layout="responsive"` eller `layout="fill"`?
    3.  **Docker (`Dockerfile.web`):**
        * Alpine Linux (`node:22-alpine`) er minimalistisk. Mangler der systemafhængigheder for `sharp` (som Next.js bruger til billedoptimering on-demand, hvis ikke en loader som Vercel/Cloudinary bruges)? Typiske mangler kan være `build-base`, `gcc`, `python3`, `vips-dev`.
        * Overvejer min `next.config.js` `output: 'standalone'`? Hvis ja, hvordan påvirker det billedoptimeringsserveren?
    4.  **Loader Konfiguration:** Bruger jeg en ekstern billed-loader (f.eks. Vercel, Imgix, Cloudinary) konfigureret i `next.config.js` `images.loader` og `images.path`, eller stoler jeg på Next.js's indbyggede optimeringsserver? Hvis indbygget, gælder punkt 3.

    Foreslå rettelser til `next.config.js` for `images` konfigurationen. Hvis problemet er Docker-relateret, foreslå nødvendige ændringer til `Dockerfile.web` for at installere `sharp` dependencies. Giv også generelle anbefalinger til optimal brug af `<Image />` komponenten.
    ```
* **Løsningsskabeloner (Eksempler):**
    * **Korrekt `images.remotePatterns` i `apps/web/next.config.js`:**
        ```javascript
        // apps/web/next.config.js
        /** @type {import('next').NextConfig} */
        const nextConfig = {
          // ... andre indstillinger
          images: {
            remotePatterns: [
              {
                protocol: 'https',
                hostname: 'images.example.com', // Tillad billeder fra images.example.com
                port: '',
                pathname: '/account123/**', // Tillad kun billeder under denne sti
              },
              {
                protocol: 'https',
                hostname: 'another-domain.com', // Tillad alle billeder fra another-domain.com
              },
            ],
            // Eksempel på deviceSizes hvis du har specifikke behov
            // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
            // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
          },
        };
        module.exports = nextConfig;
        ```
    * **Installation af `sharp` dependencies i `Dockerfile.web` (hvis Next.js's default optimizer bruges):**
        ```dockerfile
        # apps/web/Dockerfile.web
        # ... (efter FROM node:22-alpine AS base eller lignende)

        # Installer nødvendige dependencies for sharp (billedoptimering) på Alpine
        # Dette trin er vigtigt, hvis du bruger Next.js's indbyggede billedoptimering
        # og ikke en ekstern loader (som Vercel, der håndterer det for dig).
        # RUN apk add --no-cache vips-dev build-base gcc autoconf automake zlib-dev libtool nasm python3
        # Bemærk: Ovenstående er et eksempel. De præcise pakker kan variere.
        # For Next.js 13+ med SWC, er 'sharp' ofte ikke nødvendig for basisoptimering,
        # men kan være for avancerede features eller hvis du har 'experimental.serverComponentsExternalPackages: ['sharp']'.
        # Next.js's default Rust-baserede optimering er ofte tilstrækkelig på Alpine.
        # Hvis du oplever 'sharp' fejl, kan det være nødvendigt at installere 'vips'.

        # ... (resten af din Dockerfile)
        ```
        *Vigtig note om `sharp` i Docker:* Med nyere Next.js versioner (12+) er `sharp` ikke altid et hårdt krav for billedoptimering, da Next.js har indbygget optimering via SWC. Hvis du *ikke* ser `sharp`-relaterede fejl, er det sandsynligvis ikke nødvendigt at installere `vips-dev` osv. i din Alpine-container. Hvis du *gør*, så er ovenstående linjer relevante. Vercel og lignende platforme håndterer typisk billedoptimering for dig.

---