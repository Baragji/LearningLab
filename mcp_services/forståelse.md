Grundig Forklaring af Faner i Trae IDE
Denne guide gennemgår alle vigtige faner og sektioner i Trae IDE, som vi har talt om: Agents, MCP, Context, og Chat UI. Formålet er at give dig en detaljeret forståelse af hver fane, dens komponenter og hvordan du kan bruge dem optimalt.
 
1. Agents-fanen
Formål:
•	Opsæt og konfigurer AI-agenter, der fungerer som dine virtuelle udviklingsassistenter.
Hovedkomponenter:
1.	Agentnavn (Name)
o	Det brugerdefinerede navn på agenten (fx Code-Maker, Test-Pilot, Doc-Sync).
o	Bør være kort, præcist og beskrive agentens rolle.
2.	Prompt-sektionen
o	Et frit tekstfelt (op til 10.000 tegn), hvor du skriver persistente instruktioner til agenten.
o	Indhold kan inkludere:
	Agentens rolle og ansvarsområder (fx “Du er Code-Maker, en ekspert i Next.js og Typescript.”)
	Tonalitet, stil og arbejdsflow (fx “Vær høflig, men direkte. Brug kortfattede kodeblokke.”)
	Regler og guidelines (fx “Brug async/await, undgå sync I/O, følg ESLint-standarder.”)
o	Disse instruktioner vil automatisk blive vedhæftet alle prompts, når du chatter med agenten.
3.	Tools-sektionen
o	Her vælger du, hvilke MCP-tools agenten må bruge.
o	Listen opdeles i:
	MCP-tools (custom-tilføjede via MCP-fanen):
	Her kan du afkrydse værktøjer som brave-search, sequential-thinking, git-server, file-context-server, Puppeteer, package-version, memory, deepview, codegen-mcp, filesystemosv.
	Kun de værktøjer, der er afkrydset, vil agenten kunne kalde i dens workflow.
	Built-In Tools (standardfunktioner i Trae):
	File system: Læser, opretter, opdaterer og sletter filer direkte i projektet.
	Terminal: Kører shell- eller CLI-kommandoer i din workspace.
	Web search: Simpel web-søgefunktion, ofte repræsenteret ved et globus-ikon.
	Preview: Viser live previews af fx HTML, Markdown eller frontend-udgave.
o	Du kan slå både MCP- og Built-In-værktøjer til eller fra, afhængigt af agentens ansvarsområde.
4.	Gem/Annuller knapper
o	Save: Gem alle ændringer (agentnavn, prompt, valgte værktøjer).
o	Cancel: Annuller evt. uønskede ændringer.
Tips til brug:
•	Opret flere agents med forskellige specialer (fx Test-Pilot med fokus på test-script-generering, Refactor-UI til UI-optimeringer osv.).
•	Begræns værktøjerne per agent for at undgå overforbrug eller utilsigtede kodeændringer.
•	Brug memory-værktøjet til at lade agenten huske vigtige beslutninger mellem sessioner.
 
2. MCP-fanen (Model Context Protocol)
Formål:
•	Tilføj, rediger og administration af MCP-servers—eksterne processer/plug-ins, som AI-agenter kan bruge til avancerede opgaver.
Hovedkomponenter:
1.	MCP Servers-liste
o	Viser alle konfigurerede MCP-servers i din workspace.
o	Hver post viser:
	Ikon og initial (fx B for brave-search, S for sequential-thinking, G for git-server, osv.)
	Servernavn (forkortet med ... i listen, fx brave-s..., sequent..., git-se...).
	Statusikon:
	✅ Grøn flueben = MCP-serveren kører.
	❗️ Rødt Retry-ikon = Der er en fejl, serveren skal genstartes eller konfigureres korrekt.
	Aktive værktøjer:
	Under hver server vises små cirkler med initialer på de værktøjer, som serveren leverer (fx C, A, Losv.).
	Tandhjulsikon (⚙️):
	Åbner en pop-up, hvor du kan redigere JSON-konfigurationen for den pågældende MCP-server.
2.	Tilføj-knap (+ Add)
o	Tryk her for at tilføje en ny MCP-server manuelt.
o	Åbner Edit Configuration-pop-up, hvor du copy-paster JSON fra MCP-serverens introduktionsside (typisk via npx-kommando).
o	Eksempel på JSON:
o	{
o	  "mcpServers": {
o	    "brave-search": {
o	      "command": "npx",
o	      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
o	      "env": { "BRAVE_API_KEY": "DIN_NØGLE_HER" }
o	    }
o	  }
o	}
o	Klik Confirm for at gemme og starte serveren.
3.	Opdater/Genindlæs-knap
o	Pil-ikon ved siden af + Add, bruges til at genindlæse MCP-servers og status at få opdateret.
4.	Hjælp og Lær mere
o	Learn more-link, som leder til dokumentation om, hvordan du konfigurerer MCP-servers korrekt.
Tip til brug:
•	Installér populære MCP-servers via Marketplace, hvis de findes der (fx filesystem, brave-search, memory).
•	Manuel konfiguration for værktøjer, som ikke findes i Marketplace (fx private eller niche-servers).
•	Sørg for, at miljøvariabler (API-nøgler, paths) er korrekte i JSON, så serveren kan starte uden fejl.
•	Hold øje med Retry-ikoner, hvis en MCP-server ikke starter. Tryk på tandhjul og juster konfigurationen.
 
3. Context-fanen
Formål:
•	Give dine AI-agenter vidensbase og kontekst gennem kodeindeksering og dokumenttilføjelser.
Hovedkomponenter:
1.	Code Index Management
o	Beskrivelse: Indekser hele din workspace (kodebase) globalt.
o	Viser status: Typisk en statuslinje (fx Workspace successfully indexed | 100%).
o	Fordel: Gør agenterne i stand til at foretage cross-file Q&A—spørge, navigere og hente information fra alle filer uden manuel kontekst.
o	Indstillinger:
	Pil-ikon: Genindekser workspace, hvis du har foretaget mange ændringer.
	Skraldespandsikon: Slet det nuværende indeks (normalt kræver genopbygning efterfølgende).
2.	Ignore Files
o	Beskrivelse: Liste over filer, som du ikke ønsker indekseret.
o	Brug: Tryk Configure ignored files for at vælge specifikke filer eller mapper (udover .gitignore).
o	Fordel: Forhindrer store/billaboratorie-filer, midlertidige filer eller build-output i at blive indekseret, hvilket kan spare tid og minde agenten om unødvendige detaljer.
3.	Docs (Tilføj Dokumenter)
o	Beskrivelse: Giver dig mulighed for at tilføje eksternt materiale som PDF’er, Markdown, URL-links osv., som en vidensbase ud over selve koden.
o	Knappen + Add Docs:
	Tilføj dokumenter via URL (fx officielle docs for Tailwind, Next.js, NestJS) eller ved at uploade lokale filer (pdf, markdown).
	Vises i listeform under Docs-afsnittet.
o	Indekseringsstatus: Hvis et dokument fejler (fx “Index failed”), vil det fremgå her. Ellers vises det som “Last updated” med en dato.
4.	Liste over tilføjede Docs
o	Hver post viser:
	Dokumentnavn (fx Turborepo tasks, Tailwind CSS, Next 13 App Router).
	Seneste indeksdato eller fejlstatus.
	Mulighed for at åbne eller slette dokumentet via de tre prikker (...).
Tip til brug:
•	Indekser din kodebase hver gang du har foretaget store refactoring-ændringer.
•	Tilføj officielle framework-guides (Next.js, Prisma, NestJS) som Docs, så AI kan slå op i dem under Q&A.
•	Ignorer store node_modules, dist, log-filer osv.
 
4. Chat UI (selve chatten)
Formål:
•	Det sted, hvor du interagerer med AI-agenten i realtid for at skabe, refaktorere eller gennemgå kode.
Hovedkomponenter:
1.	Agent-selektor
o	Øverst i chatboksen vælger du, hvilken agent der skal håndtere din prompt.
o	Du kan skifte mellem:
	Built-In Agents (fx Builder, Builder with MCP).
	Custom Agents (fx Code-Maker, LabGenius_ELN, Doc-Sync, Test-Pilot, Refactor-UI, API-Builderosv.).
o	Den valgte agent vises med et flueben, og du kan se en hurtig oversigt over dens valgte værktøjer.
2.	Værktøjsoversigt (Tools-MCP og Built-In)
o	Lige under agentnavnet vises to sektioner:
	Tools - MCP: Viser de MCP-servers/værktøjer, agenten har adgang til (fx Puppeteer, brave-search, filesystem, memory, sequential-thinking).
	Tools - Built-In: Viser de Trae-indbyggede værktøjer, som File system, Terminal, Web search, Preview.
o	Du kan klikke på værktøjerne for at få en kort beskrivelse af deres funktion.
3.	Context-knapper (#Context)
o	Ved at klikke på #Context kan du inkludere specifik kontekst i prompten:
	Code: Vælg en enkelt kodeblok fra en fil.
	File: Vedhæft hele indholdet af en fil.
	Folder: Vedhæft indholdet af en hel mappe (relevant, når man ønsker at AI'en skal forstå flere sammenhængende filer i en feature).
	Doc: Vedhæft et eksternt dokument, du tidligere har tilføjet i Context-fanen.
	Workspace: Vedhæft hele workspace-indekset for bred Q&A.
	Web: Søg efter og inkluder web-indhold (via Brave-search eller Web search).
o	Context sikrer, at AI har alt relevant information til hånds ved generering af svar.
4.	Billeder (Images)
o	Du kan klikke på Images for at vedhæfte skærmbilleder eller andre billeder, som AI’en kan analysere (fx UI-skærmbilleder, fejllogger).
o	Når billeder er vedhæftet, kan agenten bruge billedanalyse til at forstå visuel kontekst.
5.	Model-selektor (AI Model)
o	Nederst i chatboksen kan du vælge hvilken AI-model, du vil bruge til at generere svar:
	Typiske muligheder: Claude-4-Sonnet, GPT-4, GPT-3.5, afhængigt af din konfiguration.
o	Valg af model påvirker:
	🚀 Hastighed (hurtigere modeller kan være lidt mindre nøjagtige).
	🧠 Intelligens/Kompleksitet (mindre avancerede modeller kan være billigere, men mindre dybdegående).
6.	Prompt-input
o	Her skriver du selve din forespørgsel til agenten. Det kan være:
	Almindelige naturlige sprog-prompter (fx: “Opret en ny Next.js API-route, der henter data fra /api/products.”)
	Spørgsmål til Q&A (fx: “Hvordan integrerer jeg Prisma med Next.js i denne kodebase?”)
	Fejlretning (fx: “Der er en 404-fejl, når jeg loader UserProfile.tsx. Hvad mangler jeg?”)
o	Du kan til enhver tid klikke @ Agent for at se agentens rolle eller # Context for at vedhæfte relevant kontekst.
7.	Send-knappen
o	Når prompten er klar, klik på send-ikonet (🎯) for at afsende til agenten.
o	AI’en vil så processere input, bruge de valgte værktøjer og returnere:
	Tekstforklaringer i chatten
	Kodebidder i markdown-format
	Hvis nødvendigt, faktiske ændringer i kodefiler via filesystem-værktøjet.
Tip til brug:
•	Begynd en prompt med at specificere format (fx “Svar i en tabel, der viser ...” eller “Returner kun selve koden, ikke ekstra forklaring”).
•	Brug #Context strategisk: kun vedhæft de filer, der er strengt nødvendige, for at undgå unødvendig støj.
•	Vælg model afhængig af opgaven: brug en større model til komplekse problemstillinger og en hurtigere model til simple forespørgsler.
 
5. Rules-fanen (Kort omtale)
Formål:
•	Definer specifikke retningslinjer/regler, som alle agenter automatisk skal følge.
Hovedpunkter:
•	Du kan skrive Globale regler (fx “Ingen agent må ændre kode i production-branchen uden at bede om bekræftelse”).
•	Bruges til at sikre kodekvalitet, sikkerhed og ensartethed på tværs af alle agenter.
Tip:
•	Definer f.eks. lint-regler, commit-besked-stil, eller sikkerhedskrav her.
 
6. Models-fanen (Kort omtale)
Formål:
•	Vis og administrer de AI-modeller, som er tilgængelige i din Trae-opsætning.
Hovedpunkter:
•	Typiske modeller: Claude-4-Sonnet, GPT-4, GPT-3.5. Eventuelt private eller enterprise-modeller.
•	Du kan se version, konfiguration, og status (om modellen er tilgængelig) for hver.
Tip:
•	Hold øje med model-brug og omkostninger.
•	Skift model til at eksperimentere med forskelle i output og ydeevne.
 
Samlet Overblik og Workflow
1.	MCP-fanen: Tilføj og konfigurer avancerede værktøjer. Sørg for at alle nødvendige servers er kørende.
2.	Agents-fanen: Opret agenter med specifikke roller og tildel dem de værktøjer, de skal bruge.
3.	Context-fanen: Indekser din kodebase og tilføj eksterne dokumenter, så AI har adgang til al nødvendig viden.
4.	Rules-fanen (valgfri): Sæt globale regler for kodeændringer, commit-beskeder, eller sikkerhedskrav.
5.	Models-fanen (valgfri): Vælg og administrer AI-modeller baseret på krav til kompleksitet og omkostninger.
6.	Chat UI: Interager med dine agenter — send prompts, vedhæft kontekst, vælg model, og modtag svar.
Når hele opsætningen er på plads, kan du slippe AI-agenterne løs:
•	Bed dem om at generere komponenter, optimere kode, køre tests, opdatere dokumentation, eller debugge fejl—alt sammen med minimal manuel indsats.
God fornøjelse med at bygge dit full-stack AI-drevne udviklingsmiljø i Trae IDE!

