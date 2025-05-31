# Trae AI Optimeringer - Implementeringsguide

Dette dokument beskriver de avancerede AI-optimeringer implementeret i LearningLab for at matche og overgå Cursor's funktionalitet.

## Oversigt over implementerede optimeringer

### ✅ Implementerede features

#### 1. RAG System (Retrieval-Augmented Generation)
- **ChromaDB integration** for vektor-baseret kodesøgning
- **Intelligent chunking** af kode med metadata
- **Ranking system** baseret på:
  - Semantisk relevans
  - Fælles imports
  - Fil-afstand
  - Recency score

#### 2. Persistent Hukommelse
- **Samtalehistorik** gemt i struktureret format
- **Intent detection** baseret på nøgleord og mønstre
- **Template system** for forskellige opgavetyper
- **Summarization endpoint** for ældre samtaler

#### 3. Modulær Promptarkitektur
- **5 prompt templates**:
  - `unit-test.md` - Generering af tests
  - `bugfix.md` - Fejlrettelser
  - `refactor.md` - Kode refaktorering
  - `new-feature.md` - Nye features
  - `documentation.md` - Dokumentation
- **Template filling** med parametre
- **Agent prompt** for workflow

#### 4. Code Lens Server
- **Kontekstuel analyse** af kode
- **Intelligente forslag** baseret på kodetype
- **Fil-niveau analyse** med kompleksitetsscore
- **Action mapping** til intent system

#### 5. Automatiseret Pipeline
- **Git pre-commit hook** for auto-indeksering
- **Enhanced metadata** i chunks
- **Diff generation** med preview
- **Standardiserede AI commits**

## Installation og opsætning

### 1. Installer Python dependencies

```bash
pip install chromadb sentence-transformers flask
```

### 2. Initialiser ChromaDB

Kør indekseringsskriptet for at bygge den initiale database:

```bash
python3 index_code_chunks.py
```

### 3. Start MCP servere

Serverne kan startes individuelt eller via Trae's MCP manager:

```bash
# Start alle servere
python3 scripts/prompt_history_server.py &  # Port 5007
python3 scripts/vector_search_server.py &   # Port 5004
python3 scripts/code_lens_server.py &       # Port 5008

# Eller brug Trae's MCP tab
```

### 4. Konfigurer Git hooks

Hook'en er allerede oprettet og gjort eksekverbar:
- `.git/hooks/pre-commit` - Auto-indekserer ved hver commit

## Brug af optimeringerne

### RAG Søgning

```bash
# Søg efter relevante code chunks
curl -X POST http://localhost:5004/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication middleware",
    "filepath": "apps/api/src/auth/auth.guard.ts",
    "n_results": 10
  }'
```

### Intent Detection

```bash
# Detekter intent fra bruger prompt
curl -X POST http://localhost:5007/detect-intent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Skriv unit tests for login funktionen"}'
```

### Template System

```bash
# Hent template
curl http://localhost:5007/get-template?intent=unit-test

# Udfyld template
curl -X POST http://localhost:5007/fill-template \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "unit-test",
    "parameters": {
      "function_name": "loginUser",
      "filepath": "auth.service.ts"
    }
  }'
```

### Code Lens

```bash
# Analyser kode linje
curl -X POST http://localhost:5008/code-lens \
  -H "Content-Type: application/json" \
  -d '{
    "filepath": "apps/api/src/auth/auth.service.ts",
    "line": 42
  }'
```

## Agent Workflow

ProjektLL agenten følger dette workflow:

1. **Intent Detection** → Identificer brugerens hensigt
2. **RAG Search** → Find relevant kode kontekst
3. **Template Selection** → Vælg passende template
4. **Parameter Extraction** → Udtræk nødvendige værdier
5. **Solution Generation** → Generer løsning baseret på template
6. **Validation** → Verificer løsningen
7. **History Storage** → Gem i persistent hukommelse
8. **Diff Generation** → Vis ændringer før anvendelse

## Avancerede features

### Ranking Algorithm

Ranking funktionen i `rank_chunks.py` bruger vægtede scores:
- **Semantisk relevans**: 40%
- **Import overlap**: 25%
- **Fil afstand**: 20%
- **Recency**: 15%

### Smart Chunking

Indekseringssystemet bruger:
- AST parsing for Python filer
- Regex patterns for JS/TS filer
- Intelligent metadata extraction
- Chunk size optimization (50-1500 chars)

### Commit Standards

AI commits følger formatet:
```
AI: <type>(<scope>): <description>

<optional body>

Co-authored-by: ProjektLL <ai@learninglab.dk>
```

## Performance tips

1. **Indekser regelmæssigt**: Kør `index_code_chunks.py` efter større ændringer
2. **Begræns søgeområde**: Brug `filepath` parameter for bedre ranking
3. **Cache resultater**: Gem hyppigt brugte søgninger
4. **Optimer chunk størrelse**: Juster i `smart_chunk_file()`

## Fejlfinding

### ChromaDB fejl
```bash
# Slet og genopbyg database
rm -rf chroma_db/
python3 index_code_chunks.py
```

### Server fejl
```bash
# Check logs
tail -f prompt_history/history.log

# Genstart servere
pkill -f prompt_history_server.py
pkill -f vector_search_server.py
pkill -f code_lens_server.py
```

## Fremtidige forbedringer

1. **LLM Integration** for bedre summarization
2. **Cloud hosting** af ChromaDB
3. **Real-time indeksering** med file watchers
4. **UI integration** i Trae editor
5. **Multi-bruger support**
6. **Advanced caching** strategier

## Konklusion

Med disse optimeringer har LearningLab nu:
- ✅ Intelligent kodesøgning med RAG
- ✅ Persistent hukommelse på tværs af sessioner
- ✅ Modulær og genanvendelig promptarkitektur
- ✅ Kontekstuelle kodeforslag
- ✅ Automatiseret workflow med Git integration

Dette giver en AI-assistent oplevelse der matcher og i nogle tilfælde overgår Cursor's funktionalitet, samtidig med at det forbliver open source og gratis.