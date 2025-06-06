Her er en grundig trin-for-trin vejledning til funktionerne i Trae IDE, inklusiv begrænsninger:

**1. Generelle Indstillinger**

  * [cite\_start]**Adgang til Indstillinger**: Klik på profilikonet øverst til højre i Trae, og vælg derefter "IDE Settings" fra genvejsmenuen for at åbne indstillingsvinduet[cite: 1].
  * **Tilpasning**:
      * [cite\_start]**Generelt**: Konfigurer Trae efter behov i den generelle sektion[cite: 1].
      * [cite\_start]**Tema**: Skift IDE'ens tema[cite: 2].
      * [cite\_start]**Sprog**: Skift visningssproget for knaptekster og andre elementer[cite: 2].
      * [cite\_start]**Importer Konfiguration**: Importer indstillinger fra VSCode eller Cursor[cite: 3].
      * [cite\_start]**Editorindstillinger**: Klik på "Go to Settings" for at justere skrifttype, ordombrydning, vinduesindstillinger osv.[cite: 3].
      * [cite\_start]**Genvejsindstillinger**: Klik på "Go to Settings" for at tilpasse tastaturgenveje for forskellige handlinger[cite: 3, 4].
      * [cite\_start]**Kontoindstillinger**: Log ud af din konto[cite: 4].

**2. Agenter**

  * [cite\_start]**Formål**: Agenter er programmeringsassistenter designet til at automatisere opgaver[cite: 98]. [cite\_start]De kan udføre autonome operationer, har fuld adgang til værktøjer, forstår kontekst og kan bryde komplekse opgaver ned i flere trin[cite: 99].
  * **Indbyggede Agenter**:
      * [cite\_start]**Builder**: Hjælper med at udvikle kode og bruger forskellige værktøjer[cite: 102].
      * [cite\_start]**Builder with MCP**: Bygger på Builder og understøtter MCP-servere[cite: 103]. [cite\_start]Denne konfiguration er ikke redigerbar[cite: 103, 58].
  * **Opret Brugerdefinerede Agenter**:
    1.  [cite\_start]Klik på agentikonet øverst til højre i sidechatboksen for at få vist Agenter-vinduet[cite: 104, 105].
    2.  [cite\_start]Klik på "+ Create Agent"-knappen[cite: 105].
    3.  **Konfigurer Agenten**:
          * [cite\_start]**Avatar**: https://www.google.com/search?q=Valgfrit, upload en avatar til agenten[cite: 88, 109].
          * [cite\_start]**Navn**: Indtast agentens navn[cite: 88, 109].
          * [cite\_start]**Prompt**: https://www.google.com/search?q=Valgfrit, konfigurer en prompt for agenten (f.eks. "Du er en webtestekspert...")[cite: 88, 89, 106, 109].
          * [cite\_start]**Tools - MCP**: Marker de ønskede MCP-servere (f.eks. Playwright)[cite: 89, 110].
          * [cite\_start]**Tools - Built-In**: Vælg indbyggede værktøjer som File System (oprette, læse, opdatere, tilføje/slette filer), Terminal (køre kommandoer) og Web Search (søge webindhold)[cite: 90, 108, 110].
    4.  [cite\_start]Klik på "Create"-knappen[cite: 91].
  * [cite\_start]**Brug Agenter**: I inputboksen skal du skrive "@" eller klikke på "@Agent"[cite: 110].
  * [cite\_start]**Administrer Agenter**: Du kan redigere, dele eller slette brugerdefinerede agenter fra listen[cite: 110, 111, 112].
  * [cite\_start]**Importer Agenter**: Klik på et delt link og følg vejledningen for at importere agenter i Trae IDE[cite: 113, 114, 115].
  * [cite\_start]**Aktiver "Auto-Run"**: Denne funktion gælder for alle agenter[cite: 83, 115]. [cite\_start]Når den er aktiveret, vil agenten automatisk udføre kommandoer[cite: 83, 116].
      * [cite\_start]**Risici**: Aktivering af "Auto-Run" kan udgøre sikkerhedsrisici; gennemgå risiciene omhyggeligt[cite: 116].
      * [cite\_start]**Konfiguration**: Find "Auto-Run" sektionen i Agenter-fanen og slå funktionen til[cite: 85].
  * **Arbejdsflow for Agenter**:
    1.  [cite\_start]**Kravsanalyse**: Forstå brugerens krav[cite: 100].
    2.  [cite\_start]**Kodesøgning**: Gennemsøg kodebasen[cite: 100].
    3.  [cite\_start]**Løsningsdesign**: Nedbryd opgaven i trin[cite: 101].
    4.  [cite\_start]**Implementering af Ændringer**: Udfør nødvendige ændringer (anbefalinger til afhængigheder, terminalkommandoer, manuel vejledning)[cite: 101].
    5.  [cite\_start]**Levering og Accept**: Overfør kontrol til brugeren til accept af ændringer[cite: 101].
  * **Flere Funktioner**:
      * [cite\_start]**Brug Brugerdefinerede Modeller**: Trae understøtter tilføjelse af brugerdefinerede modeller[cite: 117].
      * [cite\_start]**Tilføj Kontekst**: Agenter kan forstå kontekst for mere nøjagtige svar[cite: 118].
      * [cite\_start]**Input Multimodalt Indhold**: Tilføj billeder i chatten (f.eks. fejlskærmbilleder)[cite: 118].
      * [cite\_start]**Generer og Håndter Kodeændringer**: Agenter genererer automatisk kodeændringer, som du kan forhåndsvise, acceptere eller afvise[cite: 118, 119, 120, 121].
      * [cite\_start]**Generer og Kør Kommandoer**: Agenter anbefaler kommandoer, som du kan vælge at køre eller springe over[cite: 121, 122]. [cite\_start]Hvis kommandoen kører, analyserer agenten resultatet og giver forslag[cite: 123].
      * [cite\_start]**Forhåndsvis Resultat**: Agenten viser resultatet i et forhåndsvisningsvindue[cite: 124].
      * **Gendan til Tidligere Versioner**: Gendan projektet til en tidligere version. [cite\_start]Dette kan ikke fortrydes og understøtter kun gendannelse til en version før den aktuelle session[cite: 126, 127].

**3. Automatiseret Webtest (med Playwright og MCP)**

  * [cite\_start]**Formål**: Effektiv integration af automatiseret webtestning ved hjælp af Playwright for at validere websideinteraktioner[cite: 64].
  * **Systemmiljø**:
      * [cite\_start]Trae IDE version: 1.3.5 [cite: 67]
      * [cite\_start]macOS version: 14.7 [cite: 67]
      * [cite\_start]Node.js version: 20.19.1 [cite: 67]
      * [cite\_start]npx version: 10.9.2 [cite: 67]
      * [cite\_start]Python version: 3.13.3 [cite: 67]
      * [cite\_start]uvx version: 0.6.16 [cite: 67]
  * **Procedure**:
    1.  [cite\_start]**Installer Trae IDE**: Download fra Traes officielle hjemmeside[cite: 68, 69].
    2.  **Konfigurer Runtime Miljøet**:
          * [cite\_start]Åbn Terminal i Trae IDE (Terminal \> New Terminal)[cite: 69].
          * **Installer Python og uvx**:
              * [cite\_start]Download Python fra den officielle hjemmeside og kør installationskommandoen `python3 --version` for at bekræfte installationen[cite: 70, 71].
              * [cite\_start]Installer uvx (macOS/Linux: `curl -LsSf https://astral.:`, Windows: `powershell ExecutionPolicy`)[cite: 71, 72].
              * [cite\_start]Kør `uvx --version` for at bekræfte installationen[cite: 73].
          * **Installer Node.js og npx**:
              * [cite\_start]Download Node.js fra den officielle hjemmeside[cite: 73].
              * [cite\_start]Kør `node -v` og `npx -v` for at bekræfte installationen[cite: 74].
              * [cite\_start]Genstart Trae IDE for at aktivere Node.js[cite: 75].
    3.  **Installer Playwright**:
          * [cite\_start]Kør `pip3 install playwright` for at installere playwright-modulet[cite: 75, 77].
          * [cite\_start]Kør `python3 -m playwright install` for at downloade browsere (Chromium/Firefox/WebKit)[cite: 77, 78].
    4.  **Tilføj MCP-server - Playwright**:
          * Åbn Trae IDE.
          * [cite\_start]Klik på MCP-ikonet øverst til højre i AI-chatboksen[cite: 78, 79].
          * [cite\_start]Klik på "+ Add MCP Server"-knappen i MCP-fanen[cite: 79].
          * [cite\_start]Søg efter "Playwright" på MCP-servermarkedspladsen[cite: 80].
          * [cite\_start]Klik på "introduction page" for at se konfigurationen[cite: 81].
          * [cite\_start]Kopier konfigurationsindholdet og indsæt det i inputboksen[cite: 81].
          * [cite\_start]Klik på "Confirm"-knappen[cite: 82].
    5.  [cite\_start]**Aktiver "Auto-run" for agenter**: Følg trinene beskrevet under "Agenter" ovenfor for at aktivere denne funktion[cite: 83, 85].
    6.  [cite\_start]**Opret en agent og tilføj Playwright MCP-serveren**: Følg trinene beskrevet under "Agenter" ovenfor for at oprette en agent og vælge Playwright som et MCP-værktøj[cite: 86, 87, 88, 89, 90, 91].
    7.  **Chat med agenten for at udføre test**:
          * [cite\_start]Opret en ny mappe lokalt og åbn den i Trae IDE[cite: 92].
          * [cite\_start]Vælg den ønskede model[cite: 92].
          * [cite\_start]Indsæt URL'en for den side, der skal testes[cite: 93].
          * [cite\_start]Indtast testinstruktioner (f.eks. "tag et skærmbillede", "åbn siden og klik på hyperlinket") og send dem[cite: 94].

**4. Kodebase-indeksering**

  * [cite\_start]**Formål**: Trae AI kan opbygge et kodeindeks for projektet for at give mere nøjagtige svar ved at give AI-assistenten projektkontekst[cite: 129].
  * [cite\_start]**Begrænsninger**: Hvis kodeindekset ikke er bygget eller er ufuldstændigt, kan det føre til ufuldstændig kontekstgenkaldelse og dermed unøjagtige svar[cite: 129].
  * [cite\_start]**Vigtige Bemærkninger**: Du kan beslutte, hvilke filer der skal ekskluderes fra indeksering (ignorerede elementer bruges aldrig af AI)[cite: 129].
  * [cite\_start]**Relaterede Handlinge**: Få adgang til indstillinger for kodeindeksering ved at klikke på tandhjulsikonet øverst til højre i sidechatboksen og navigere til "Code Index Management"-sektionen[cite: 129].
      * [cite\_start]**Start Bygning**: Begynd at bygge indekset[cite: 130].
      * [cite\_start]**Annuller Bygning**: Annuller byggeprocessen, hvis der opstår undtagelser[cite: 130].
      * [cite\_start]**Genopbyg**: Genopbyg kodeindekset[cite: 131].
      * [cite\_start]**Ryd Indeks**: Ryd kodeindekset[cite: 131].

**5. Regler**

  * [cite\_start]**Formål**: Indstil regler for at regulere AI'ens adfærd og gøre dens output mere i overensstemmelse med dine præferencer[cite: 5, 6].
  * **Regeltyper**:
      * [cite\_start]**Brugerregler**: Dine personlige præferenceregler, der gælder på tværs af alle projekter[cite: 6, 9]. [cite\_start]Eksempler: sprogstil, operativsystem, indholdsstil, interaktionsmetode[cite: 6].
      * [cite\_start]**Projektregler**: Retningslinjer AI'en skal følge i et specifikt projekt[cite: 6, 9, 13]. [cite\_start]Eksempler: kodestil, sprog og frameworks, API-restriktioner[cite: 6].
  * **Opret Brugerregler**:
    1.  [cite\_start]Klik på tandhjulsikonet øverst til højre i sidechatboksen[cite: 7].
    2.  [cite\_start]I "User Rules"-sektionen skal du klikke på "+ Create Rule"-knappen[cite: 8]. [cite\_start]Dette opretter automatisk filen `user_rules.md`[cite: 8].
    3.  [cite\_start]Skriv reglerne i `user_rules.md`-filen[cite: 8].
    4.  Gem dine indstillinger. [cite\_start]Reglerne anvendes på AI på tværs af alle projekter[cite: 9].
  * **Opret Projektregler**:
    1.  [cite\_start]Åbn et projekt[cite: 9].
    2.  [cite\_start]Klik på tandhjulsikonet øverst til højre i sidechatboksen[cite: 10].
    3.  [cite\_start]I "Project Rules"-sektionen skal du klikke på "+ Create Rule"-knappen[cite: 11]. [cite\_start]Dette opretter automatisk filen `project_rules.md` i mappen `.trae/rules` i det åbne projekt[cite: 11, 12].
    4.  Gem dine indstillinger. [cite\_start]Reglerne anvendes på AI i dette projekt[cite: 13].
  * **Administrer Regler**: Du kan redigere bruger- og projektregler i Regler-vinduet. [cite\_start]Sletning af en regelfil vil ugyldiggøre alle tidligere definerede regler[cite: 14].

**6. Kontekst (\#-symboler)**

  * [cite\_start]**Formål**: Du kan tilføje forskellige kilder til relevant kontekst ved at bruge "\#"-symbolet i inputboksen i sidechatten[cite: 15, 16].
  * **Typer af Kontekst**:
      * [cite\_start]**\#Code**: Tilføj relevant koderelateret indhold (funktioner og klasser) for at hjælpe AI-assistenten[cite: 16].
          * [cite\_start]**Begrænsning**: Kræver en tilsvarende Language Service installeret[cite: 17, 18].
          * [cite\_start]**Brug**: Skriv "\#Code" og vælg eller søg efter ønsket funktion/klasse[cite: 18, 19].
      * [cite\_start]**\#File**: Indstil alt indhold fra en fil som kontekst[cite: 20].
          * [cite\_start]**Brug**: Skriv "\#File" og vælg eller søg efter ønsket fil[cite: 21, 22, 23].
      * **\#Folder**: Indstil alt indhold fra en mappe som kontekst.
          * [cite\_start]**Begrænsning**: Kræver, at kodeindekset er bygget, ellers kan det påvirke hentningen af indhold fra mapper[cite: 25].
          * [cite\_start]**Brug**: Skriv "\#Folder" og vælg eller søg efter ønsket mappe[cite: 26, 27, 28].
      * [cite\_start]**\#Workspace**: Bed AI-assistenten om at søge efter det mest relevante indhold i hele arbejdsområdet[cite: 28, 29].
          * [cite\_start]**Begrænsning**: Kræver, at kodeindekset er bygget, ellers kan det påvirke hentningen af indhold[cite: 28].
          * [cite\_start]**Brug**: Skriv "\#Workspace" og vælg "Workspace" fra listen[cite: 29, 30].
      * [cite\_start]**\#Doc**: Upload personlige dokumenter for at bruge deres indhold til at opfylde behov mere nøjagtigt[cite: 30, 31].
          * [cite\_start]**Proces**: Trae bygger et indeks over dokumentdata, der overføres til Traes servere til vektorisering og derefter returneres og lagres på brugerens enhed[cite: 31].
          * [cite\_start]**Brug**: Klik på kontekstikonet øverst til højre i sidechatboksen[cite: 32]. [cite\_start]I "Docs"-sektionen klikker du på "+ Add Docs" og tilføjer dokumenter via URL eller lokale filer[cite: 33, 36].
          * [cite\_start]**Begrænsning (URL)**: Trae IDE vil overholde `/robots.txt` og understøtter kun visning af offentligt tilgængelige websteder[cite: 38].
          * [cite\_start]**Brug**: Referer til dokumenterne ved at skrive "\#Doc: [dokumentnavn]" i inputboksen[cite: 39, 40].
      * [cite\_start]**\#Web**: Brug indhold fra online websteder[cite: 40]. (Yderligere detaljer er ikke specificeret i de vedhæftede dokumenter).

**7. Model Context Protocol (MCP)**

  * [cite\_start]**Hvad er MCP?**: En protokol, der gør det muligt for AI-modeller at forbinde sig med og bruge eksterne værktøjer og tjenester[cite: 43]. [cite\_start]Agenter i Trae fungerer som MCP-klienter[cite: 44].
  * **Disclaimer**: MCP-servere er bygget og vedligeholdt af tredjeparter. [cite\_start]Trae er ikke ansvarlig for deres adfærd, fejl eller tab[cite: 45].
  * **Opsætning af Systemmiljø**:
      * [cite\_start]**npx**: Kræver Node.js version 18 eller højere[cite: 45, 47].
      * [cite\_start]**uvx**: Et hurtigt eksekveringsværktøj baseret på Python[cite: 45, 47].
      * [cite\_start]**(https://www.google.com/search?q=Valgfrit) Docker**: Containeriseringsplatform, der kræves for at bruge GitHub MCP-server[cite: 45, 48].
  * **Konfigurer MCP-servere**:
      * **Metode 1: Tilføj fra markedspladsen**:
        1.  [cite\_start]Klik på MCP-ikonet øverst til højre i sidechatboksen[cite: 51].
        2.  [cite\_start]Klik på "+ Add MCP Servers"-knappen[cite: 52].
        3.  [cite\_start]Find den ønskede MCP-server fra listen[cite: 53].
        4.  [cite\_start]Indstil MCP-serveren (f.eks. indsæt JSON-konfiguration)[cite: 53].
        5.  [cite\_start]Klik på "Confirm"-knappen[cite: 54].
      * **Metode 2: Konfigurer manuelt**:
        1.  [cite\_start]Klik på MCP-ikonet øverst til højre i sidechatboksen[cite: 53].
        2.  [cite\_start]Klik på "+ Add MCP Servers"-knappen[cite: 54].
        3.  [cite\_start]Klik på "Configure Manually"[cite: 55].
        4.  [cite\_start]Konfigurer MCP-serveren manuelt[cite: 56].
        5.  [cite\_start](https://www.google.com/search?q=Valgfrit) Hvis du har konfigureret MCP-servere, kan du klikke på "Raw Config (JSON)"-knappen og indsætte indholdet[cite: 57, 58].
  * **Brug MCP-servere i agenter**:
      * [cite\_start]**Indbygget agent: Builder with MCP**: Dette er en indbygget agent, hvor MCP er forudkonfigureret og ikke kan redigeres[cite: 58, 59].
      * **Brugerdefinerede agenter**: Du kan tilføje MCP-servere til brugerdefinerede agenter. [cite\_start]Når du opretter en agent, skal du henvise til "Agent"-dokumentationen[cite: 60].
  * [cite\_start]**Administrer MCP-servere**: Du kan redigere eller slette MCP-servere[cite: 61].