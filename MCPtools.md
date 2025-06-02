* **Agents / LearningLab-Master** (titel i øverste bjælke)

* **rag-server** ✓ - OPTIMERET KODEBASE & DOKUMENTATIONSSØGNING
  • search\_documentation - PRIMÆR: Søg i kodebasen og dokumentation med optimeret RAG-pipeline
    * BRUG: For kodeforståelse, API docs, framework guides, best practices
    * EKSEMPEL: `search_documentation({ query: "Next.js App Router data fetching", n_results: 3 })`
    * AVANCERET: `search_documentation({ query: "authentication", filepath: "/apps/api/src/auth/auth.service.ts", n_results: 5 })`

* **memory** ✓ - PERSISTENT HUKOMMELSE
  • create\_entities - KRITISK: Gem vigtige beslutninger og komponenter
    * BRUG: Ved afslutning af opgaver for at gemme resultater
    * EKSEMPEL: `create_entities({ type: "feature", name: "UserAuth", properties: { files: ["auth.service.ts"] } })`
  • create\_relations - Forbind relaterede entiteter (f.eks. komponenter der bruger samme service)
  • add\_observations - KRITISK: Tilføj observationer under implementering
    * BRUG: Efter hvert vigtigt trin i implementeringen
    * EKSEMPEL: `add_observations({ entityIds: ["UserAuth"], content: "Implementeret JWT token refresh" })`
  • delete\_entities - Fjern forældede entiteter
  • delete\_observations - Fjern ukorrekte observationer
  • delete\_relations - Fjern forældede relationer
  • read\_graph - Få overblik over hele vidensgrafen
  • search\_nodes - KRITISK: Søg efter tidligere beslutninger
    * BRUG: Ved start af hver opgave for at finde relevant kontekst
    * EKSEMPEL: `search_nodes({ query: "authentication", limit: 5 })`
  • open\_nodes - Åbn specifikke noder for detaljeret visning

* **sequential-thinking** ✓ - PLANLÆGNING
  • sequentialthinking - KRITISK: Generer detaljeret plan før implementering
    * BRUG: Som første skridt for ALLE opgaver
    * EKSEMPEL: `sequentialthinking({ prompt: "Implementer bruger authentication med JWT", steps: 7 })`

* **file-context-server** ✓ - KODE KONTEKST
  • read\_context - KRITISK: Hent relevant kode baseret på semantisk søgning
    * BRUG: Som første skridt for at forstå eksisterende kode
    * EKSEMPEL: `read_context({ query: "user authentication", limit: 5 })`
  • get\_chunk\_count - Se antal indekserede kodestykker
  • set\_profile - Indstil profil for kontekstindsamling
  • get\_profile\_context - Hent kontekst baseret på profil
  • generate\_outline - Generer overblik over kodestruktur

* **Puppeteer** ✓ - UI TESTING
  • puppeteer\_navigate - Naviger til URL for test
    * BRUG: Start UI test flows
    * EKSEMPEL: `puppeteer_navigate({ url: "http://localhost:3000/login" })`
  • puppeteer\_screenshot - KRITISK: Tag screenshot efter UI ændringer
    * BRUG: Verificer UI ændringer visuelt
    * EKSEMPEL: `puppeteer_screenshot({ selector: ".login-form" })`
  • puppeteer\_click - Klik på elementer for interaktionstest
  • puppeteer\_fill - Udfyld formularer for test
  • puppeteer\_select - Vælg fra dropdown for test
  • puppeteer\_hover - Test hover effekter
  • puppeteer\_evaluate - Kør JavaScript i browser kontekst

* **filesystem** ✓ - FILHÅNDTERING
  • read\_file - KRITISK: Læs fil indhold før ændringer
    * BRUG: Før enhver filredigering
    * EKSEMPEL: `read_file({ path: "/apps/api/src/auth/auth.service.ts" })`
  • read\_multiple\_files - Læs flere filer på én gang
  • write\_file - Skriv ny fil
    * BRUG: Opret nye komponenter eller moduler
    * EKSEMPEL: `write_file({ path: "/apps/api/src/auth/jwt.strategy.ts", content: "..." })`
  • edit\_file - KRITISK: Rediger eksisterende fil
    * BRUG: Opdater eksisterende kode
    * EKSEMPEL: `edit_file({ path: "/apps/api/src/auth/auth.service.ts", changes: [...] })`
  • create\_directory - Opret ny mappe
  • list\_directory - List indhold af mappe
  • directory\_tree - Få træstruktur af mapper
  • move\_file - Flyt fil til ny placering
  • search\_files - KRITISK: Søg efter filer med mønster
    * BRUG: Find relevante filer når file-context-server er utilstrækkelig
    * EKSEMPEL: `search_files({ pattern: "auth*.ts", directory: "/apps/api/src" })`
  • get\_file\_info - Få metadata om fil
  • list\_allowed\_directories - Se tilladte mapper

* **Tools – Built-In**
  • File system ✓ - BACKUP: Kun hvis filesystem MCP fejler
  • Terminal ✓ - KRITISK: For alle build, test og git kommandoer
    * BRUG: Kør tests, installer dependencies, git operationer
    * EKSEMPEL: `Terminal.run("npm test -- apps/api/src/auth")`
  • Web search ☐ - Ikke aktiveret
  • Preview ✓ - Kun til visning af output til brugeren
