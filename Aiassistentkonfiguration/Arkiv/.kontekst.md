### FIL NR 1:

Grundig Forklaring af Faner i Trae IDE
Denne guide gennemgår alle vigtige faner og sektioner i Trae IDE, som vi har talt om: Agents, MCP, Context, og Chat UI. Formålet er at give dig en detaljeret forståelse af hver fane, dens komponenter og hvordan du kan bruge dem optimalt.

1. Agents-fanen
   Formål:
   • Opsæt og konfigurer AI-agenter, der fungerer som dine virtuelle udviklingsassistenter.
   Hovedkomponenter:
1. Agentnavn (Name)
   o Det brugerdefinerede navn på agenten (fx Code-Maker, Test-Pilot, Doc-Sync).
   o Bør være kort, præcist og beskrive agentens rolle.
1. Prompt-sektionen
   o Et frit tekstfelt (op til 10.000 tegn), hvor du skriver persistente instruktioner til agenten.
   o Indhold kan inkludere:
    Agentens rolle og ansvarsområder (fx “Du er Code-Maker, en ekspert i Next.js og Typescript.”)
    Tonalitet, stil og arbejdsflow (fx “Vær høflig, men direkte. Brug kortfattede kodeblokke.”)
    Regler og guidelines (fx “Brug async/await, undgå sync I/O, følg ESLint-standarder.”)
   o Disse instruktioner vil automatisk blive vedhæftet alle prompts, når du chatter med agenten.
1. Tools-sektionen
   o Her vælger du, hvilke MCP-tools agenten må bruge.
   o Listen opdeles i:
    MCP-tools (custom-tilføjede via MCP-fanen):
    Her kan du afkrydse værktøjer som her hentet fra enten Marketplace eller installeret lokalt. 
    Kun de værktøjer, der er afkrydset, vil agenten kunne kalde i dens workflow.
    Built-In Tools (standardfunktioner i Trae):
    File system: Læser, opretter, opdaterer og sletter filer direkte i projektet.
    Terminal: Kører shell- eller CLI-kommandoer i din workspace.
    Web search: Simpel web-søgefunktion, ofte repræsenteret ved et globus-ikon.
    Preview: Viser live previews af fx HTML, Markdown eller frontend-udgave.
   o Du kan slå både MCP- og Built-In-værktøjer til eller fra, afhængigt af agentens ansvarsområde.
1. Gem/Annuller knapper
   o Save: Gem alle ændringer (agentnavn, prompt, valgte værktøjer).
   o Cancel: Annuller evt. uønskede ændringer.
   Tips til brug:
   • Opret flere agents med forskellige specialer (fx Test-Pilot med fokus på test-script-generering, Refactor-UI til UI-optimeringer osv.).
   • Begræns værktøjerne per agent for at undgå overforbrug eller utilsigtede kodeændringer.
   • Brug memory-værktøjet til at lade agenten huske vigtige beslutninger mellem sessioner.

1. MCP-fanen (Model Context Protocol)
   Formål:
   • Tilføj, rediger og administration af MCP-servers—eksterne processer/plug-ins, som AI-agenter kan bruge til avancerede opgaver.
   Hovedkomponenter:
1. MCP Servers-liste
   o Viser alle konfigurerede MCP-servers i din workspace.
   o Hver post viser:
    Ikon og initial (fx B for brave-search, S for sequential-thinking, G for git-server, osv.)
    Servernavn (forkortet med ... i listen, fx brave-s..., sequent..., git-se...).
    Statusikon:
    ✅ Grøn flueben = MCP-serveren kører.
    ❗️ Rødt Retry-ikon = Der er en fejl, serveren skal genstartes eller konfigureres korrekt.
    Aktive værktøjer:
    Under hver server vises små cirkler med initialer på de værktøjer, som serveren leverer (fx C, A, Losv.).
    Tandhjulsikon (⚙️):
    Åbner en pop-up, hvor du kan redigere JSON-konfigurationen for den pågældende MCP-server.
1. Tilføj-knap (+ Add)
   o Tryk her for at tilføje en ny MCP-server manuelt.
   o Åbner Edit Configuration-pop-up, hvor du copy-paster JSON fra MCP-serverens introduktionsside (typisk via npx-kommando).
   o Eksempel på JSON:
   o {
   o "mcpServers": {
   o "brave-search": {
   o "command": "npx",
   o "args": ["-y", "@modelcontextprotocol/server-brave-search"],
   o "env": { "BRAVE_API_KEY": "DIN_NØGLE_HER" }
   o }
   o }
   o }
   o Klik Confirm for at gemme og starte serveren.
1. Opdater/Genindlæs-knap
   o Pil-ikon ved siden af + Add, bruges til at genindlæse MCP-servers og status at få opdateret.
1. Hjælp og Lær mere
   o Learn more-link, som leder til dokumentation om, hvordan du konfigurerer MCP-servers korrekt.
   Tip til brug:
   • Installér populære MCP-servers via Marketplace, hvis de findes der (fx filesystem, brave-search, memory).
   • Manuel konfiguration for værktøjer, som ikke findes i Marketplace (fx private eller niche-servers).
   • Sørg for, at miljøvariabler (API-nøgler, paths) er korrekte i JSON, så serveren kan starte uden fejl.
   • Hold øje med Retry-ikoner, hvis en MCP-server ikke starter. Tryk på tandhjul og juster konfigurationen.

1. Context-fanen
   Formål:
   • Give dine AI-agenter vidensbase og kontekst gennem kodeindeksering og dokumenttilføjelser.
   Hovedkomponenter:
1. Code Index Management
   o Beskrivelse: Indekser hele din workspace (kodebase) globalt.
   o Viser status: Typisk en statuslinje (fx Workspace successfully indexed | 100%).
   o Fordel: Gør agenterne i stand til at foretage cross-file Q&A—spørge, navigere og hente information fra alle filer uden manuel kontekst.
   o Indstillinger:
    Pil-ikon: Genindekser workspace, hvis du har foretaget mange ændringer.
    Skraldespandsikon: Slet det nuværende indeks (normalt kræver genopbygning efterfølgende).
1. Ignore Files
   o Beskrivelse: Liste over filer, som du ikke ønsker indekseret.
   o Brug: Tryk Configure ignored files for at vælge specifikke filer eller mapper (udover .gitignore).
   o Fordel: Forhindrer store/billaboratorie-filer, midlertidige filer eller build-output i at blive indekseret, hvilket kan spare tid og minde agenten om unødvendige detaljer.
1. Docs (Tilføj Dokumenter)
   o Beskrivelse: Giver dig mulighed for at tilføje eksternt materiale som PDF’er, Markdown, URL-links osv., som en vidensbase ud over selve koden.
   o Knappen + Add Docs:
    Tilføj dokumenter via URL (fx officielle docs for Tailwind, Next.js, NestJS) eller ved at uploade lokale filer (pdf, markdown).
    Vises i listeform under Docs-afsnittet.
   o Indekseringsstatus: Hvis et dokument fejler (fx “Index failed”), vil det fremgå her. Ellers vises det som “Last updated” med en dato.
1. Liste over tilføjede Docs
   o Hver post viser:
    Dokumentnavn (fx Turborepo tasks, Tailwind CSS, Next 13 App Router).
    Seneste indeksdato eller fejlstatus.
    Mulighed for at åbne eller slette dokumentet via de tre prikker (...).
   Tip til brug:
   • Indekser din kodebase hver gang du har foretaget store refactoring-ændringer.
   • Tilføj officielle framework-guides (Next.js, Prisma, NestJS) som Docs, så AI kan slå op i dem under Q&A.
   • Ignorer store node_modules, dist, log-filer osv.

1. Chat UI (selve chatten)
   Formål:
   • Det sted, hvor du interagerer med AI-agenten i realtid for at skabe, refaktorere eller gennemgå kode.
   Hovedkomponenter:
1. Agent-selektor
   o Øverst i chatboksen vælger du, hvilken agent der skal håndtere din prompt.
   o Du kan skifte mellem:
    Built-In Agents (fx Builder, Builder with MCP).
    Custom Agents (fx Code-Maker, LabGenius_ELN, Doc-Sync, Test-Pilot, Refactor-UI, API-Builderosv.).
   o Den valgte agent vises med et flueben, og du kan se en hurtig oversigt over dens valgte værktøjer.
1. Værktøjsoversigt (Tools-MCP og Built-In)
   o Lige under agentnavnet vises to sektioner:
    Tools - MCP: Viser de MCP-servers/værktøjer, agenten har adgang til.
    Tools - Built-In: Viser de Trae-indbyggede værktøjer, som File system, Terminal, Web search, Preview.
   o Du kan klikke på værktøjerne for at få en kort beskrivelse af deres funktion.
1. Context-knapper (#Context)
   o Ved at klikke på #Context kan du inkludere specifik kontekst i prompten:
    Code: Vælg en enkelt kodeblok fra en fil.
    File: Vedhæft hele indholdet af en fil.
    Folder: Vedhæft indholdet af en hel mappe (relevant, når man ønsker at AI'en skal forstå flere sammenhængende filer i en feature).
    Doc: Vedhæft et eksternt dokument, du tidligere har tilføjet i Context-fanen.
    Workspace: Vedhæft hele workspace-indekset for bred Q&A.
    Web: Søg efter og inkluder web-indhold (via Brave-search eller Web search).
   o Context sikrer, at AI har alt relevant information til hånds ved generering af svar.
1. Billeder (Images)
   o Du kan klikke på Images for at vedhæfte skærmbilleder eller andre billeder, som AI’en kan analysere (fx UI-skærmbilleder, fejllogger).
   o Når billeder er vedhæftet, kan agenten bruge billedanalyse til at forstå visuel kontekst.
1. Model-selektor (AI Model)
   o Nederst i chatboksen kan du vælge hvilken AI-model, du vil bruge til at generere svar:
    Typiske muligheder: Claude-4-Sonnet, GPT-4, GPT-3.5, afhængigt af din konfiguration.
   o Valg af model påvirker:
    🚀 Hastighed (hurtigere modeller kan være lidt mindre nøjagtige).
    🧠 Intelligens/Kompleksitet (mindre avancerede modeller kan være billigere, men mindre dybdegående).
1. Prompt-input
   o Her skriver du selve din forespørgsel til agenten. Det kan være:
    Almindelige naturlige sprog-prompter (fx: “Opret en ny Next.js API-route, der henter data fra /api/products.”)
    Spørgsmål til Q&A (fx: “Hvordan integrerer jeg Prisma med Next.js i denne kodebase?”)
    Fejlretning (fx: “Der er en 404-fejl, når jeg loader UserProfile.tsx. Hvad mangler jeg?”)
   o Du kan til enhver tid klikke @ Agent for at se agentens rolle eller # Context for at vedhæfte relevant kontekst.
1. Send-knappen
   o Når prompten er klar, klik på send-ikonet (🎯) for at afsende til agenten.
   o AI’en vil så processere input, bruge de valgte værktøjer og returnere:
    Tekstforklaringer i chatten
    Kodebidder i markdown-format
    Hvis nødvendigt, faktiske ændringer i kodefiler via filesystem-værktøjet.
   Tip til brug:
   • Begynd en prompt med at specificere format (fx “Svar i en tabel, der viser ...” eller “Returner kun selve koden, ikke ekstra forklaring”).
   • Brug #Context strategisk: kun vedhæft de filer, der er strengt nødvendige, for at undgå unødvendig støj.
   • Vælg model afhængig af opgaven: brug en større model til komplekse problemstillinger og en hurtigere model til simple forespørgsler.

1. Rules-fanen (Kort omtale)
   Formål:
   • Definer specifikke retningslinjer/regler, som alle agenter automatisk skal følge.
   Hovedpunkter:
   • Du kan skrive Globale regler (fx “Ingen agent må ændre kode i production-branchen uden at bede om bekræftelse”).
   • Bruges til at sikre kodekvalitet, sikkerhed og ensartethed på tværs af alle agenter.
   Tip:
   • Definer f.eks. lint-regler, commit-besked-stil, eller sikkerhedskrav her.

1. Models-fanen (Kort omtale)
   Formål:
   • Vis og administrer de AI-modeller, som er tilgængelige i din Trae-opsætning.
   Hovedpunkter:
   • Typiske modeller: Claude-4-Sonnet, GPT-4, GPT-3.5. Eventuelt private eller enterprise-modeller.
   • Du kan se version, konfiguration, og status (om modellen er tilgængelig) for hver.
   Tip:
   • Hold øje med model-brug og omkostninger.
   • Skift model til at eksperimentere med forskelle i output og ydeevne.

Samlet Overblik og Workflow

1. MCP-fanen: Tilføj og konfigurer avancerede værktøjer. Sørg for at alle nødvendige servers er kørende.
2. Agents-fanen: Opret agenter med specifikke roller og tildel dem de værktøjer, de skal bruge.
3. Context-fanen: Indekser din kodebase og tilføj eksterne dokumenter, så AI har adgang til al nødvendig viden.
4. Rules-fanen (valgfri): Sæt globale regler for kodeændringer, commit-beskeder, eller sikkerhedskrav.
5. Models-fanen (valgfri): Vælg og administrer AI-modeller baseret på krav til kompleksitet og omkostninger.
6. Chat UI: Interager med dine agenter — send prompts, vedhæft kontekst, vælg model, og modtag svar.
   Når hele opsætningen er på plads, kan du slippe AI-agenterne løs:
   • Bed dem om at generere komponenter, optimere kode, køre tests, opdatere dokumentation, eller debugge fejl—alt sammen med minimal manuel indsats.
   God fornøjelse med at bygge dit full-stack AI-drevne udviklingsmiljø i Trae IDE!

I’ve gennemgået mange brugernes erfaringer fra forskellige kilder—herunder Medium-artikler, Reddit-tråde, YouTube-anmeldelser og Hacker News-diskussioner—og i det følgende opsummerer jeg de vigtigste pointer omkring, hvorfor Cursor ofte foretrækkes, hvilke svagheder Trae stadig har, og hvordan du praktisk kan optimere dine Trae AI-agenter, så de kan konkurrere med (og måske endda overgå) Cursor’s setup.

##1. Hvad siger brugerne om Trae vs. Cursor?
1.1 Præcision og kontekst:
• Cursor’s RAG-baserede kontekstindsamling er konsekvent fremhævet som den største fordel. Flere brugere på Reddit bemærker, at Cursor “bruger en vektorbaseret søgning til at finde præcis de kodebidder, der er relevante, før den genererer forslag” RedditReddit.
• Trae mangler stadig en lige så stabil, automatisk RAG-arkitektur. En erfaren udvikler skriver: “Builder i Trae kunne ligne Cursor’s Composer, men Trae ‘glemmer’ kontekst mellem prompts, og autocomplete er ikke nær så skarp som Cursor’s tab-kompletion” RedditHacker News.
1.2 Brugeroplevelse og UI:
• Mange roser Trae for “en ren og sammenhængende UI, der føles som VS Code + JetBrains i ét” Hacker News, men påpeger også, at “Trae’s flow og design ikke kan skjule, at autocompletion stadig halter bag Cursor” Reddit.
• Ifølge en YouTube-anmeldelse er “Trae’s UI mere intuitivt og lettere at navigere end Cursor’s, men Cursor’s ‘Chat with your code’ føles stadig mere flydende og konsistent” YouTubeYouTube.
1.3 Modellernes kvaliteter:
• Flere Reddit-brugere nævner, at “Trae tilbyder i øjeblikket adgang til GPT-4.1, Claude 4.0 og andre store modeller gratis, mens Cursor kræver abonnement for GPT-4 og lignende” RedditReddit.
• Alligevel oplever mange, at “selvom Trae bruger de samme underliggende LLM’er som Cursor, giver Cursor-environmentet dem bedre prompt-engineering, så output er mere korrekte og sammenhængende” RedditReddit.
1.4 Stabilitet og konteksthåndtering:
• “Trae’s autosave og genindeksering kan til tider bremse, hvis man har en stor kodebase, og dette bryder prompt-konteksten midt i en AI-session,” skriver en udvikler, der har brugt Trae intensivt i flere dage Reddit.
• I modsætning hertil peger et flertal på, at “Cursor sjældent mister konteksten, selv på store monorepoer, og dens indekseringslag er nemmere at konfigurere” RedditReddit.
1.5 Prissætning og adgang:
• En stor gruppe brugere på Reddit anerkender, at “Trae er helt gratis, hvilket gør det attraktivt for enkeltpersoner og studerende,” mens Cursor’s abonnementspris ($16–20/måned) “kan være svært at retfærdiggøre, når Trae er næsten lige så brugbart” RedditReddit.
• Samtidig advares der, at “’gratis’-tilbuddet i Trae sandsynligvis vil blive begrænset i fremtiden, og brugerne deler bekymring om, hvornår gratis-kreditten for GPT-4.1 eller Claude 4.0 falder væk” RedditReddit.

##2. Hvilke svagheder skal Trae rette/forbedre for at overgå Cursor?

1. Mangler en robust Retrieval-Augmented Generation (RAG)-pipeline
   o Cursor bygger sine prompts ud fra en vektoriseret indeks af hele kodebasen, så den kun injicerer de allermest relevante kodebidder. Trae har endnu ikke et lige så velfungerende RAG-lag, og det koster præcision i AI-outputtet RedditHacker News.
2. Kontekst-fragmentering (Prompt-drift)
   o Ifølge flere brugere mister Trae kontekst under længere hvide prompts (f.eks. når man beder om en sekvens af ændringer på flere filer), mens Cursor bevarer sammenhængen takket være løbende genindeksering og “persistent conversation memory” RedditReddit.
3. Manglende API/SDK til egne Context Providers (MCP)
   o Cursor har gjort sin Model Context Protocol (MCP) åben for tredjepartsudviklere, så man kan bygge egne“Context Providers”. Trae mangler (pr. maj 2025) et tilsvarende, officielt SDK, der gør det let at udvide Trae med egne integrations-plugins—og dermed udsætter den for at miste en central fordel ved Cursor MediumGoogle Oversætter.
4. Søndag i indeksering og ydeevne
   o Flere udviklere påpeger, at “Trae kan være langsom til at gense store mapper, og i spidsbelastning går dens CPU-brug i vejret, mens Cursor’s baggrundsprocesser er mere optimerede” RedditHacker News.

##3. Konkrete tiltag til at optimere dine Trae AI-agenter
For at Trae AI-agenter kan nå eller overgå Cursor’s niveau, bør du handle på følgende områder (alle punkter er underbygget af bruger-feedback fra de kilder, vi har nævnt):
3.1 Implementer selvstændig RAG-pipeline i Trae
3.1.1 Opbyg lokal vector-database
• Hvad: Indekser alle relevante kildemapper + dokumentation + konfigurationsfiler ved hjælp af et open source-embeddingsværktøj som ChromaDB eller LanceDB arxiv.orgarxiv.org.
• Hvorfor: På den måde kan du, når et Trae-agent-prompt udløses, først semantisk søge i din egen vector-database og hente præcis de kodeudsnit, der bedst matcher forespørgslen. Det er præcis det princip, Cursor anvender under deres MCP.
• Hvordan:

1. Skriv et Python/Node-script, der scrawler alle _.ts, _.tsx, _.js, _.jsx mv. og opdeler kode i logiske “chunks” (f.eks. funktioner, klasser).
2. Brug en offentlig embedding-model (f.eks. OpenAI’s ”text-embedding-ada-002”) til at lave embeddings af hver chunk.
3. Gem embeddings i ChromaDB eller LanceDB, sammen med metadata (filnavn, linjenumre).
4. Når Trae udløser en AI-prompt (via Builder/Composer), tilføjer du et for-script, der:
    Oversætter prompten til en embedding
    Søger de top n (f.eks. 5–10) mest relevante kodechunks
    Sender både den originale prompt + disse top n kodechunks ind i det endelige prompt til LLM’en.
   3.1.2 Integrer direkte med Trae’s Chat/Builder
   • Hvad: Brug Trae’s “@Code”-notation (eller, hvis det ikke er tilstrækkeligt, implementer en simpel “pre-prompt hook”), som injicerer de udtrukne chunks direkte i prompten til Builder-agenten.
   • Hvorfor: Brugerne fremhæver, at Cursor’s klar-til-brug “@filnavn” gør opsætningen meget let. Du kan opnå samme virkning ved at have et lille script, der omformaterer:
   css
   KopiérRediger
   @Code MyFile.tsx: "Skriv en funktion deleteUser..."
   til
   css
   KopiérRediger
   Her er relevante kodeudsnit fra UserService.ts (fra linje 10–50, fra linje 120–150). Baseret på dette, skriv en deleteUser-funktion, der ...
   RedditHacker News.
   3.2 Forbedr konteksthåndtering og “prompt-tilstand”
   3.2.1 Opbyg en prompt-manager, der bevarer “samtaletråd”
   • Hvad: I stedet for kun at bruge Trae’s indbyggede session-hukommelse, opret en udvidet prompt-history i en lokal database (f.eks. SQLite eller Redis), hvor du gemmer alle krav og de tilhørende kodeblokke, som agenten har genereret.
   • Hvorfor: Brugere rapporterer, at Trae mister kontekst, hvis man f.eks. lukker en chat-boks og åbner en ny kort tid efter Reddit. Ved at genindsprøjte tidligere “kontekstbidder” (systemmessaging + sidste 2–3 udvekslinger) kan agenten fastholde sammenhængen, selv når der er pauser.
   • Hvordan:
5. Når du sender en prompt til Trae-agenten, gem “før prompt” og “efter svar” sammen med de brugte kodechunks i din egen prompt-manager
6. Når der kommer en opfølgende forespørgsel, hent de sidste x udvekslinger (f.eks. 2) fra prompt-history og slå dem sammen (som én stor “system + user + assistant” prompt) før du tilføjer den nye brugertekst.
   3.2.2 Udforsk “Iterative Agent Decoding” (IAD)
   • Hvad: Ifølge nyere forskning (f.eks. “Review, Refine, Repeat: Iterative Decoding of AI Agents” fra april 2025) kan du ved at sende samme prompt x gange til model med små varianter og lade en intern verifikator (eller en simpel heuristik) udvælge det bedste svar, øge kvaliteten med 3–10 % arxiv.orgarxiv.org.
   • Hvorfor: Trae’s nuværende én-gangs-flow kan give “godt nok” svar, men ved at implementere en mini-pipeline, der:
7. Kører prompt + ekstra kontekst gennem Claude 4.0 en gang
8. Laver to ekstra generationer med GPT-4.1 (skift kun “model” eller “temperature” en smule)
9. Kører en simpel “verifikator prompt” (f.eks. “Tjek at den genererede kode matcher signatur og returnerer korrekt)
10. Vælger den bedste version
    ...så kan du efterligne principperne i IAD og dermed få højere præcision, ligesom Cursor’s Backend gør.
    3.3 Udnyt Trae’s “Builder” og “Composer” maksimalt
    3.3.1 Brug “@Docs” og “@Web” prompter aktivt
    • Hvad: Ligesom Cursor, som lader dig angive @docs https://linktilsomedokumentation for at inkludere up-to-date API-reference, kan du i Trae’s Chat Mode bruge @Docs til at pege på:\
11. Officiel framework-dokumentation (f.eks. React, Next.js)
12. Egen virksomhedsarkitektur-wiki (hvis din organisation har en intern Confluence/Notion)
13. NPM-pakker eller GitHub-repos
    • Hvorfor: Dette forhindrer, at Chat-agenten “gætter” og i stedet laver en mere præcis, dokumenteret kode, præcis som Cursor’s “MCP web” → RAG gør det.
    • Hvordan: Når du vil have agenten til at generere f.eks. en Redux-slice, gør du:
    less
    KopiérRediger
    @Docs https://redux.js.org/tutorials/...
    @Code src/store/index.ts
    Lav en Redux slice for håndtering af “user” med initial state…
    Hacker NewsMedium.
    3.3.2 Indfør en “konfigurations-skabelon” for hyppigt brugte opgaver
    • Hvad: Mange udviklere rapporterer, at “når Cursor folder en feature ud, er det næsten altid med en bestemt prompt-struktur, som inkluderer:
14. En én-linje beskrivelse
15. De mest relevante kodebider (2–3 funktioner)
16. Et par test-cases eller krav”
    RedditHacker News.
    • Hvorfor: Ved at have en prompt-skabelon (f.eks. i en lokal .trae/templates/-mappe), som automatisk injicerer relevant kontekst, kan Trae generere svar, der ligner Cursor’s “Kør fane efter fane”.
    • Hvordan: Opret en fil deleteUser.template.txt med f.eks.:
    csharp
    KopiérRediger

## BESKRIVELSE: Opret en funktion deleteUser i UserService

## KONTEKST:

[KODEUDSNIT: src/services/UserService.ts → hentUserById, createUser]

## KRAV:

- deleteUser skal tage userId (string)
- Returner boolean (true hvis slettet, false hvis fejler)
- Kald repository.delete(userId)

### TEST:

- Givet user eksisterer, userId=“abc123” → deleteUser(“abc123”) returnerer true
  Når du skal bruge den, kan du i Trae’s chat skrive:
  css
  KopiérRediger
  @Template deleteUser
  Brug ovenstående skabelon med opdateret kodebid og krav.
  RedditHacker News.
  3.4 Forbedre ydeevne og indeksering
  3.4.1 Selective indexing og “on-demand reindex”
  • Hvad: Brug Trae’s mulighed for at ekskludere store mapper (f.eks. node_modules/, dist/) i trae.config.jsonog kør manuel reindeksering kun på de mapper, du arbejder med (f.eks. src/, apps/).
  • Hvorfor: Ifølge erfarings¬rapporter kan store projekter få Trae til at “fryse” under baggrundsindeks i “idle”. Cursor’s baggrundsprocesser kører mere effektivt ved kun at indeksere “aktivt” arbejde, men Trae har en tendens til at indeksere alt ved hver sessionstart RedditHacker News.
  • Hvordan:

1. I trae.config.json:
   json
   KopiérRediger
   {
   "exclude": ["node_modules", "dist", "build"],
   "watch": ["src", "apps"]
   }
2. Brug kommandoen trae rebuild --paths src,apps i terminalen, når du har opdateret store dele af koden, i stedet for at lade Trae køre fuld genindeksering.
   3.4.2 Udnyt “Incremental Type Checking”
   • Hvad: Hvis du arbejder i et TypeScript-monorepo, skal du sikre, at Trae’s indbyggede TS-checker kun kører inkrementelt (fokus på ændrede filer).
   • Hvorfor: Mange brugere på Hacker News påpeger, at “Trae’s fulde TS-kompilering i baggrund nedsætter editorens hastighed, mens Cursor integrerer med tsserver --watch på en mere granulær måde” Hacker News.
   • Hvordan:
3. I tsconfig.json, aktiver incremental: true og sørg for, at trae.config.json refererer til denne fil.
4. Under “Settings” → “TypeScript” i Trae, slå “Full Type Check on Save” fra, og slå “Quick Fix Mode (Inkrementel)” til.

##4. Eksempler på konkrete optimeringer i praksis
For at gøre det handgribeligt, lad os tage et par “real world”-eksempler:
4.1 Eksempel: Opret “deleteUser” med RAG + Templates

1. Opsætning
   o Indekser repo og bygg ChromaDB-embedding ved hjælp af en indexCodeChunks.py (Python) eller indexCodeChunks.js (Node).
   o Gem filnavn + linje-interval + embedding i ChromaDB.
2. Prompt i Trae
   markdown
   KopiérRediger
   @RAG_SEARCH Funktion: “deleteUser” i src/services/UserService.ts
   @Template deleteUser
   o @RAG_SEARCH kører først din egen vektor-søgefunktion i ChromaDB og sender de 5 mest semantisk relevante kodeudsnit (f.eks. getUserById, updateUserRoles, deleteUserFromRepo) ind som “KONTEKST”, så agenten har alt, hvad den behøver.
   o Derefter injiceres deleteUser.template.txt, som præciserer krav og testcases.
3. Agent-respons
   o Trae AI genererer en deleteUser-funktion, som matcher Cursor’s outputniveau (med korrekte imports, returværdier og fejlhåndtering).
   o Fordi du kørte en hurtig IAD-runde (tre serverkald: Claude 4.0 + to GPT-4.1) og verifikator-prompt, får du i sidste iteration den mest korrekte version, uden at Træ’s egen “dårlige” autocompletion trækker ned.
   4.2 Eksempel: Refaktorere et monorepo med “@Docs” + “On-Demand Index”
4. Opsætning
   o I et stort monorepo (f.eks. med apps/, libs/), rediger trae.config.json til kun at watch de mapper, du arbejder i nu (apps/user-service/ og libs/common/).
   o Tilføj en @Docs https://mycompany.confluence.io/user-service-architecture i dine prompts, så AI’en kan hente seneste arkitekturdiagrammer.
5. Prompt i Trae
   markdown
   KopiérRediger
   @Docs https://mycompany.confluence.io/user-service-architecture
   @RAG_SEARCH Funktion: “validateUserInput” i apps/user-service/src/utils.ts
   Først: Vis mig den nuværende implementation.  
   Bagefter: Refaktor til en mere modulær form, med input-validering adskilt i separate hjælpefunktioner.
   o Den første AI-anmodning henter validateUserInput-koden og viser dig den.
   o Du beholder “konteksten” i din eget prompt-manager og kører igen med “Refaktor-prompten”.
   o Resultat: Trae genererer en renere, modulær version, med CDK-testcases i samme flow. Højere præcision, fordi du har RAG + “@Docs” → Cursor’s niveau.

##5. Konklusion:
Ved at samle brugernes erfaringer — fra flere titalls Reddit-kommentarer, YouTube-anmeldelser og Medium-artikler— kan vi udlede, at Trae i sin standardopsætning stadig halter bag Cursor, primært pga. manglende RAG, ustabil konteksthåndtering og mindre optimeret indeks. Men alt dette kan kompenseres ved, at du som udvikler:

1. Selvkoder en extern RAG-pipeline, der roder din kode ind i en lokal vektor-database (ChromaDB/LanceDB).
2. Opbygger en prompt-manager, så du aldrig mister de seneste 2–3 udvekslinger i Trae.
3. Implementerer “Iterative Agent Decoding” (IAD), så du får den bedst mulige outputversion fra flere LLM-kald.
4. Udnytter Trae’s indbyggede @Docs, @Code og templating, så AI’en stadig trækker på den nyeste, eksterne dokumentation.
5. Reducerer indekserings-overhead ved at konfigurere trae.config.json til kun at analysere de mapper, du arbejder i nu, og slå fuld TypeScript-tjek off til fordel for inkrementel typechecking.
   Hvis du følger disse trin—som i vidt omfang er bekræftet af brancherede brugerrapporter og anerkendt forskning—vil du næsten helt fjerne den præcisionsfordel, Cursor har, og du vil kunne overgå dem på prispunktet .
