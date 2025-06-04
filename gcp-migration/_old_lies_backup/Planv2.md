 Nedenfor følger en konkret, trin-for-trin-plan for at erstatte den nuværende Ollama-integration i `gcp-migration` med OpenAI API-nøgler, så din RAG/MCP-server kan køre fejlfrit i skyen. Alt er direkte funderet i dine eksisterende filer og indeholder præcise citationshenvisninger til de viste uddrag fra `repomix-output.xml`.

---

## 1. Kort oversigt over `gcp-migration`-strukturen

Ifølge `QUICK_START.md` og projektets fil-oversigt består `gcp-migration` af:

```
gcp-migration/
├── README.md
├── requirements.txt               # Python dependencies inkl. Ollama
├── Dockerfile                     # Multi-stage med installation af Ollama
├── src/
│   ├── mcp_server_with_rag.py     # MCP-server med RAG (funktionel)
│   ├── rag_engine_fixed.py        # RAGEngine (funktionel, fikset version)
│   ├── mcp_server_standalone.py   # MCP-server uden RAG
│   ├── mcp_server.py              # Original MCP-server
│   ├── rag_engine.py              # RAG-implementation (fejler)
│   ├── rag_engine_phase3.py       # Alternativ RAG
│   ├── mcp_server_phase3.py       # Alternativ MCP-server
│   └── initialize_rag.py          # Script til at initialisere RAG-indeks
└── _old_lies_backup/              # Diverse ældre docs, Dockerfiles, scripts
    ├── Dockerfile.*               # Forskellige versioner (cloud, standalone osv.)
    └── requirements-cloud.txt     # Light-weight dependencies uden Ollama
    ...
```



### Primære områder med Ollama

1. **`requirements.txt`** indeholder stadig `ollama>=0.1.0` som dependency .
2. **Dockerfile** installerer Ollama (via `curl https://ollama.ai/install.sh`) og starter både Ollama-service og Python-serveren i én container .
3. Alle tre RAG-engine-filers (“`rag_engine.py`”, “`rag_engine_fixed.py`” og “`rag_engine_phase3.py`”) importerer og bruger `ollama.Client(...)` til både embedding og tekstgenerering .
4. MCP-server-filen (`mcp_server_with_rag.py`) bruger netop den “fikse” RAGEngine, som under hætten taler til Ollama .

Målet er derfor:

* Fjerne / erstatte Ollama i **`requirements.txt`** og **`Dockerfile`**.
* Ændre alle imports og kald til `ollama.Client(...)` i RAG-engine-filer­ne, så de i stedet benytter OpenAI’s Python SDK (dvs. `openai.ChatCompletion.create(...)` og `openai.Embeddings.create(...)`).
* Justere health-checks og eventuel feature-flagging i MCP-serverne, så de tjekker OpenAI-forbindelsen i stedet for Ollama.
* Sikre, at miljøvariabler (fx `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`) sættes korrekt i Dockerfile og i cloud-deployment.

---

## 2. Opdatering af Python-dependencies

### 2.1. Fjern `ollama` fra `requirements.txt` og tilføj `openai`

Din eksisterende `requirements.txt` indeholder (blandt andet) linjen:

```text
# Ollama client
ollama>=0.1.0  
```



Ændr denne sektion til i stedet at indeholde OpenAI SDK og eventuelt Tiktoken (hvis du behøver ekstra hastighed til tokenisering):

```diff
- # Ollama client
- ollama>=0.1.0
+ # OpenAI client
+ openai>=0.27.0
+ tiktoken>=0.5.0      # (valgfrit, til tokens-optælling eller streaming)
```

Efter ændringen skal `requirements.txt` se sådan ud (uddrag):

```text
fastapi>=0.100.0
uvicorn[standard]>=0.20.0
pydantic>=2.0.0

chromadb>=0.4.0
sentence-transformers>=2.2.0

# OpenAI client
openai>=0.27.0
tiktoken>=0.5.0

pypdf2>=3.0.0
python-docx>=1.0.0
markdown>=3.5.0
structlog>=23.0.0
python-multipart>=0.0.6

prometheus-client>=0.19.0

langdetect>=1.0.9
psutil>=5.9.0
gitpython>=3.1.0

pytest>=7.4.0
pytest-asyncio>=0.21.0
```



**Kommentar**: Hvis du i praksis ikke behøver at token-tælle eller bruge streaming, kan du lade `tiktoken` ude. Men OpenAI SDK’en (`openai>=0.27.0`) er nødvendig.

---

## 3. Ændring af Dockerfile: Fjern Ollama og installer OpenAI

Din nuværende `gcp-migration/Dockerfile` udfører to hovedopgaver:

1. **Ollama-base stage** (installerer Ollama via `curl https://ollama.ai/install.sh`)
2. **Python-builder stage** (installerer Python-dependencies inkl. Ollama)
3. Kopierer koden, starter både Ollama og Python-server.

Uddrag fra det eksisterende Dockerfile:

```dockerfile
FROM ubuntu:22.04 AS ollama-base
...
RUN curl -fsSL https://ollama.ai/install.sh | sh
...
FROM python:3.11-slim AS python-builder
...
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir --user -r /tmp/requirements.txt
...
FROM ollama-base
...
ENV OLLAMA_HOST=0.0.0.0
ENV OLLAMA_PORT=11434
...
CMD ["/start-services.sh"]
```



### 3.1. Ny, forenklet “production” Dockerfile uden Ollama

Udsted en ny `Dockerfile` i `gcp-migration/` (erstat den eksisterende), som:

1. **Bruger én enkelt Python-stage** baseret på Debian/Ubuntu med Python 3.11
2. **Installerer systempakker** (fx `curl`) – men fjerner alt, der vedrører Ollama
3. **Kopierer `requirements.txt`** og `src/`
4. **Eksponerer port 8080**
5. **Sætter `OPENAI_API_KEY` som miljøvariabel (senest injiceret ved deploy)**
6. **Starter `mcp_server_with_rag.py`** (eller hvad du ønsker)

Eksempel på en ny `Dockerfile` (helt minimal, uden Ollama):

```dockerfile
# Brug Python 3.11 slim-image
FROM python:3.11-slim

# Installer systemafhængigheder (fx curl til healthcheck)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Opret arbejdsmappe
WORKDIR /app

# Kopiér Python-dependencies
COPY requirements.txt . 

# Installer Python-pakker (inkl. openai)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Kopiér applikationskode
COPY src/ ./src/

# Sæt miljøvariabel for port (bruges af uvicorn i koden)
ENV CODE_ASSISTANT_PORT=8080

# Eksponér port 8080
EXPOSE 8080

# Sæt OpenAI-nøgle (streger argumentet – ved deploy sættes den fra din CI/CD)
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV OPENAI_MODEL=gpt-3.5-turbo
ENV OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# Healthcheck (valgfrit, men anbefalet)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start MCP + RAG-serveren
CMD ["python3", "src/mcp_server_with_rag.py"]
```

**Bemærkninger**:

* Du skal IKKE længere installere Ollama.
* Ved deploy i Cloud Run/GKE skal du injicere en hemmelig `OPENAI_API_KEY` via dine miljøvariabler (se “Deploy” nedenfor).
* Hvis du ønsker at skifte til standalone-version uden RAG, kan du i stedet pege `CMD` på `src/mcp_server_standalone.py`.

---

## 4. Ændring af RAG-engine-filerne: Fra Ollama → OpenAI

Der er tre varianter af din RAG-Engine, som alle importerer og bruger `ollama.Client`:

1. **`rag_engine.py`** (grundlæggende, fejler under visse omstændigheder)
2. **`rag_engine_fixed.py`** (den “fikse” version, som faktisk fungerer lokalt)
3. **`rag_engine_phase3.py`** (optimeret/udvidet version).

Alle disse filer deler den samme grundstruktur:

* Importer `ollama`
* I `__init__` oprettes `self.ollama_client = ollama.Client(host=f"http://{ollama_host}")`
* Metoderne `create_embedding(...)` og `generate(...)` kalder `self.ollama_client.embeddings(...)` og `self.ollama_client.generate(...)`.
* Der er også en “health check” med `self.ollama_client.list()` for at teste om Ollama-serveren er oppe.


### 4.1. Fælles ændring: Importér og initier OpenAI

I stedet for at gøre:

```python
import ollama

class RAGEngine:
    def __init__(self, ollama_host: str = "localhost:11434", ...):
        self.ollama_host = ollama_host
        self.ollama_client = ollama.Client(host=f"http://{ollama_host}")
        ...
```

skal du i alle tre RAG-engine-filer (undlade `rag_engine_phase3.py` for sekunder, men princippet er identisk) erstatte med:

```python
import openai
import os

class RAGEngine:
    def __init__(self, ...):
        # Indlæs OpenAI API-nøgle fra miljø
        openai.api_key = os.getenv("OPENAI_API_KEY")
        # (Valgfrit: openai.api_base = os.getenv("OPENAI_API_BASE") hvis du har Enterprise-endpoint)
        self.llm_model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
        ...
```

Her skal du passe på at fjerne `import ollama` samt alt, der vedrører `self.ollama_client`.&#x20;

### 4.2. Udskift embedding-rutinen

I `rag_engine_fixed.py` (eller i `rag_engine.py`/`rag_engine_phase3.py`) findes metoden (forenklet):

```python
# Gammel Ollama-version
def create_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
    request = OllamaEmbeddingRequest(model=embedding_model, prompt=text)
    response = self.ollama_client.embeddings(request)
    return response.data.embedding
```

Skift til OpenAI:

```python
# Ny OpenAI-version
def create_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
    response = openai.Embeddings.create(
        input=text,
        model=model or self.embedding_model
    )
    # OpenAI returnerer en liste af “data”, hvor embedding ligger i data[0]["embedding"]
    embedding = response["data"][0]["embedding"]
    return embedding
```

Gentag denne ændring i **alle** forekomster i `rag_engine.py`, `rag_engine_fixed.py` og `rag_engine_phase3.py`.&#x20;

### 4.3. Udskift LLM-generering

Tidligere, fx i `rag_engine_fixed.py`, brugte du:

```python
# Gammel Ollama-version
def generate_completion(self, prompt: str, ...):
    response = self.ollama_client.generate({
        "model": self.llm_model,
        "prompt": prompt,
        "temperature": temperature,
        "max_tokens": max_tokens
    })
    return response.data.response
```

Skift til OpenAI ChatCompletion:

```python
# Ny OpenAI-version
def generate_completion(self, prompt: str, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 1000) -> str:
    response = openai.ChatCompletion.create(
        model=model or self.llm_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens
    )
    # Returnér kun tekst-indholdet
    return response.choices[0].message["content"]
```

Hvis du i stedet ønsker en “completion” uden chat-format (kun “prompt”), kan du bruge `openai.Completion.create(...)`, men i de fleste RAG-workflows anbefales ChatCompletion.&#x20;

### 4.4. Justér health-checks i RAGEngine

I mange eksempler tjekker koden Ollama-status ved f.eks.:

```python
try:
    models = self.ollama_client.list()
    logger.info("Ollama ok")
    ollama_ok = True
except Exception:
    ollama_ok = False
```

Erstat (eller suppler) med et simpelt OpenAI-kald, fx en embedding:

```python
def is_ready(self) -> bool:
    try:
        _ = openai.Embeddings.create(input="ping", model=self.embedding_model)
        return True
    except Exception:
        return False
```

Brug denne `is_ready(...)` i stedet for `self.ollama_client.list()`. Bemærk, at OpenAI kalder inkluderer pris, men næsten altid virker, hvis din nøgle er gyldig og miljøopsætningen korrekt.&#x20;

---

## 5. Tilpas MCP-serverne: `mcp_server_with_rag.py` og `mcp_server.py`

### 5.1. `mcp_server_with_rag.py`

Denne fil importerer i dag:

```python
from rag_engine_fixed import RAGEngine
```

Efter din RAGEngine-opdatering (se afsnit 4) bruger du OpenAI. Du behøver derfor ikke ændre på selve importen, men hvis du har en health-endpoint, der viser “ollama: True/False”, kan du rette den til:

```python
@app.get("/health")
async def health_check():
    openai_ok = rag_engine.is_ready()
    return {
        "status": "healthy" if openai_ok else "unhealthy",
        "services": {
            "openai": openai_ok,
            "rag_engine": rag_engine.is_ready(),
            "chromadb": True
        },
        "timestamp": datetime.utcnow().isoformat()
    }
```

Igen skal du fjerne eventuelle referencer som `"ollama": True` .

### 5.2. `mcp_server.py` og andre varianter

`mcp_server.py` bruger også `from rag_engine import RAGEngine` og benytter metoderne `analyze_code`, `search_codebase` osv. Du skal blot sikre dig, at denne RAGEngine er den version, som nu kalder OpenAI i stedet for Ollama. Du behøver ikke fjerne hele MCU-serveren, blot sikre de bagvedliggende kald.&#x20;

---

## 6. Opdater `initialize_rag.py`

I `initialize_rag.py` (der står noget i stil med):

```python
from rag_engine import RAGEngine
...
rag = RAGEngine(...)
await rag.setup(...)
```

Du skal her blot sikre, at `RAGEngine` nu bruger OpenAI og dermed kan lave de første embeddings via OpenAI. Ingen yderligere ændring i selve scriptet er nødvendig, medmindre du vil logge “Connecting to OpenAI…” i stedet for “Connecting to Ollama…”.&#x20;

---

## 7. Test lokalt, inden sky-deploy

Før du pusher til cloud (f.eks. Cloud Run), skal du teste lokalt:

1. **Sæt miljøvariabler** (Copenhagen-tid):

   ```bash
   export OPENAI_API_KEY="sk-..."
   export OPENAI_MODEL="gpt-3.5-turbo"
   export OPENAI_EMBEDDING_MODEL="text-embedding-ada-002"
   ```

2. **Installer dependencies** (nyt `requirements.txt`):

   ```bash
   cd gcp-migration
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Start Python-server**:

   ```bash
   python3 src/mcp_server_with_rag.py
   ```

   Forvent at se i loggen (fx):

   ```
   INFO:     Started server on http://0.0.0.0:8080
   INFO:     RAGEngine ready: True
   ```

4. **Test health endpoint**:

   ```bash
   curl http://localhost:8080/health
   ```

   Bør returnere fx:

   ```json
   {
     "status": "healthy",
     "services": { "openai": true, "rag_engine": true, "chromadb": true },
     "timestamp": "2025-06-04T…"
   }
   ```

5. **Test MCP tools**:

   ```bash
   curl -X POST http://localhost:8080/mcp \
     -H "Content-Type: application/json" \
     -d '{"method": "tools/list"}'
   ```

   Du bør nu se de tilgængelige værktøjer (`analyze_code`, `search_codebase`, `add_document`, osv.), hvor selve LLM-kald (bag scenen) kører via OpenAI .

---

## 8. CI/CD: Konfiguration af hemmeligheder og Deployment

### 8.1. GitHub Actions (eller anden CI)

* **Secrets**: Tilføj `OPENAI_API_KEY` som Secret i GitHub (fx `OPENAI_API_KEY`).
* **CI-job**: I dit build-script kan du sætte en dummy-nøgle til test (mock OpenAI-kald) og i “deploy to staging/production” bruge den ægte nøgle. Eksempel:

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  OPENAI_MODEL: gpt-3.5-turbo
  OPENAI_EMBEDDING_MODEL: text-embedding-ada-002
```

* **Tests**: Hvis du har unit-tests på RAGEngine, skal du mock’e `openai.Embeddings.create(...)` og `openai.ChatCompletion.create(...)`, fx ved at bruge `pytest-mock` eller `unittest.mock`.

### 8.2. Cloud Run / GCR

Når du deployer til Google Cloud Run:

1. **Byg multi-arch Docker-image** (for at sikre AMD64):

   ```bash
   docker buildx create --use
   docker buildx build --platform linux/amd64,linux/arm64 -t gcr.io/$PROJECT_ID/learninglab-rag-openai --push .
   ```

   Dette sikrer, at Cloud Run kan køre AMD64-versionen .

2. **Deploy med miljøvariabler**:

   ```bash
   gcloud run deploy learninglab-rag-openai \
     --image gcr.io/$PROJECT_ID/learninglab-rag-openai \
     --region europe-west1 \
     --platform managed \
     --set-env-vars OPENAI_API_KEY="${OPENAI_API_KEY}",OPENAI_MODEL="gpt-3.5-turbo",OPENAI_EMBEDDING_MODEL="text-embedding-ada-002",CODE_ASSISTANT_PORT="8080" 
   ```

3. **Kontrollér logs og health**:

   ```bash
   curl https://<din-service-url>/health
   curl -X POST https://<din-service-url>/mcp -H "Content-Type: application/json" -d '{"method":"tools/list"}'
   ```

   Hvis det returnerer `{"services":{"openai":true,...}}` og værktøjslisten, er du kørende.

---

## 9. Opsummering af trin-for-trin-tjekliste

1. **Opdater `requirements.txt`**

   * Fjern `ollama>=0.1.0`&#x20;
   * Tilføj `openai>=0.27.0` (+ evt. `tiktoken`)&#x20;

2. **Erstat Ollama-kald i RAG-engine**

   * Fjern `import ollama` i alle tre filer:

     * `src/rag_engine.py`&#x20;
     * `src/rag_engine_fixed.py`&#x20;
     * `src/rag_engine_phase3.py`&#x20;
   * Tilføj `import openai` og `openai.api_key = os.getenv("OPENAI_API_KEY")`.
   * Udskift `orellama_client.embeddings(...)` → `openai.Embeddings.create(...)`.
   * Udskift `ollama_client.generate(...)` → `openai.ChatCompletion.create(...)`.
   * Ret health-check til at kalde en lille OpenAI-embedding (fx `openai.Embeddings.create(input="ping")`).

3. **Opdater Dockerfile** (i `gcp-migration/`)

   * Fjern “Ollama-base”-stage og tilhørende `RUN curl … ollama install.sh`.
   * Installer kun `requirements.txt` (som nu inkluderer OpenAI).
   * Sæt `ENV OPENAI_API_KEY=${OPENAI_API_KEY}`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`.
   * `CMD ["python3", "src/mcp_server_with_rag.py"]`.

4. **Ret health-endpoint i MCP** (hvis nødvendigt)

   * I `mcp_server_with_rag.py`: Vis “openai: true/false” i stedet for “ollama: true/false”.&#x20;

5. **Test lokalt**

   * Sæt `export OPENAI_API_KEY=sk-…` og kør `python3 src/mcp_server_with_rag.py`.
   * `curl http://localhost:8080/health` → `{"services":{"openai":true,...}}`.
   * `curl -X POST http://localhost:8080/mcp -H "Content-Type: application/json" -d '{"method":"tools/list"}'` → vis værktøjer.&#x20;

6. **CI/CD**

   * Tilføj `OPENAI_API_KEY` som secret i GitHub Actions.
   * Mock OpenAI i tests (fx via `pytest` + `monkeypatch`).

7. **Byg og deploy til Cloud Run**

   * `docker buildx build ... --platform linux/amd64,linux/arm64 -t gcr.io/... --push`.&#x20;
   * `gcloud run deploy ... --set-env-vars OPENAI_API_KEY=…,OPENAI_MODEL=…,OPENAI_EMBEDDING_MODEL=…`.

8. **Smoke-test i skyen**

   * `curl https://<service>/health` → `{"services":{"openai":true, ...}}`.
   * `curl -X POST https://<service>/mcp -H "Content-Type: application/json" -d '{"method":"tools/list"}'` → værktøjer skal dukke op.

Når alle disse trin er gennemført, vil din `gcp-migration`-folder være ryddet for Ollama-afhængigheder og udelukkende benytte OpenAI API-nøgler – klar til en fejlfri deployment til din valgte cloud-platform.
