# Plan for at færdiggøre E1 - MVP-UI

## Oversigt over E1 opgaver

| Key  | Summary                      | Status | SP | Beskrivelse                                                    |
| ---- | ---------------------------- | ------ | -- | -------------------------------------------------------------- |
| E1‑1 | Layout & App‑shell           | WIP    | 5  | Header m. logo, user‑menu; sidebar collapsible; dark‑mode toggle |
| E1‑2 | AuthContext + ProtectedRoute | TODO   | 3  | Uautoriseret redirect → `/login`; efter login redirect → lastRoute |
| E1‑3 | Dashboard page               | TODO   | 5  | Grid af kurser (`/courses` API) + placeholder statistik |
| E1‑4 | Kursusflow V1                | TODO   | 8  | `courses/[slug]` → modul‑liste; `lessons/[id]` viser TEXT‑contentBlocks |

## Detaljeret implementeringsplan

### 1. Færdiggørelse af E1-1: Layout & App-shell (WIP → DONE)

**Estimeret tid:** 1-2 dage

**Opgaver:**

1. **Færdiggør header-komponenten:**
   - Implementer logo og navigation
   - Tilføj user-menu dropdown med placeholder for brugerinfo
   - Tilføj responsive design for mobil/tablet

2. **Implementer sidebar:**
   - Opret collapsible sidebar-komponent
   - Tilføj navigation links til forskellige sektioner
   - Implementer toggle-funktion for at vise/skjule sidebar

3. **Tilføj dark-mode toggle:**
   - Implementer context for theme-state
   - Opret toggle-komponent for dark/light mode
   - Tilføj CSS-variabler for farver i begge temaer

4. **Integrér app-shell i layout:**
   - Opret en layout-komponent der indeholder header og sidebar
   - Implementer responsive design for hele app-shell
   - Test på forskellige skærmstørrelser

### 2. Implementering af E1-2: AuthContext + ProtectedRoute

**Estimeret tid:** 1 dag

**Opgaver:**

1. **Opret AuthContext:**
   - Implementer context med state for authentication (isAuthenticated, user, loading)
   - Tilføj login/logout funktioner
   - Tilføj token-håndtering (localStorage/sessionStorage)

2. **Implementer ProtectedRoute komponent:**
   - Opret HOC eller komponent der tjekker authentication status
   - Implementer redirect til login-side for uautoriserede brugere
   - Gem lastRoute i state/localStorage for at kunne redirecte tilbage efter login

3. **Opret login-side:**
   - Design simpel login-formular
   - Implementer form-validering
   - Tilslut til AuthContext for login-funktionalitet

4. **Test authentication flow:**
   - Test redirect fra beskyttede routes
   - Test login og redirect tilbage til oprindelig route

### 3. Implementering af E1-3: Dashboard page

**Estimeret tid:** 1-2 dage

**Opgaver:**

1. **Opret API-integration:**
   - Implementer service/hooks til at hente kurser fra `/courses` API
   - Tilføj loading og error states
   - Implementer caching af data hvis nødvendigt

2. **Design kursus-grid:**
   - Opret responsive grid-layout for kurser
   - Design kursus-kort med billede, titel, beskrivelse
   - Implementer hover/fokus effekter

3. **Tilføj placeholder statistik:**
   - Design widgets til statistik (antal kurser, fremskridt, etc.)
   - Implementer placeholder data indtil backend er klar
   - Gør widgets responsive

4. **Implementer filtrering/søgning:**
   - Tilføj søgefelt for kurser
   - Implementer filtrering efter kategori/tags
   - Tilføj sorteringsmuligheder

### 4. Implementering af E1-4: Kursusflow V1

**Estimeret tid:** 2-3 dage

**Opgaver:**

1. **Opret kursusside med dynamisk routing:**
   - Implementer `courses/[slug]` route
   - Hent kursusdata baseret på slug
   - Design kursusside med header, beskrivelse og moduler

2. **Implementer modulliste:**
   - Design liste over moduler i kurset
   - Tilføj progress-indikator for hvert modul
   - Implementer navigation mellem moduler

3. **Opret lesson-side:**
   - Implementer `lessons/[id]` route
   - Design lesson-side med navigation og indhold
   - Tilføj breadcrumb navigation

4. **Implementer content blocks:**
   - Opret komponenter for TEXT-contentBlocks
   - Implementer rendering af forskellige indholdstyper
   - Tilføj styling for indholdsblokke

## Tekniske overvejelser

1. **State Management:**
   - Brug React Context for global state (auth, theme)
   - Overvej React Query for data fetching og caching

2. **Styling:**
   - Brug Tailwind CSS for konsistent styling
   - Implementer responsive design fra starten
   - Brug CSS-variabler for theming

3. **Komponent-struktur:**
   - Opret genbrugelige komponenter i UI-pakken
   - Dokumenter komponenter med JSDoc/TSDoc
   - Implementer prop-validering med TypeScript

4. **Performance:**
   - Implementer lazy loading af routes
   - Optimer rendering med useMemo/useCallback hvor relevant
   - Brug Next.js Image-komponent for optimerede billeder

## Testplan

1. **Unit tests:**
   - Test AuthContext og ProtectedRoute logik
   - Test data fetching hooks/services

2. **Integration tests:**
   - Test navigation flow mellem sider
   - Test authentication flow

3. **Responsive tests:**
   - Test på forskellige skærmstørrelser
   - Test på forskellige browsere

## Definition af Done

- Alle komponenter er implementeret og stylet
- Responsive design fungerer på alle skærmstørrelser
- Authentication flow fungerer korrekt
- API-integration er implementeret (med mock data hvis nødvendigt)
- Alle acceptance kriterier er opfyldt
- Koden er dokumenteret og følger projektets kodestil
- Tests er skrevet og passerer

## Næste skridt efter E1

- Begynde på E2 - Quiz Core
- Forbedre UI/UX baseret på feedback
- Implementere backend integration for manglende endpoints