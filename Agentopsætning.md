## Oversigt

Trae IDE er en moderne, AI-drevet kodeeditor, der ligner andre avancerede IDE’er som Cursor og Windsurf, men med et stærkt fokus på “Agent”-arkitektur og integration af Model Context Protocol (MCP). Med Trae kan du oprette specialiserede agenter direkte i GUI’en, definere skræddersyede regler (“Rules”) og vælge præcise værktøjer (“Tools”), så dine agenter automatisk varetager gentagne opgaver, adresserer komplekse workflows og samarbejder med eksterne systemer i realtid. Nedenfor følger en detaljeret gennemgang af, hvordan Trae IDE fungerer, herunder installation, agent-oprettelse, brug af Rules og Tools, Builder Mode, MCP-integration, samt andre nøglefunktioner.

---

## Hvad er Trae IDE?

### AI-drevet kodeeditor og platform

* **AI-assisteret kodning**: Trae er en adaptive, AI-drevet Integrated Development Environment (IDE), der tilbyder intelligent kodekomplettering, realtidsassistance og en indbygget chatgrænseflade, hvor du kan stille spørgsmål til din kode og få eksempler og forklaringer ([kdnuggets.com][1]).
* **Bygger oven på VS Code**: Under motorhjelmen er Trae baseret på Visual Studio Code, hvilket betyder, at alle VS Code-udvidelser som Playwright, Git, og sprogservere fungerer natively i Trae ([medium.com][2]).
* **Platformunderstøttelse**: Trae IDE kan installeres på Windows, macOS og Linux, og kræver kun minimal hardware (en moderne CPU og ca. 4 GB RAM) for at køre flydende ([puppyagent.com][3]).

### Chat- og Webview-integration

* **Trae Chat**: Inde i IDE’en findes et sidepanel med en chatgrænseflade, hvor du direkte kan interagere med en AI-assistent. Her kan du indsætte fejlbeskeder eller kodeudsnit, som Trae’s AI dækker og hjælper med at rette ([kdnuggets.com][1]).
* **Add to Chat**: Du kan markere hvilken som helst tekst, log eller fejl i editoren og vælge “Add to Chat” for at få kontekstbaseret hjælp fra AI’en uden at skifte kontekst ([kdnuggets.com][1]).
* **Webview**: Når du kører webapplikationer fra terminalen (fx en lokal React-app), tilbyder Trae Webview en indbygget præview, så du kan se ændringer direkte i IDE’en, uden at du behøver at skifte til browser ([kdnuggets.com][1]).

---

## Agent-funktionalitet i Trae

### Oprettelse af Agent via GUI

* **Adgang til Agent-indstillinger**: For at oprette en ny agent, klikker du på tandhjulsikonet i side-chatboksen og vælger “Agents” ([docs.trae.ai][4]).
* **“+ Create Agent”**: I det lille popup-vindue, der dukker op, kan du klikke “+ Create Agent” direkte i chat-inputfeltet og give agenten et navn og en kort beskrivelse ([docs.trae.ai][4]).
* **Ingen manuel JSON-redigering**: Alt foregår i GUI’en – Trae gemmer agent-konfigurationerne i sin egen interne database, så du behøver ikke oprette eller redigere nogen skjulte `.trae`-filer manuelt ([docs.trae.ai][4]).

### Definering af “Prompt” og “Rules”

* **Prompt-feltet**: Når du har givet agenten et navn og en beskrivelse, findes der et tekstfelt kaldet “Prompt”, hvor du kan skrive en fuld testinstruks. Her indtaster du, hvad agenten skal gøre, hvilke retningslinjer den skal følge, og hvordan den skal opføre sig i forskellige scenarier ([trae.ai][5]).
* **Project Rules**: Under fanen “Project Rules” kan du tilføje regler, der gælder for alle brugere af agenten i det pågældende projekt, fx:

  * “Skriv altid kode i separate commits med beskrivende commit-beskeder.”
  * “Overhold givet kodestandard (f.eks. PEP8 eller Google Style Guide).”
  * “Ingen destruktive handlinger (sletning af filer) uden eksplicit godkendelse fra brugeren.” ([trae.ai][5]).
* **User Rules**: Under “User Rules” kan individuelle brugere definere personlige præferencer, der kun gælder, når netop de arbejder med agenten, fx:

  * “Forklar svaret i korte, punktformede afsnit.”
  * “Når du kalder et værktøj, beskriv både input-argumenter og forventet output.”
  * “Hold svar på under 300 ord medmindre andet er eksplicit påkrævet.” ([trae.ai][5]).
* **Sammenspil mellem Rules og Prompt**: Project Rules har prioritet over User Rules, så hvis der er en konflikt (f.eks. hvis Project Rules kræver PEP8, men User Rules ønsker en anden formattering), vil Project Rules vinde ([trae.ai][5]).

### Selektion af “Tools”

* **Tilgængelige Tools**: I agent-konfigurationen kan du vælge fra en række indbyggede “Tools”, inklusive:

  * **File System**: Læse/skrive lokale filer direkte fra agenten.
  * **Git Integration**: Commit, push og hent ændringer fra Git-repositoriet.
  * **Python Sandbox**: Køre isolerede Python-scripts direkte i Trae til hurtigt at teste kodeeksempler.
  * **Vector Search**: Udføre semantisk søgning mod en lokal eller ekstern vektordatabank (f.eks. ChromaDB).
  * **MCP**: Foretage JSON-RPC-kald til din Model Context Protocol-server for at hente eller ændre eksterne data. ([trae.ai][5]).
* **Intuitiv GUI-opsætning**: Alt opsættes via dropdown-menuer; du markerer blot de Tools, du ønsker, og Trae tilføjer automatisk de nødvendige konfigurationer i agentens bagende ([trae.ai][5]).
* **Dynamisk Tool-koordination**: Når en agent får en opgave, vælger den automatisk, hvilke Tools der skal bruges, baseret på reglerne og prompt-indholdet, hvilket giver en flow, der minder om en multi-agent-arkitektur, uden at du skal skrive eller vedligeholde manuel orkestreringskode ([trae.ai][5]).

---

## Trae Builder Mode og Centrale Funktioner

### Builder Mode

* **Automatiseret kodeworkflow**: Trae Builder er en specialfunktion, hvor IDE’en automatisk bryder komplekse opgaver ned i trin, genererer kodeændringer på tværs af flere filer, kører tests og viser dig et preview, før ændringerne faktisk anvendes ([kdnuggets.com][1]).
* **Eksempel**: Hvis du beder Trae om at “tilføje CRUD‐funktionalitet til en Express.js-API”, vil Builder Mode:

  1. Generere en mappestruktur med routes, controllers og modeller.
  2. Oprette grundlæggende testfiler.
  3. Køre unit tests for at validere layoutet.
  4. Sammenflette ændringer i din Git-gren, efter du har godkendt previewet ([kdnuggets.com][1]).

### Trae Webview

* **Indbygget preview**: Når du starter en lokal webserver (fx `npm run dev` i en Next.js-app), tilbyder Trae at åbne en “Webview” inde i selve IDE’en, så du kan interagere med din kørende applikation og redigere koden simultant ([kdnuggets.com][1]).
* **To-vejs synkronisering**: Ændringer du foretager i koden opdateres øjeblikkeligt i Webview, og interaktionen i Webview kan bruges til at generere nye spørgsmål til AI-assistenten (fx “Hvorfor crasher komponent X?”) ([kdnuggets.com][1]).

### MCP-integration og Agentsamarbejde

* **Model Context Protocol (MCP)**: Trae har indbygget understøttelse af MCP, som er en standard (JSON‐RPC 2.0) for, hvordan AI-agenter kan kommunikere med eksterne værktøjer, databaser og API’er ([trae.ai][5]).
* **Agent-first-arkitektur**: I stedet for at lade brugeren håndtere MCP-kald manuelt, indkapsler hver agent både sin prompt, sit sæt regler og de nødvendige MCP-kald, så du blot kan beordre agenten til at “Hent realtidsdata fra CRM” eller “Kør en SQL-forespørgsel mod databasen” uden at kende de underliggende MCP-detaljer ([trae.ai][5]).
* **Sømløs værktøjsudvælgelse**: Når du anmoder om en handling, finder agenten automatisk ud af, om den skal bruge indbyggede VS Code-værktøjer, Python Sandbox, Vector Search eller MCP, uden at du som bruger behøver skifte mellem forskellige interfaces ([trae.ai][5]).

---

## Installation og Opsætning

### Download og installation

* **Trae’s officielle hjemmeside**: Besøg [https://docs.trae.ai/ide/download](https://docs.trae.ai/ide/download) for at hente installationsprogrammet til din platform (Windows, macOS eller Linux) ([puppyagent.com][3]).
* **Minimale systemkrav**: En moderne CPU, 4 GB RAM og 2 GB ledig diskplads anbefales. Efter installation starter du IDE’en via skrivebordsikonet eller kommandolinjen `trae` ([puppyagent.com][3]).

### Initial konfiguration

* **Log ind**: Ved første opstart beder Trae dig om at logge ind med en Trae-konto (eller via OAuth med GitHub/Google), så dine agenter, indstillinger og licenser kan synkroniseres med skyen ([puppyagent.com][3]).
* **Vælg sprog og ramme**: Trae registrerer automatisk det sprog (f.eks. Python, JavaScript, Go) som dit projekt bruger, og foreslår relevante plugin-udvidelser (f.eks. ESLint, Prettier, Black) ([kdnuggets.com][1]).
* **Installer nødvendige moduler**: Den første gang du anvender Python Sandbox eller Vector Search, installerer Trae automatisk Python-pakker som `openai`, `chromadb` og `pytest` bag kulisserne ([kdnuggets.com][1]).

---

## Opsætning af en Custom Agent trin for trin

1. **Åbn Agents-menuen**

   * Klik på tandhjulsikonet i side-chatboksen og vælg “Agents” ([docs.trae.ai][4]).
2. **Opret ny agent**

   * Klik “+ Create Agent” og indtast “Enterprise-RAG-MCP” som navn. Tilføj en kort beskrivelse, fx “Agent til enterprise-niveau RAG/MCP-opsætning” ([docs.trae.ai][4]).
3. **Indsæt prompt**

   * I “Prompt”-feltet skriver du en kortfattet, men præcis instruktion, fx:

     ```
     Du er Enterprise-RAG-MCP-Agent. Følg følgende processer: 
     1. Gennemgå RAG- og MCP-kode, ret batching, caching, autentificering. 
     2. Containeriser, deploy til GCP, opsæt monitoring. 
     Dokumentér alt i chatten.
     ```
   * Formatér prompten i klare bullet points eller nummererede trin, så agenten forstår rækkefølgen ([trae.ai][5]).
4. **Definér Project Rules**

   * Klik på “Project Rules”-fanen og tilføj fx:

     * “Alle kodeændringer skal pushes til Git med descriptive commit-beskeder.”
     * “Overhold PEP8 for Python og ESLint for JavaScript.”
     * “Ingen destructive handlinger uden brugerens eksplicitte godkendelse.” ([trae.ai][5]).
5. **Definér User Rules**

   * Klik på “User Rules”-fanen og tilføj fx:

     * “Informer altid i korte punkter, hvad du vil gøre næste gang.”
     * “Kald kun MCP-værktøjet, når det er nødvendigt (sæt parametre korrekt).”
     * “Hold svar under 300 ord, medmindre andet er aftalt.” ([trae.ai][5]).
6. **Vælg Tools**

   * Under “Tools”-fanen markerer du: Filesystem, Git Integration, Python Sandbox, Vector Search, og MCP ([trae.ai][5]).
   * Klik “Save” for at bekræfte agenten.

Når dette er gjort, vil din agent dukke op på listen over tilgængelige agenter i Trae. Du kan nu aktivere den og begynde at stille den spørgsmål eller give den kommandoer i chatten, som den vil eksekvere ved hjælp af de valgte regler og værktøjer.

---

## Opsummering

Trae IDE adskiller sig fra almindelige kodeeditorer ved at integrere:

1. **Agent-arkitektur i GUI’en**: Opret, konfigurer og administrer agenter uden at redigere skjulte JSON-filer. ([docs.trae.ai][4], [trae.ai][5])
2. **Fleksible Rules**: Project Rules og User Rules til at styre agentens adfærd på tværs af projekter og brugere. ([trae.ai][5])
3. **Rige Tools**: Indbygget støtte til filsystem, Git, Python Sandbox, semantisk Vector Search og MCP-integrationspunkter. ([trae.ai][5])
4. **Builder Mode**: En avanceret AI-baseret workflow-motor, der automatiserer større kodeændringer, previews og tests. ([kdnuggets.com][1])
5. **MCP-integration**: Understøttelse af Model Context Protocol, så agenter kan foretage JSON-RPC-kald til eksterne API’er og databaser uden manuelt at orkestrere protokollen. ([trae.ai][5])

Når du følger ovenstående trin, vil du kunne udnytte Trae’s fulde potentiale til at oprette en intelligent, enterprise-klar RAG/MCP-agent.

[1]: https://www.kdnuggets.com/trae-adaptive-ai-code-editor?utm_source=chatgpt.com "Trae: Adaptive AI Code Editor - KDnuggets"
[2]: https://medium.com/%40totidev/ios-development-with-trae-bc35f3f50a7c?utm_source=chatgpt.com "iOS development with Trae - Medium"
[3]: https://www.puppyagent.com/blog/Step-by-Step-Guide-to-Using-Trae-AI-IDE-Efficiently?utm_source=chatgpt.com "Step-by-Step Guide to Using Trae AI IDE Efficiently | PuppyAgent"
[4]: https://docs.trae.ai/ide/agent?utm_source=chatgpt.com "Agent - Documentation - What is Trae IDE?"
[5]: https://www.trae.ai/blog/product_thought_0428?utm_source=chatgpt.com "Rules + Tools to Define Your Future Agents - Trae"
