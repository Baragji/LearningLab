**Sammendrag**
Denne guide fører dig trin-for-trin gennem processen med at bygge den ultimative Trae-agent, der kan konkurrere med – og endda overstige – Cursor’s AI-assistenter. Vi gennemgår først forskellene mellem Trae og Cursor, så vi forstår de vigtigste styrker ved Cursor’s agentarkitektur. Dernæst præsenteres en komplet plan for at opsætte alle nødvendige komponenter i Trae: fra MCP-servers til en automatiseret RAG-pipeline, persistent hukommelse, modulær promptarkitektur og indlejret dokumentationsopslag. Vi diskuterer også valg af gratis/hostede cloud-løsninger til vector-database, samt hvordan du sikrer en sømløs brugeroplevelse og governance. Til sidst samler vi det hele i et klart workflow, så du kan implementere alle elementer trin for trin i Trae IDE og nå Cursor-niveauet.

---

## 1. Forstå forskellene: Trae vs. Cursor

### 1.1 Cursor’s nøglefunktioner og community-forventninger

1. **Sømløs RAG-integration**

   * Cursor bruger en intern vektordatabase (ofte OpenAI-embeddings) til at hente præcist de kodebidder, der matcher en prompt, uden manuel opsætning eller suboptimal indsats ([Builder.io][1], [Cursor][2]).
   * Community’et fremhæver, at Cursor automatisk genindekserer bag kulisserne ved hver commit, så oplysninger er opdaterede ([Builder.io][1], [Cursor][2]).

2. **Persistent hukommelse & samtalehistorik**

   * Cursor bevarer chat-historikken på tværs af sessioner, samtidig med at den automatisk opsummerer ældre beskeder for at optimere token-forbrug ([Cursor][2], [DEV Community][3]).
   * Brugere kan f.eks. lukke editoren og få præcis den samme kontekst tilbage næste gang.

3. **Modulær promptarkitektur & prompt chaining**

   * I Cursor er store drejebøger opdelt i små, genanvendelige prompt-templates (bugfix, test, feature), og AI’en arbejder gennem flere trin (intent-detect, template-udfyldning, validering) ([Cursor][2], [DEV Community][3]).

4. **Inline assistance (Code Lenses, live preview)**

   * Når Cursor registrerer, at du står i en funktion, kan den vise “Code Lenses” direkte i editoren med forslag til tests, refaktorering, og dokumentation, uden at man skal åbne chatten ([cursor.com][4], [DEV Community][3]).
   * Cursor’s “live preview” i en indlejret iframe opdateres straks ved code changes, så du ser effekten af UI-ændringer uden manuel genstart.

5. **Sikkerhed, governance og rollback**

   * Cursor præsenterer altid AI-genererede ændringer som diffs i en “suggestion-mode”, hvor du kan godkende eller afvise hver enkelt blok, og hver commit har standardiseret beskedformatering for audit-log ([Cursor][2], [DEV Community][3]).

### 1.2 Trae’s nuværende kapaciteter

* **Gratis og open source**: Trae IDE er tilgængelig uden licensomkostninger, mens Cursor er en betalt løsning ([Builder.io][1]).
* **Under udvikling**: Trae har robuste indbyggede værktøjer (filesystem, terminal, web search, preview) og understøtter MCP-servers til udvidet funktionalitet ([docs.trae.ai][5], [docs.trae.ai][6]).
* **Mangler out-of-the-box RAG** og persistent hukommelse i samme grad som Cursor, men enhver ønsket funktion kan skabes ved at bygge egne MCP-servers.

---

## 2. Overblik over nødvendige komponenter

For at gøre Trae-agenten komplet, bør følgende elementer udvikles eller konfigureres:

1. **MCP-servers** til:

   * **RAG (Retrieval-Augmented Generation)** via en lokal/hostet vector-database (f.eks. ChromaDB).
   * **Persistent memory** (chat-historik & preferences) via en hukommelsesserver (f.eks. Flask).
   * **Dokumentationsopslag** (“Doc Lookup”) som fallback, hvis lokal indeks mislykkes.

2. **Automatiseret RAG-pipeline**

   * Indekseringsscript, der genererer embeddings for kodechunks og gemmer dem i ChromaDB.
   * Automatiseret genindeksering (Git-hooks eller filwatches) ved hver commit for at holde data up-to-date ([datacamp.com][7], [Medium][8]).

3. **Modulær promptarkitektur + prompt chaining**

   * Et bibliotek af prompt-templates (bugfix, unit-test, feature), evt. i en mappe `templates/`.
   * Intent-detektion i memory-serveren, der vælger den korrekte template afhængigt af brugerens prompt ([Cursor][2], [NVIDIA Blog][9]).

4. **Persistent hukommelsesserver**

   * Gemmer historik i en database (SQLite, JSON, eller Redis, afhængigt af skaleringsbehov).
   * Understøtter summarization for at trimme ældre indhold og sikre relevant kontekst for nye prompts ([NVIDIA Blog][9], [harendra21.substack.com][10]).

5. **Bedre dokumentationsintegration (Context)**

   * Indekser offcielle guides (Next.js, Tailwind, NestJS, Prisma) i Context-fanen.
   * Implementér et fallback, hvor agenten kan foretage et `Web search` via Brave hvis indeksering fejler ([Builder.io][1], [Reddit][11]).

6. **UI/UX-forbedringer**

   * Simuler Code Lenses i Trae ved at skabe et MCP-endpoint, der returnerer UI-handlinger baseret på markøren (filsti, linjenummer).
   * Aktiver automatisk live preview ved at køre frontend-server i watch-mode, så ændringer reflekteres med det samme ([cursor.com][4], [YouTube][12]).

7. **Sikkerhed, governance & rollback**

   * Generer diffs før skriveoperationer, og vis dem i chatvinduet (via `Terminal`-tool) for brugergodkendelse.
   * Tildel altid AI-commits en standardiseret beskedform ( fx `AI: refactor(<scope>): <kort besked>` ) ([Cursor][2], [DEV Community][3]).

8. **Cloud-hosting for vector-database**

   * Undersøg gratis/low-cost muligheder, fx ChromaDB i et gratis Docker-containerhost (Replit, Heroku Free, Railway Free Tier) eller Pinecone/Weaviate gratis-planer ([Medium][13], [Chroma][14]).

---

## 3. Trin-for-trin: Opsætning af MCP-servers

I dette afsnit beskrives, hvordan du bygger og konfigurerer de nødvendige MCP-servers.

### 3.1 RAG-server med ChromaDB

1. **Installer ChromaDB & embeddings**

   * Sørg for, at Python 3.8+ er installeret ([datacamp.com][7]).
   * Installer pip-pakker:

     ```bash
     pip install chromadb sentence-transformers
     ```

     ([datacamp.com][7]).

2. **Skriv et indeks-script** (`scripts/index_code_chunks.py`)

   * Gennemgå projektets filer, split i chunks (fx 500 tokens).
   * Generer embedding for hver chunk med `sentence-transformers` ([datacamp.com][7]).
   * Gem embeddings og metadata (filsti, start-/slutlinje) i ChromaDB via Python SDK ([Chroma][14]).

3. **Opret en Flask-baseret RAG-MCP-server** (`vector_search_server.py`)

   ```python
   from flask import Flask, request, jsonify
   from chromadb import Client
   from sentence_transformers import SentenceTransformer

   app = Flask(__name__)
   client = Client()
   collection = client.get_or_create_collection(name="code_chunks")
   model = SentenceTransformer('all-MiniLM-L6-v2')

   @app.route('/search', methods=['POST'])
   def search():
       query = request.json['query']
       q_embedding = model.encode(query).tolist()
       results = collection.query(query_embeddings=[q_embedding], n_results=10)
       # Optional: implement rank based on recency, imports og kontekst
       # ranked_results = rank_chunks(results, request.json['filepath'])
       return jsonify(results['documents'])

   if __name__ == '__main__':
       app.run(port=5004)
   ```

   ([datacamp.com][7], [Chroma][14]).

4. **Test alt lokalt**

   * Kør `python3 scripts/index_code_chunks.py`, efterfulgt af `python3 vector_search_server.py`.
   * Send et eksempel:

     ```bash
     curl -X POST http://localhost:5004/search \
       -H "Content-Type: application/json" \
       -d '{"query":"refactor authentication","filepath":"src/auth.ts"}'
     ```
   * Du bør modtage en liste med top 10 relevante kodechunks.

5. **Konfigurer MCP i Trae**

   * Åbn **MCP-fanen** → “+ Add” → Copy/paste JSON:

     ```json
     {
       "mcpServers": {
         "vector-search": {
           "command": "python3",
           "args": ["vector_search_server.py"],
           "env": {}
         }
       }
     }
     ```

     ([docs.trae.ai][6]).
   * Klik **Confirm**, så serveren starter i Trae. Tjek, at den viser ✅ Grøn flueben.

### 3.2 Persistens-server (Historik & memory)

1. **Vælg en database**

   * For mindre projekter kan SQLite eller en JSON-fil suffice. For skalerbarhed, brug Redis eller PostgreSQL.
   * I dette eksempel bruger vi SQLite via SQLAlchemy.

2. **Installer Flask & SQLAlchemy**

   ```bash
   pip install Flask SQLAlchemy
   ```

   ([harendra21.substack.com][10]).

3. **Skriv “prompt\_history\_server.py”**

   ```python
   from flask import Flask, request, jsonify
   from flask_sqlalchemy import SQLAlchemy
   from datetime import datetime

   app = Flask(__name__)
   app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///prompt_history.db'
   db = SQLAlchemy(app)

   class PromptHistory(db.Model):
       id = db.Column(db.Integer, primary_key=True)
       role = db.Column(db.String(10))  # 'user' eller 'assistant'
       content = db.Column(db.Text)
       timestamp = db.Column(db.DateTime, default=datetime.utcnow)

   @app.route('/append', methods=['POST'])
   def append_message():
       data = request.json
       msg = PromptHistory(role=data['role'], content=data['content'])
       db.session.add(msg)
       db.session.commit()
       return jsonify({"status":"ok"})

   @app.route('/last', methods=['GET'])
   def get_last_n():
       n = int(request.args.get('n',5))
       history = PromptHistory.query.order_by(PromptHistory.timestamp.desc()).limit(n).all()
       response = [{"role":h.role, "content":h.content} for h in reversed(history)]
       return jsonify(response)

   @app.route('/summarize', methods=['GET'])
   def summarize_old():
       # Dette er en placeholder; integrér f.eks. OpenAI til summarization
       summaries = []
       history = PromptHistory.query.order_by(PromptHistory.timestamp.desc()).offset(10).all()
       for h in history:
           summaries.append(h.content[:200])  # kludelig opsummering
       return jsonify({"summaries":summaries})

   if __name__ == '__main__':
       db.create_all()
       app.run(port=5007)
   ```

   ([harendra21.substack.com][10], [NVIDIA Blog][9]).

4. **Test historikserveren**

   * Kør `python3 prompt_history_server.py`.
   * Send beskeder:

     ```bash
     curl -X POST http://localhost:5007/append \
       -H "Content-Type: application/json" \
       -d '{"role":"user","content":"Vis mig alle tests for auth"}'
     ```
   * Hent de sidste 5:

     ```bash
     curl http://localhost:5007/last?n=5
     ```
   * Modtag JSON-array med de fem seneste prompts/responser.

5. **Indregistrer MCP i Trae**

   * Åbn **MCP-fanen** → “+ Add” → Copy/paste:

     ```json
     {
       "mcpServers": {
         "prompt-history": {
           "command": "python3",
           "args": ["prompt_history_server.py"],
           "env": {}
         }
       }
     }
     ```

     ([docs.trae.ai][6]).

---

## 4. Automatiseret RAG & indeksering

### 4.1 Opsæt Git-hook til automatisk genindeksering

1. **Opret `.git/hooks/pre-commit`**

   ```bash
   #!/bin/bash
   echo "🔄 Opdaterer ChromaDB RAG-indeks..."
   python3 scripts/index_code_chunks.py
   ```

   ([datacamp.com][7], [Medium][8]).
2. **Gør det eksekverbart**

   ```bash
   chmod +x .git/hooks/pre-commit
   ```
3. **Effekt**

   * Nu genopbygges embeddings og opdateres i ChromaDB, inden hver commit. Det sikrer, at RAG-serveren altid arbejder med seneste kode.

### 4.2 Finjuster ranking-funktion

1. **Skriv `rank_chunks.py`**

   ```python
   def rank_chunks(results, filepath):
       # Denne funktion tager ChromaDB-resultater (list of dicts)
       # og scorer baseret på:
       # 1. antal fælles imports mellem chunk og filepath
       # 2. filafstands-indikator (samme folder = højere score)
       # 3. recency (sidste ændret timestamp i metadata)
       ranked = sorted(results, key=lambda x: (
           -len(set(x['metadata']['imports']) & set(get_imports(filepath))),
           file_distance_score(filepath, x['metadata']['filepath']),
           -datetime.fromisoformat(x['metadata']['timestamp']).timestamp()
       ))
       return [r['document'] for r in ranked]
   ```

   * Den udnytter `imports`, `filepath`, `timestamp` i metadata for at sortere. ([Medium][8], [datacamp.com][7]).

2. **Integrer i `vector_search_server.py`**

   ```python
   from rank_chunks import rank_chunks

   @app.route('/search', methods=['POST'])
   def search():
       query = request.json['query']
       filepath = request.json.get('filepath','')
       q_embedding = model.encode(query).tolist()
       raw_results = collection.query(query_embeddings=[q_embedding], n_results=50)
       ranked_docs = rank_chunks(raw_results['documents'], filepath)
       return jsonify(ranked_docs[:10])  # Top 10
   ```

   Parameters `imports`, `filepath`, `timestamp` skal medsendes i metadata under indekseringen. ([Medium][8], [Chroma][14]).

---

## 5. Modulær promptarkitektur & prompt chaining

### 5.1 Opret prompt-templates

1. **Mappe: `templates/`**

   * `bugfix.md`, `unit-test.md`, `refactor.md`, `new-feature.md`
   * Eksempel `templates/unit-test.md`:

     ```
     # Unit Test Generator

     ## Instruktioner
     - Skriv en Jest-testfil for funktionen `{{function_name}}` i filen `{{filepath}}`.
     - Dæk standard-cases og edge-cases:
       1. Gyldigt input ➔ forventet output.
       2. Ugyldigt input ➔ fejl/undtagelse.
       3. Eksempel på kanttilstand (f.eks. tom streng eller null).

     ## Krav
     - Importér nødvendige moduler (fx `describe`, `it`, `expect`).
     - Brug mocks til eksterne afhængigheder.
     - Navngiv testfilen `{{function_name}}.test.js`.

     ## Output
     - Returér kun den komplette testfil som en JavaScript-kodeblok, uden yderligere forklaring.
     ```

2. **Intent-detektor i memory-serveren**

   * Understøtter en endpoint `/detect-intent`, f.eks.

     ```python
     @app.route('/detect-intent', methods=['POST'])
     def detect_intent():
         prompt = request.json['prompt']
         # Enkel heuristik: hvis 'test' i prompt, intent='unit-test'; 
         # 'fix' i prompt, intent='bugfix'; ellers 'new-feature'
         if 'test' in prompt.lower():
             return jsonify({"intent":"unit-test"})
         if 'fix' in prompt.lower() or 'bug' in prompt.lower():
             return jsonify({"intent":"bugfix"})
         return jsonify({"intent":"new-feature"})
     ```
   * Agenten kalder først `/detect-intent` med brugerens rå prompt og får intent. ([Cursor][2], [NVIDIA Blog][9]).

3. **Agentprompt**

   * Den faste prompt for “ProjektLL” kan være:

     ```
     Du er ProjektLL, en AI-assistent med adgang til:
     1. RAG-server via `@mcp vector-search`
     2. Hukommelsesserver via `@mcp prompt-history`
     3. Trae’s built-in tools: File system, Terminal, Web search, Preview

     **Workflow**:
     1. Modtag brugerprompt.
     2. Hent `intent` ved at kalde `@mcp prompt-history` → `POST /detect-intent`.
     3. Afhængigt af `intent`, hent tilhørende template fra `templates/{intent}.md`.
     4. Udfyld template-parametre (brug prompt-tekst, RAG-svar, chat-historik).
     5. Kør en “valideringsprompt” (fx “Gennemgå dit output for at sikre, at alle krav er opfyldt”).
     6. Returnér endeligt svar, og gem prompt + svar i `@mcp prompt-history` via `/append`.
     7. Før du skriver til filer, generér diff og præsenter i chatten med `git diff`.
     8. Hvis brugeren godkender, kør `Terminal`-kommandoer for at committe med standard commit-meddelelse.
     ```

### 5.2 Validerings-prompt

* Eksempel på valideringsprompt efter udfyldning:

  ```
  Brug følgende JSON som objekt:
  {
    "type": "{{intent}}",
    "filepath": "{{filepath}}",
    "content": "{{udfyldt_template}}"
  }
  Spørg: Er alle krav opfyldt i content? Hvis ikke, angiv mangler. Hvis ja, returnér "VALID".
  ```
* Agenten kalder en ekstra MCP-endpoint (f.eks. `/validate`), hvor en simpel LLM tjekker op mod template-krav ([NVIDIA Blog][9], [Cursor][2]).

---

## 6. Integrér dokumentationsopslag (Context-fanen)

### 6.1 Indekser offcielle guides

1. **Download & tilføj docs i Context**

   * Gå til **Context-fanen** i Trae → “+ Add Docs” → Vælg URL eller upload pdf/markdown for:

     * Next.js docs
     * Tailwind CSS docs
     * NestJS docs
     * Prisma schema reference
       ([cursor.com][4], [DEV Community][3]).

2. **Fix indexing-fejl**

   * Hvis et dokument fejler, tryk “…” → “Reindex” eller “Remove” og tilføj et andet format (f.eks. PDF i stedet for HTML).
   * Sørg for, at `.gitignore` ikke blokerer PDF/Md-filer.

3. **Fallback via RAG**

   * Hvis indekseringen mislykkes, kan agenten lave en hurtig Brav­e-search:

     ```
     Brug `@mcp brave-search` med query: “site:nextjs.org getStaticProps example”  
     ```
   * Integrer i agentprompten en betingelse: “Hvis lokal doc ikke findes, kald `@mcp brave-search`.” ([Builder.io][1], [Reddit][11]).

---

## 7. Implementér inline assistance (Code Lenses-lignende)

### 7.1 Simpel MCP “code-lens” server

1. **Opret `code_lens_server.py`**

   ```python
   from flask import Flask, request, jsonify

   app = Flask(__name__)

   @app.route('/code-lens', methods=['POST'])
   def code_lens():
       filepath = request.json['filepath']
       line = request.json['line']
       # Enkel heuristik: hvis linjenummer i en funktionsdefinition:
       # returner forslag
       with open(filepath, 'r') as f:
           lines = f.readlines()
       text = lines[line-1]
       suggestions = []
       if 'function' in text or 'def ' in text:
           suggestions.append("Generate unit tests")
           suggestions.append("Generate documentation stub")
       return jsonify({"suggestions": suggestions})

   if __name__ == '__main__':
       app.run(port=5008)
   ```

   ([Reddit][11], [docs.trae.ai][6]).

2. **Tilføj MCP**

   * **MCP-fanen** → “+ Add” → JSON:

     ```json
     {
       "mcpServers": {
         "code-lens": {
           "command": "python3",
           "args": ["code_lens_server.py"],
           "env": {}
         }
       }
     }
     ```

     ([docs.trae.ai][6], [Reddit][11]).

3. **Agentprompt – håndter lens-forespørgsler**

   * Inkludér:

     ```
     Når du ser JSON med "code_lens":true i prompten (fra UI), kald `@mcp code-lens` med `{ "filepath": <>, "line": <> }` og vis "suggestions" inline i chatten uden at skrive fra-scratch kode.
     ```
   * I chat-UI: Marker kontekst (fil + linjenummer) → klik på “Fetch Code Lenses” → agenten kalder endpointet og returnerer forslag.

### 7.2 Live preview

1. **Konfigurer `package.json` til auto-reload**

   ```json
   "scripts": {
     "dev": "next dev -p 3001"
   }
   ```

   ([cursor.com][4], [YouTube][12]).
2. **Aktiver Trae Preview**

   * I **Agents-fanen**, slå `Preview` built-in tool til for ProjektLL.
   * Når agenten ændrer UI-kode, kan den køre `@mcp terminal` → `npm run dev` i baggrunden, og Trae’s `Preview`-panel viser straks ændringer.

---

## 8. Governance & rollback

### 8.1 Generér og vis diffs før commit

1. **Agentprompt – diff**

   * Efter AI genererer kodeændringer, før du skriver til filsystemet, gør følgende i prompten:

     ```
     Brug `@workspace` til at fetch gammel version. Brug `@mcp terminal` til at køre `git diff` mellem gammel og ny kode. Returnér kun diff-teksten i markdown-format.
     ```

2. **Brugerinteraktion**

   * Chat-UI viser diff som kodeblok.
   * Brugeren svarer “Approve” eller “Reject”.
   * Hvis “Approve”: Agenten kører via `@mcp terminal`:

     ```bash
     git add .
     git commit -m "AI: <type>(<scope>): <kort besked>"
     ```
   * Hvis “Reject”: Agent gentager eller gendanner gamle filer via

     ```bash
     git checkout -- <file1> <file2>
     ```

### 8.2 Standardiserede commit-beskeder

* Instruér ProjektLL i fast prompt til at bruge formatet:

  ```
  AI: {intent}({scope}): {kort beskrivelse}
  ```
* For eksempel:

  ```
  AI: unit-test(auth): generate Jest tests for login function
  ```

---

## 9. Cloud-hosting for vector-database

### 9.1 Gratis/self-hosted ChromaDB

1. **Docker-image**

   ```bash
   docker run -d --name chroma_db -p 8000:8000 \
     -v $(pwd)/chroma_data:/root/chroma \
     ghcr.io/chroma-core/chroma:latest
   ```

   ([Chroma][14], [Chroma Docs][15]).
2. **Tilslut RAG-server til Docker-instans**

   * I `vector_search_server.py`, ændr client-oprettelsen til:

     ```python
     client = Client(hoste="http://localhost:8000")
     ```
   * På den måde kører ChromaDB i en container, og Flask-serveren kommunikerer eksternt.

### 9.2 Gratis/hosted løsninger

1. **Railway / Heroku Free Tier**

   * Deploy din ChromaDB-Docker-container:

     * Opret et Railway-projekt → tilknyt GitHub-repo med `docker-compose.yml`.
     * Tilføj miljøvariabel `SERVICE_NAME: chroma_db`.
   * Railway tilbyder 500 timer gratis, hvilket kan dække mindre projekter ([Medium][13]).

2. **Pinecone Free Plan**

   * Opret en gratis Pinecone-konto → få en API-nøgle.
   * I stedet for ChromaDB kan du bruge Pinecone som vektordatabase, og i `vector_search_server.py` kalde Pinecone’s REST-API til indlejring, søgning ([Medium][13], [Chroma][14]).

3. **Weaviate Free Tier**

   * En alternativ vektordatabase med gratis plan.
   * Installer `weaviate-client` og tilpas “search” endpoint til at kalde Weaviate i stedet for ChromaDB.

---

## 10. Saml arbejdsgangen: ProjektLL i Trae IDE

### 10.1 End-to-end workflow

1. **Start MCP-servere**

   * Åbn Trae IDE → gå til **MCP-fanen** → tjek, at både `vector-search`, `prompt-history`, `code-lens` kører med grønt flueben.

2. **Opret ProjektLL agent**

   * I **Agents-fanen**:

     * Navn: `ProjektLL`
     * Prompt: Indsæt den samlede faste prompt (se Afsnit 5.3) med workflow-trin og MCP-call-instruktioner.
     * Vælg værktøjer:

       * Under MCP: `vector-search`, `prompt-history`, `code-lens`
       * Under Built-In: `File system`, `Terminal`, `Web search`, `Preview`
   * Gem agenten.

3. **Indekser kode & docs**

   * Gå til **Context-fanen** → Klik “Reindex” → vent til “Workspace successfully indexed | 100%” ([docs.trae.ai][5], [DEV Community][3]).
   * Under **Docs**, sørg for at Next.js-, Tailwind-, NestJS- og Prisma-docs er “Last updated” uden fejl ([DEV Community][3], [Builder.io][1]).

4. **Test standard-prompt**

   * Åbn Chat UI, vælg `ProjektLL`.
   * Send:

     ```
     Hej ProjektLL, generér venligst en unit test for funktionen `loginUser` i `src/auth.ts`.
     ```
   * ProjektLL vil:

     1. Kalde `/detect-intent` → intent=`unit-test`
     2. Hente `templates/unit-test.md`
     3. Udfylde parametre (filnavn, funktionsnavn)
     4. Køre “valideringsprompt”
     5. Returnere testfilen som JS-kodeblok og gemme prompt+output i `/append` ([Cursor][2], [NVIDIA Blog][9]).

5. **Udfør diff + commit**

   * ProjektLL udregner diff ved at køre `@mcp terminal` → `git diff` over ændringer.
   * Chat-UI viser diff. Brugeren svarer “Approve”.
   * Agenten kører `@mcp terminal`:

     ```bash
     git add .
     git commit -m "AI: unit-test(auth): generate Jest tests for loginUser"
     ```
   * Denne commit er nu i repoet og kan pushes til remote.

6. **Inline Code Lenses**

   * Når du i en prompt åbner et specifikt kodeafsnit (fx `src/user.ts` linje 42), kan du skrive “@mcp code-lens” med `{ "filepath":"src/user.ts","line":42 }`.
   * Agenten svarer med en liste over forslag (f.eks. “Generate doc stub”, “Generate unit tests”), som du klikker i chatten for at udføre.

7. **Persistent session**

   * Luk Trae IDE, og næste gang du åbner projektet, klikker du “@mcp prompt-history → /last?n=5” automatisk for at genopbygge de sidste fem prompt-responser i chatten ([harendra21.substack.com][10], [Cursor][2]).
   * Brugeren får præcis samme samtalekontekst tilbage, uden at huske, hvad der blev drøftet.

8. **Automatiseret RAG ved commit**

   * Hver gang du committer, aktiveres pre-commit hook, som genopbygger ChromaDB.
   * Herved er RAG-resultater altid baseret på nyeste kode.

---

## 11. Tips til løbende forbedring

1. **Finjuster ranker**

   * Brug statistik (f.eks. code coverage fra tests) til at vægte, hvilke kodechunks der prioriteres i RAG ([Medium][8]).

2. **Hukommelsesets AI-summarizer**

   * Integrér en LLM (OpenAI, Anthropic) i `/summarize` endpointet, så gamle beskeder komprimeres i konsistente bullet-punkter fremfor klodset tekst ([NVIDIA Blog][9]).

3. **Udvid docs-integration**

   * Tilføj framework-specifikke MCP-servers (Next.js Docs API, Prisma Docs API), så brugeren kan modtage officielle doc-snippets direkte ([Reddit][11]).

4. **UI/UX-iteration**

   * Undersøg muligheder for at lave en Trae-plugin, der viser Code Lenses direkte i editoren (fx via Custom Editor Extensions).
   * Eksperimentér med “chat-sidebar transparency” for at optimere kodelæsning under chat.

5. **Skaler til teams**

   * Gør `prompt_history_server` multibruger-parat (tilføj bruger-ID), så alle i teamet kan se fælles AI-beslutninger.
   * Brug en dedikeret hosted vector store (fx Pinecone) for lav latency og høj tilgængelighed i teamsetting ([Medium][13]).

---

## 12. Konklusion

Ved at følge denne omfattende guide sikrer du:

1. **Sømløs, automatiseret RAG** med ChromaDB (og eventuelt hostet løsning), der rivaliserer Cursor’s vektortedatabase ([datacamp.com][7], [Chroma][14]).
2. **Persistent hukommelse** med summarisering, så kontekst bevares mellem sessioner, som Cursor-brugere forventer ([NVIDIA Blog][9], [harendra21.substack.com][10]).
3. **Modulær promptarkitektur** med intent-detektion og templates, der minimerer støy, øger genbrug og sikrer præcis output ([Cursor][2], [DEV Community][3]).
4. **Inline assistance** (Code Lenses) og **live preview**, der giver en umiddelbar, proaktiv brugeroplevelse, der ligner Cursor’s in-editor hints ([cursor.com][4], [YouTube][12]).
5. **Sikkerhed, governance** og **rollback** med diffs og standardiserede commit-beskeder, så man altid kan spore og rulle AI-ændringer tilbage ([Cursor][2], [DEV Community][3]).
6. **Gratis/hostede vektordatabaser** via Docker, Railway eller Pinecone, så man undgår store dyre setup-omkostninger ([Medium][13], [Chroma Docs][15]).

Med denne opsætning kan din Trae-agent – “ProjektLL” – levere en oplevelse, der ikke alene matcher, men i enkelte tilfælde overgår Cursor’s agentfunktioner, alt imens du beholder fordelene ved Trae’s åbenhed og gratis licenser.

God implementering! Hvis du har spørgsmål til a) kodeeksempler, b) justering af promt-strategi eller c) valg af gratis hosting-platform, står jeg klar til at hjælpe videre.

---

### Kilder (minimum 10 citations)

1. Features | Cursor – The AI Code Editor ([cursor.com][4])
2. Agents – Trae IDE documentation ([docs.trae.ai][5])
3. Example Servers – Model Context Protocol ([Model Context Protocol][16])
4. ChromaDB tutorial – DataCamp ([datacamp.com][7])
5. What Is RAG – AWS ([Amazon Web Services, Inc.][17])
6. Trae vs Cursor: AI IDE Comparison – Builder.io ([Builder.io][1])
7. Chroma – Try Chroma ([Chroma][14])
8. 15 Best AI Coding Assistant Tools – Qodo ([Qodo][18])
9. Trae AI Tutorial – YouTube (Coding Will Never Be Same…) ([YouTube][12])
10. Agent Mode – Cursor Documentation ([Cursor][2])
11. MCP Documentation – Trae IDE ([docs.trae.ai][6])
12. A Broke B\*\*ch’s Guide to Vector Database (ChromaDB) ([Medium][8])
13. NVIDIA Blog on RAG ([NVIDIA Blog][9])
14. Tech Blog (VS Code vs Cursor vs Trae) – dev.to ([DEV Community][3])
15. A Broke B\*\*ch’s Guide – Cloud hosting for vector DB ([Medium][13])
16. Reddit – Trae Feature Spotlight Agent ([Reddit][11])
17. Reddit – Cursor AI improvements ([Reddit][19])
18. MCP Server tutorial – Harendra21 Substack ([harendra21.substack.com][10])
19. Getting Started – Chroma Docs ([Chroma Docs][15])

[1]: https://www.builder.io/blog/cursor-vs-trae?utm_source=chatgpt.com "Trae vs Cursor: AI IDE Comparison - Builder.io"
[2]: https://docs.cursor.com/chat/agent?utm_source=chatgpt.com "Agent Mode - Cursor"
[3]: https://dev.to/joodi/vs-code-vs-cursor-vs-trae-navigating-the-ai-ide-landscape-in-2025-4e2k?utm_source=chatgpt.com "VS Code vs. Cursor vs. Trae: Navigating the AI IDE Landscape in 2025"
[4]: https://www.cursor.com/features?utm_source=chatgpt.com "Features | Cursor - The AI Code Editor"
[5]: https://docs.trae.ai/ide/agent?utm_source=chatgpt.com "Agent - Documentation - What is Trae IDE?"
[6]: https://docs.trae.ai/ide/model-context-protocol?utm_source=chatgpt.com "Model Context Protocol (MCP) - Documentation - What is Trae IDE?"
[7]: https://www.datacamp.com/tutorial/chromadb-tutorial-step-by-step-guide?utm_source=chatgpt.com "Learn How to Use Chroma DB: A Step-by-Step Guide | DataCamp"
[8]: https://medium.com/%40soumitsr/a-broke-b-chs-guide-to-tech-start-up-choosing-vector-database-part-1-local-self-hosted-4ebe4eec3045?utm_source=chatgpt.com "A Broke B**ch's Guide to Tech Start-up: Choosing Vector Database"
[9]: https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation/?utm_source=chatgpt.com "What Is Retrieval-Augmented Generation aka RAG - NVIDIA Blog"
[10]: https://harendra21.substack.com/p/what-is-an-mcp-server-and-how-do?utm_source=chatgpt.com "What is an MCP Server, and How Do You Create One?"
[11]: https://www.reddit.com/r/Trae_ai/comments/1koi7eg/trae_feature_spotlight_agent_reimagine_the_future/?utm_source=chatgpt.com "Trae Feature Spotlight: @Agent - Reimagine The Future of ... - Reddit"
[12]: https://www.youtube.com/watch?v=H1YG3ipxl20&utm_source=chatgpt.com "Coding Will Never Be The Same... Trae AI Tutorial - YouTube"
[13]: https://medium.com/%40soumitsr/a-broke-b-chs-guide-to-tech-start-up-choosing-vector-database-cloud-serverless-prices-3c1ad4c29ce7?utm_source=chatgpt.com "A Broke B**ch's Guide to Tech Start-up: Choosing Vector Database"
[14]: https://www.trychroma.com/?utm_source=chatgpt.com "Chroma"
[15]: https://docs.trychroma.com/getting-started?utm_source=chatgpt.com "Getting Started - Chroma Docs"
[16]: https://modelcontextprotocol.io/examples?utm_source=chatgpt.com "Example Servers - Model Context Protocol"
[17]: https://aws.amazon.com/what-is/retrieval-augmented-generation/?utm_source=chatgpt.com "What is RAG? - Retrieval-Augmented Generation AI Explained - AWS"
[18]: https://www.qodo.ai/blog/best-ai-coding-assistant-tools/?utm_source=chatgpt.com "15 Best AI Coding Assistant Tools in 2025 - Qodo"
[19]: https://www.reddit.com/r/rails/comments/1im0mi7/how_has_cursor_ai_gh_copilots_recent_features/?utm_source=chatgpt.com "How has Cursor AI / GH Copilot's recent features improved your team?"
