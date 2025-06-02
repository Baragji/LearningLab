# Project Rules

1.  ## **Værktøjsprioritet & Fallback (STRIKT SEKVENS)**
    * **Kontekstindsamling (OBLIGATORISK FØRSTE SKRIDT):**
        1. Brug `memory.search_nodes` til at hente tidligere beslutninger med MINDST 3-5 forskellige søgetermer.
        2. Brug `file-context-server.read_context` med MINDST 3-5 specifikke søgetermer relateret til opgaven.
        3. Brug `rag-docs-ollama.search_documentation` for ekstern viden med MINDST 3 forskellige søgetermer.
        4. Hvis ingen resultater, prøv med flere og bredere søgetermer før du går til fallback-strategien.
        5. FALLBACK: Hvis ovenstående fejler, brug `filesystem.search_files` med multiple mønstre + `read_file`.
    * **Planlægning (OBLIGATORISK ANDET SKRIDT):**
        * Brug `sequential-thinking.sequentialthinking` med den hentede kontekst OG brugerens prompt.
        * Planen SKAL indeholde 5-7 konkrete, handlingsorienterede trin.
        * HVERT trin SKAL specificere præcist hvilke værktøjer der vil blive brugt og hvilke filer der vil blive påvirket.
        * Inkluder en verifikationsstrategi for HVERT trin.
    * **Fil I/O:**
        * Brug ALTID MCP `filesystem` til alle filoperationer.
        * Hent ALTID filindhold før redigering med `filesystem.read_file`.
        * Brug ALDRIG relative stier - brug altid absolutte stier startende med projektets rod.
        * FALLBACK: Hvis MCP `filesystem` fejler (fejl eller timeout), brug Built-in `File system` og log en advarsel.
    * **Udførelse:**
        * Brug `Terminal` eksklusivt til git, build, test og dependency operationer.
        * Tjek ALTID kommandooutput og exit code før du fortsætter.
        * Dokumenter ALTID kommandoens resultat og hvordan det påvirker næste trin.

2.  ## **Commit Scope (PRÆCISE REGLER)**
    * `<scope>` i commit-beskeden SKAL matche det primære directory for opgaven (f.eks. `api`, `web`, `ui`).
    * Stage KUN stier relevante for den aktuelle opgave (f.eks. `git add apps/api/src/auth/**`).
    * Stage ALDRIG ikke-relaterede filer eller genererede filer, der bør ignoreres.
    * Respekter ALTID `.gitignore`.
    * Kør ALTID `git status` før commit for at verificere staged filer.
    * Inkluder ALTID en detaljeret commit-besked, der forklarer HVAD og HVORFOR.

3.  ## **Test Gate (OBLIGATORISK FØR COMMIT)**
    * Definer en `<task_scope_directory>` variabel baseret på opgavekonteksten.
    * Kør ALTID tests målrettet kun dette directory: `npm test -- <task_scope_directory>/` eller tilsvarende.
    * Hvis exit code ikke er 0: STOP, ret fejl, og kør tests igen.
    * Commit og push KUN ved exit code 0.
    * For UI-ændringer, valider ALTID med `puppeteer_screenshot` før og efter ændringer.
    * Dokumenter ALTID testresultater med `memory.add_observations`.

4.  ## **Commit Message Format (STRIKT FORMAT)**
    * `<type>(<scope>): <short description>`
    * `type`: feat | fix | docs | style | refactor | test | chore
    * `scope`: Dynamisk bestemt mappe- eller modulnavn.
    * `description`: Koncis, specifik og i imperativ form (f.eks. "add", ikke "added").
    * EKSEMPLER:
        * `feat(auth): implement JWT refresh token mechanism`
        * `fix(api): resolve user profile data retrieval issue`
        * `refactor(ui): optimize button component rendering`
    * Inkluder ALTID en detaljeret beskrivelse i commit-body, der forklarer HVORFOR ændringen blev foretaget.

5.  ## **Memory Logging (OMFATTENDE PROTOKOL)**
    * **Under opgaveudførelse:**
        * Kald `memory.add_observations` efter HVERT betydningsfuldt trin med detaljerede beskrivelser.
        * Inkluder filstier, komponentnavne og kodestykker i observationer.
        * Beskriv ALTID både hvad der blev gjort og HVORFOR det blev gjort på den måde.
    * **Efter test-succes (exit code 0):**
        * Kald `memory.create_entities` med en relevant type (f.eks. `feature`, `bugfix`, `test`).
        * Inkluder detaljerede egenskaber: filer, komponenter, afhængigheder, arkitektoniske beslutninger.
        * Tilføj relationer mellem entiteter når det er relevant.
    * **Efter test-fejl:**
        * Kald `memory.add_observations` med fejldetaljer og forsøgte løsninger.
        * Log ALDRIG et succesfuldt resultat, hvis tests fejlede.
        * Dokumenter fejlmønstre og løsningsstrategier for fremtidig reference.
    * **Entitetstyper:**
        * Brug specifikke entitetstyper: 'feature', 'bug', 'refactor', 'test', 'docs'
        * Inkluder relationer mellem entiteter når det er relevant.
        * Brug konsekvent navngivning for entiteter på tværs af projektet.

6.  ## **Dokumentation & Kommentarer (OBLIGATORISK)**
    * **Offentlige API'er:** KRÆVER omfattende JSDoc med @param, @returns, og @example.
    * **Interne funktioner:** Tilføj en one-line kommentar, der forklarer formål og ikke-åbenlys adfærd.
    * **Kompleks logik:** Tilføj inline kommentarer for enhver kode med ikke-triviel logik.
    * **Projektdokumentation:**
        * Opdater projekt README for nye endpoints eller scripts.
        * Opdater relevante dokumentationsfiler i `/docs` directory.
        * For nye features, tilføj brugseksempler.
        * Dokumenter ALTID arkitektoniske beslutninger og deres begrundelse.

7.  ## **Plan First (OBLIGATORISK WORKFLOW)**
    * Kør ALTID `sequential-thinking.sequentialthinking` før ENHVER kodeændring.
    * Planen SKAL indeholde 5-7 konkrete, handlingsorienterede trin.
    * Hvert trin SKAL specificere:
        * Hvilke værktøjer der vil blive brugt
        * Hvilke filer der vil blive påvirket
        * Forventet resultat af trinnet
        * Hvordan trinnet vil blive verificeret
    * Vis den genererede plan i begyndelsen af svaret.
    * Følg planen trin for trin, og valider efter hvert trin med konkrete tests eller verifikationsmetoder.
    * Hvis et trin fejler, løs problemet før du fortsætter.

8.  ## **Kodeplacering & Monorepo Logik (STRIKT ARKITEKTUR)**
    * Før filoprettelse SKAL den genererede plan indeholde et trin til at validere den korrekte filsti i henhold til disse regler.
    * **Genanvendelige UI-komponenter:** Placer i `packages/ui/components/`.
        * EKSEMPEL: `packages/ui/components/Button/Button.tsx`
    * **Delt forretningslogik/utilities (core):** Placer i `packages/core/src/`.
        * EKSEMPEL: `packages/core/src/auth/tokenService.ts`
    * **API-specifik kode (NestJS):**
        * Moduler: `apps/api/src/modules/`
        * Controllers: `apps/api/src/modules/<module-name>/controllers/`
        * Services: `apps/api/src/modules/<module-name>/services/`
        * DTOs: `apps/api/src/modules/<module-name>/dto/`
    * **Web-specifik kode (Next.js):**
        * Pages: `apps/web/src/app/`
        * Components: `apps/web/src/components/`
        * Hooks: `apps/web/src/hooks/`
        * Utils: `apps/web/src/utils/`
    * **Database schema (`schema.prisma`):** Må kun redigeres, ikke flyttes.
    * **Tests:** Placer ved siden af koden, der testes, med `.spec.ts` eller `.test.ts` suffiks.
    * Følg ALTID projektets eksisterende mappestruktur og navngivningskonventioner.

9.  ## **Komponentgranularitet og Komposition (STRIKT DESIGNPRINCIPPER)**
    * **Princip:** Favoriser Komposition over Monolitiske Komponenter. Alle komponenter SKAL overholde Single Responsibility Principle.
    * **Regel:** Enhver React-komponent, der forventes at overstige **200 linjer**, SKAL nedbrydes i mindre, enkeltformåls-underkomponenter.
    * **Props Interface:** HVER komponent SKAL have et klart defineret props interface med JSDoc-kommentarer.
    * **Workflow Integration:** Under `sequential-thinking`-fasen, hvis en komponent identificeres som kompleks (f.eks. en side med flere sektioner, formularer og datadisplays), SKAL planen indeholde trin til at refaktorere den til mindre komponenter, hver med et klart defineret sæt props.
    * **Placering af underkomponenter:**
        * Virkelig genanvendelige, generiske komponenter SKAL placeres i `packages/ui/components/`.
        * Side-specifikke underkomponenter SKAL placeres i et lokalt `components/` underdirectory (f.eks. `apps/web/src/app/profile/components/`).
    * **Komponenttestning:** HVER komponent SKAL have mindst én testfil, der verificerer dens rendering og grundlæggende funktionalitet.
    * **Komponentdokumentation:** HVER komponent SKAL have JSDoc-kommentarer, der beskriver dens formål, props og eksempler på brug.

10. ## **Fejlhåndtering & Validering (OMFATTENDE STRATEGI)**
    * **Frontend:**
        * Valider ALTID brugerinput med passende fejlmeddelelser.
        * Implementer formularvalidering ved hjælp af Zod eller lignende skemavalidering.
        * Håndter API-fejl elegant med brugervenlige meddelelser.
        * Implementer graceful fallbacks for alle netværksoperationer.
    * **Backend:**
        * Brug class-validator til DTO-validering.
        * Implementer korrekte exception filters for konsistente fejlresponser.
        * Log fejl med passende alvorlighedsniveauer.
        * Brug try-catch blokke med detaljeret fejlhåndtering.
    * **Database:**
        * Brug Prismas valideringsmuligheder.
        * Implementer korrekt fejlhåndtering for databaseoperationer.
        * Brug transaktioner for operationer, der modificerer flere records.
        * Implementer retry-mekanismer for midlertidige databasefejl.
    * **Testning:**
        * Inkluder fejlcase-tests for al fejlhåndteringskode.
        * Verificer at fejlmeddelelser er brugervenlige og handlingsorienterede.
        * Test edge cases og grænsetilfælde grundigt.
        * Implementer stress-tests for kritiske komponenter.

11. ## **Testdrevet Udvikling (NY OBLIGATORISK PROTOKOL)**
    * Skriv eller opdater tests FØR implementering af funktionalitet.
    * Kør tests efter HVER betydningsfuld ændring for at sikre stabilitet.
    * Implementer både unit tests og integration tests for ny funktionalitet.
    * Dokumenter testresultater og testdækning i memory.
    * Opret ALDRIG pull requests eller commits uden at alle tests er grønne.
    * Implementer automatiserede tests for alle kritiske brugerflows.
    * Brug mocking og stubbing for at isolere testenheder.
    * Implementer snapshot tests for UI-komponenter.

12. ## **Performance & Optimering (NY OBLIGATORISK PROTOKOL)**
    * Implementer lazy loading for tunge komponenter og routes.
    * Optimer database-queries med korrekte indekser og relationsstrategier.
    * Implementer caching for hyppigt anvendte data og API-kald.
    * Minimer bundle-størrelse gennem code-splitting og tree-shaking.
    * Optimer billeder og medier for hurtig indlæsning.
    * Implementer virtualisering for lange lister og tabeller.
    * Mål og dokumenter performance-forbedringer med konkrete metrics.
    * Brug memoization for beregningstunge operationer.