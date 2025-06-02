# Optimeret RAG-implementering for LearningLab

Dette dokument beskriver den optimerede RAG-implementering (Retrieval-Augmented Generation) for LearningLab-projektet, som erstatter den tidligere `rag-docs-ollama`-implementering.

## Oversigt

Den nye RAG-implementering bruger en optimeret arkitektur med følgende komponenter:

1. **ChromaDB** som vektordatabase for effektiv semantisk søgning
2. **Sentence Transformers** til embedding-generering
3. **Optimeret chunking-strategi** for bedre relevans og ydeevne
4. **Proximity caching** for hurtigere responstider ved lignende forespørgsler
5. **FastAPI** for bedre ydeevne og skalerbarhed
6. **Streaming-respons** fra Ollama LLM for øjeblikkelig feedback

## Fordele ved den nye implementering

- **Hurtigere responstid**: Reduceret fra ~5 minutter til 30-50 sekunder
- **Øjeblikkelig feedback**: Streaming-implementering giver brugeren feedback med det samme
- **Bedre relevans**: Optimeret chunking og søgestrategi giver mere relevante resultater
- **Mere robust**: Forbedret fejlhåndtering og server-håndtering
- **Lettere at vedligeholde**: Modulær kodebase med god dokumentation

## Komponenter

- **vector_search_server.py**: FastAPI-server til vektorsøgning (port 5020)
- **index_code_chunks.py**: Script til at indeksere kode
- **rank_chunks.py**: Algoritme til at rangere søgeresultater
- **query_classifier.py**: Klassificerer forespørgsler
- **benchmark.py**: Værktøj til at benchmarke systemet
- **config.yaml**: Konfigurationsfil

## Brug i AI-agenter

Den nye RAG-implementering er tilgængelig for AI-agenter via MCP-værktøjet `rag-server`. Dette værktøj erstatter det tidligere `rag-docs-ollama`-værktøj.

### Eksempel på brug i agent-prompts

```
Brug `rag-server.search_documentation` for at søge i kodebasen og dokumentation:

rag-server.search_documentation({ 
  query: "authentication", 
  n_results: 3,
  filepath: "/apps/api/src/auth/auth.service.ts" // Valgfri parameter for at begrænse søgningen
})
```

### Parametre

- **query** (påkrævet): Søgeforespørgsel
- **n_results** (valgfri): Antal resultater at returnere (standard: 3)
- **filepath** (valgfri): Filsti for at begrænse søgningen til en bestemt fil

## Start og stop af RAG-serveren

### Start serveren

Du kan starte RAG-serveren på to måder:

#### Metode 1: Direkte via Python

```bash
cd /Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab
python3 mcp_services/rag_server/vector_search_server.py
```

#### Metode 2: Via MCP

Brug den optimerede MCP-konfiguration, der automatisk starter RAG-serveren:

```bash
cd /Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab
npx @anthropic-ai/mcp-server --config mcp_services/configs/mcp-config-optimized.json
```

### Stop serveren

For at stoppe serveren, kan du enten:

1. Trykke Ctrl+C hvis du kører den i forgrunden
2. Eller bruge:

```bash
pkill -f "python3 mcp_services/rag_server/vector_search_server.py"
```

## Test af RAG-pipelinen

```bash
source mcp-venv/bin/activate
python test-rag-pipeline.py "dit spørgsmål her"
```

## Ydeevnetest

```bash
source mcp-venv/bin/activate
python test-rag-performance.py
```

## Konfiguration

Alle indstillinger kan justeres i `mcp_services/rag_server/config.yaml`. Vigtige indstillinger inkluderer:

- **llm.temperature**: Lavere værdi (0.1) giver mere deterministiske svar
- **llm.num_thread**: Optimeret til 4 for M1 Mac
- **llm.num_ctx**: Reduceret kontekstvindue for hurtigere inferens
- **retrieval.top_k**: Antal resultater at hente fra vektordatabasen
- **indexing.chunk_size**: Størrelse på kodechunks ved indeksering

## Fremtidige optimeringer

Se `rag-optimization-plan.md` for en detaljeret plan for fremtidige optimeringer, herunder:

1. **Semantisk chunking**: Forbedre relevansen af søgeresultater og reducere antallet af chunks
2. **GPU-acceleration**: Accelerere embedding-generering og reranking ved hjælp af GPU
3. **FAISS-integration**: Forbedre søgehastigheden ved at bruge FAISS i stedet for ChromaDB
4. **Mikrotjeneste-arkitektur**: Forbedre skalerbarhed og fejltolerance