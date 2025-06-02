# MCP RAG-Server Dokumentation

## Indholdsfortegnelse

1. [Introduktion](#introduktion)
2. [Systemarkitektur](#systemarkitektur)
3. [Installation og opsætning](#installation-og-opsætning)
4. [Brug af RAG-serveren](#brug-af-rag-serveren)
5. [API-dokumentation](#api-dokumentation)
6. [Optimeringsstrategier](#optimeringsstrategier)
7. [Fejlfinding](#fejlfinding)
8. [Bidrag til udvikling](#bidrag-til-udvikling)
9. [Afhængigheder](#afhængigheder)
10. [Ollama-optimering](#ollama-optimering)

## Introduktion

MCP RAG-serveren er en højt optimeret Retrieval-Augmented Generation (RAG) løsning designet til at forbedre LLM-baserede spørgsmål/svar-systemer ved at kombinere vektorsøgning med kontekstbaseret generering. Systemet er specifikt optimeret til at arbejde med kodebase-dokumentation og tekniske dokumenter.

### Nøglefunktioner

- **Semantisk chunking**: Intelligent opdeling af dokumenter baseret på semantisk indhold
- **Vektorsøgning**: Hurtig og præcis søgning efter relevante dokumenter
- **Proximity Cache**: Avanceret caching-mekanisme der reducerer latenstid for lignende forespørgsler
- **FastAPI-backend**: Højtydende API med asynkron håndtering af forespørgsler
- **GPU-acceleration**: Automatisk brug af GPU til embedding-generering (hvis tilgængelig)
- **Ollama-integration**: Nem integration med lokale LLM-modeller via Ollama
- **Streaming Responses**: Implementerer streaming for hurtigere brugeroplevelse
- **Effektiv kontekstopbygning**: Reducerer mængden af kontekst for hurtigere LLM-svar

## Systemarkitektur

RAG-serveren består af følgende hovedkomponenter:

### 1. Vector Search Server (FastAPI)

Kernen i systemet er en FastAPI-baseret server, der håndterer vektorsøgning og caching. Denne komponent:
- Indlæser og vedligeholder embedding-modellen
- Kommunikerer med ChromaDB vektordatabasen
- Implementerer Proximity Cache for hurtigere svartider
- Eksponerer REST API-endpoints for søgning

### 2. Indekseringsværktøjer

Værktøjer til at indeksere og opdatere vektordatabasen:
- `index_code_chunks.py`: Indekserer kodebase med semantisk chunking
- `semantic_chunking.py`: Implementerer avancerede chunking-strategier

### 3. Proximity Cache

En specialiseret caching-mekanisme, der:
- Gemmer tidligere forespørgsler og deres resultater
- Beregner kosinus-lighed mellem nye og cachede forespørgsler
- Returnerer cachede resultater for lignende forespørgsler
- Vedligeholder cache-størrelse og statistik

### 4. Reranking-system

- `rank_chunks.py`: Algoritme til at rangere søgeresultater baseret på relevans
- Forbedrer præcisionen af søgeresultater ved at omrangere dem efter relevans

### 5. Ollama Integration

Integration med Ollama for lokal LLM-inferens:
- Sender kontekst og forespørgsler til Ollama API
- Håndterer streaming af svar
- Understøtter forskellige modeller

## Installation og opsætning

### Forudsætninger

- Python 3.9+
- ChromaDB
- Sentence Transformers
- FastAPI og Uvicorn
- Ollama (valgfrit, for lokal LLM-inferens)

### Installation

1. **Klargør miljøet**:
   ```bash
   # Aktiver dit Python-miljø
   source mcp-venv/bin/activate
   
   # Installer afhængigheder
   pip install -r mcp_services/rag_server/requirements.txt
   ```

2. **Indekser din kodebase**:
   ```bash
   python mcp_services/rag_server/index_code_chunks.py /sti/til/din/kodebase
   ```

3. **Start RAG-serveren**:
   ```bash
   ./mcp_services/rag_server/scripts/start-rag-server-fastapi.sh
   ```

### Konfiguration

RAG-serveren kan konfigureres ved at redigere `config.py` filen:

```python
# Embedding-model
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"  # Kan ændres til andre modeller

# ChromaDB konfiguration
CHROMA_DB_DIR = os.path.join(os.getcwd(), "chroma_db")
COLLECTION_NAME = "code_chunks"

# Cache-konfiguration
CACHE_SIZE = 100  # Maksimalt antal cache-indgange
SIMILARITY_THRESHOLD = 0.85  # Tærskel for kosinus-lighed
```

Vigtige indstillinger for Ollama-integration:

- **llm.temperature**: Lavere værdi (0.1) giver mere deterministiske svar
- **llm.num_thread**: Optimeret til 4 for M1 Mac
- **llm.num_ctx**: Reduceret kontekstvindue for hurtigere inferens
- **retrieval.top_k**: Antal resultater at hente fra vektordatabasen
- **indexing.chunk_size**: Størrelse på kodechunks ved indeksering

## Brug af RAG-serveren

### Start og stop af serveren

```bash
# Start serveren
./mcp_services/rag_server/scripts/start-rag-server-fastapi.sh

# Stop serveren
./mcp_services/rag_server/scripts/stop-rag-server.sh

# Stop alle RAG-servere (hvis flere kører)
./mcp_services/rag_server/scripts/stop-all-rag-servers.sh
```

Dette vil:
1. Aktivere det virtuelle miljø (mcp-venv)
2. Tjekke om Ollama kører
3. Indeksere kodebasen hvis nødvendigt
4. Starte vector search serveren på port 5004
5. Logge output til logs/rag_server.log

### Grundlæggende søgning

Send en POST-forespørgsel til `/search` endpointet:

```bash
curl -X POST http://localhost:5004/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How does authentication work?", "n_results": 3}'
```

### Søgning med kontekst-fil

Du kan begrænse søgningen til en specifik fil:

```bash
curl -X POST http://localhost:5004/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How does this function work?", "n_results": 3, "filepath": "/sti/til/fil.py"}'
```

### Tjek cache-statistik

```bash
curl -X GET http://localhost:5004/cache/stats
```

### Sundhedstjek

```bash
curl -X GET http://localhost:5004/health
```

### Test RAG-pipelinen

```bash
source mcp-venv/bin/activate
python test-rag-pipeline.py "dit spørgsmål her"
```

### Mål ydeevne

```bash
source mcp-venv/bin/activate
python test-rag-performance.py
```

## API-dokumentation

### Endpoints

| Endpoint | Metode | Beskrivelse | Parametre |
|----------|--------|-------------|-----------|
| `/search` | POST | Udfør vektorsøgning | `query`: Søgeforespørgsel<br>`n_results`: Antal resultater (standard: 10)<br>`filepath`: Valgfri sti til kontekst-fil |
| `/cache/stats` | GET | Hent cache-statistik | Ingen |
| `/health` | GET | Tjek server-status | Ingen |

### Søge-endpoint detaljer

**Forespørgsel**:
```json
{
  "query": "How does authentication work?",
  "n_results": 3,
  "filepath": "/valgfri/sti/til/fil.py"
}
```

**Svar**:
```json
{
  "results": [
    {
      "chunk": "def authenticate(username, password):\n    ...",
      "metadata": {
        "file_path": "/sti/til/auth.py",
        "chunk_id": "/sti/til/auth.py:10:1",
        "type": "function",
        "name": "authenticate"
      },
      "distance": 0.123
    },
    ...
  ],
  "total_found": 10,
  "query": "How does authentication work?",
  "context_file": "/valgfri/sti/til/fil.py"
}
```

### Cache-statistik endpoint

**Svar**:
```json
{
  "size": 42,
  "max_size": 100,
  "threshold": 0.85,
  "total_queries": 100,
  "hit_rate": 0.65
}
```

## Optimeringsstrategier

RAG-serveren implementerer flere optimeringsstrategier:

### 1. Proximity Cache

Proximity Cache reducerer latenstid for lignende forespørgsler ved at:
- Normalisere vektorer for effektiv sammenligning
- Beregne kosinus-lighed mellem forespørgsler
- Returnere cachede resultater når ligheden overstiger tærsklen (standard: 0.85)
- Vedligeholde en LRU (Least Recently Used) cache-strategi

**Fordele**:
- 40-60% reduktion i latenstid for gentagne eller lignende forespørgsler
- Reduceret belastning på embedding-modellen og vektordatabasen

### 2. Semantisk Chunking

Intelligent opdeling af dokumenter baseret på semantisk indhold:
- AST-baseret chunking for Python-filer (funktioner og klasser)
- Fallback til token-baseret chunking for andre filtyper
- Bevarelse af kontekst og metadata for hvert chunk

**Fordele**:
- Mere meningsfulde og sammenhængende chunks
- Bedre søgeresultater med relevant kontekst
- Reduceret støj i søgeresultater

### 3. FastAPI og Asynkron Håndtering

Højtydende API med asynkron håndtering af forespørgsler:
- Asynkron håndtering af forespørgsler
- Effektiv ressourceudnyttelse
- Skalerbar arkitektur

**Fordele**:
- 50-100% forbedring i gennemstrømning under belastning
- Bedre håndtering af samtidige forespørgsler

### 4. GPU-acceleration

Automatisk brug af GPU til embedding-generering:
- Automatisk detektion af GPU
- Fallback til CPU hvis GPU ikke er tilgængelig
- Optimeret batch-størrelse for bedre GPU-udnyttelse

**Fordele**:
- 5-10x hurtigere embedding-generering (hvis GPU er tilgængelig)
- Reduceret latenstid for søgninger

### 5. Effektiv kontekstopbygning

Optimeret kontekstopbygning for LLM-inferens:
- Intelligent filtrering af irrelevant information
- Formatering af kontekst for bedre LLM-forståelse
- Begrænsning af kontekststørrelse for hurtigere inferens

**Fordele**:
- Hurtigere LLM-svar
- Mere relevante svar
- Reduceret token-forbrug

## Fejlfinding

### Almindelige problemer og løsninger

#### Serveren starter ikke

**Problem**: Serveren kan ikke starte, og du ser fejlen "Address already in use".

**Løsning**:
```bash
# Find og dræb processen der bruger porten
lsof -i :5004
kill -9 <PID>

# Eller brug stop-all-rag-servers.sh scriptet
./mcp_services/rag_server/scripts/stop-all-rag-servers.sh
```

#### Embedding-model kan ikke indlæses

**Problem**: Fejl ved indlæsning af embedding-modellen.

**Løsning**:
- Tjek internetforbindelse (modellen downloades første gang)
- Tjek om der er nok diskplads
- Prøv at rydde cache: `rm -rf ~/.cache/torch/sentence_transformers`

#### Tom eller manglende vektordatabase

**Problem**: Søgninger returnerer ingen resultater.

**Løsning**:
- Kør indekseringsværktøjet igen:
  ```bash
  python mcp_services/rag_server/index_code_chunks.py /sti/til/din/kodebase
  ```
- Tjek om ChromaDB-mappen eksisterer og har indhold

#### Cache fungerer ikke korrekt

**Problem**: Cache-statistik viser lav hit rate.

**Løsning**:
- Tjek similarity threshold i `config.py` (prøv at sænke værdien)
- Tjek om forespørgslerne er tilstrækkeligt ens
- Ryd cache ved at genstarte serveren

#### Langsom responstid

**Problem**: Systemet svarer langsomt på forespørgsler.

**Løsning**:
- Tjek `logs/rag_server.log` for eventuelle fejl
- Sørg for at Ollama kører optimalt
- Overvej at bruge en mindre LLM-model
- Tjek om GPU-acceleration er aktiveret (hvis tilgængelig)

### Logfiler

Logfiler gemmes i `logs/rag_server.log` og indeholder detaljerede oplysninger om:
- Server-opstart og -nedlukning
- Søgeforespørgsler og -resultater
- Cache-hits og -misses
- Fejl og advarsler

## Bidrag til udvikling

### Udviklingsmiljø

1. Klon repositoriet:
   ```bash
   git clone <repository-url>
   ```

2. Opret og aktiver et virtuelt miljø:
   ```bash
   python -m venv mcp-venv
   source mcp-venv/bin/activate
   ```

3. Installer udviklingsafhængigheder:
   ```bash
   pip install -r mcp_services/rag_server/requirements-dev.txt
   ```

### Kodestruktur

```
mcp_services/rag_server/
├── config.py                  # Konfigurationsindstillinger
├── vector_search_server_fastapi.py  # FastAPI-server
├── proximity_cache.py         # Cache-implementering
├── index_code_chunks.py       # Indekseringsværktøj
├── semantic_chunking.py       # Chunking-strategier
├── rank_chunks.py             # Reranking-funktionalitet
├── scripts/                   # Start- og stop-scripts
│   ├── start-rag-server-fastapi.sh
│   ├── stop-rag-server.sh
│   └── stop-all-rag-servers.sh
├── docs/                      # Dokumentation
│   ├── README-RAG.md
│   └── rag-optimization-plan.md
└── tests/                     # Testfiler
    └── test_proximity_cache.py
```

### Fremtidige udviklingsplaner

Se `mcp_services/rag_server/docs/rag-optimization-plan.md` for detaljer om planlagte forbedringer, herunder:
- Skift til FAISS for hurtigere vektorsøgning
- Mikrotjeneste-arkitektur for bedre skalerbarhed
- Forbedret reranking med cross-encoders

## Afhængigheder

- sentence-transformers>=4.0.0
- chromadb>=0.4.0
- fastapi>=0.100.0
- uvicorn>=0.22.0
- pyyaml>=6.0
- requests>=2.0.0
- numpy
- scikit-learn
- torch>=2.0.0
- python-dotenv>=1.0.0

## Ollama-optimering

For optimal ydeevne med Ollama på M1 Mac:

1. Sørg for at bruge den nyeste version af Ollama
2. Luk andre ressourcekrævende applikationer
3. Brug streaming-mode for hurtigere brugeroplevelse
4. Overvej at bruge en kvantiseret model hvis llama3.1:8b er for langsom
5. Optimér Ollama-parametre:
   - Reducer `num_ctx` for hurtigere inferens
   - Juster `num_thread` til 4 for M1 Mac
   - Sæt `temperature` lavt (0.1) for mere deterministiske svar

---

Udviklet af LearningLab-teamet