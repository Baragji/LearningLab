# Optimeret RAG Server

Dette er en optimeret implementering af Retrieval-Augmented Generation (RAG) til LearningLab projektet. Systemet bruger ChromaDB til vektoropslag og Ollama til LLM-inferens.

## Komponenter

- **vector_search_server.py**: Flask-server til vektorsøgning (port 5004)
- **index_code_chunks.py**: Script til at indeksere kode
- **rank_chunks.py**: Algoritme til at rangere søgeresultater
- **query_classifier.py**: Klassificerer forespørgsler
- **benchmark.py**: Værktøj til at benchmarke systemet
- **config.yaml**: Konfigurationsfil

## Optimeret for ydeevne

Denne implementering er optimeret for hurtig responstid, især på M1 Mac:

1. **Streaming Responses**: Implementerer streaming for hurtigere brugeroplevelse
2. **Optimerede Ollama-parametre**: Konfigureret for hurtigere inferens på M1 Mac
3. **Effektiv kontekstopbygning**: Reducerer mængden af kontekst for hurtigere LLM-svar
4. **Optimeret vektorsøgning**: Hurtigere embedding og søgning
5. **Forbedret chunking**: Mindre chunks med mindre overlap for hurtigere indeksering

## Brug

### Start serveren

```bash
./start-rag-server.sh
```

Dette vil:
1. Aktivere det virtuelle miljø (mcp-venv)
2. Tjekke om Ollama kører
3. Indeksere kodebasen hvis nødvendigt
4. Starte vector search serveren på port 5004
5. Logge output til logs/rag_server.log

### Stop serveren

```bash
./stop-all-rag-servers.sh
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

## Konfiguration

Alle indstillinger kan justeres i `config.yaml`. Vigtige indstillinger inkluderer:

- **llm.temperature**: Lavere værdi (0.1) giver mere deterministiske svar
- **llm.num_thread**: Optimeret til 4 for M1 Mac
- **llm.num_ctx**: Reduceret kontekstvindue for hurtigere inferens
- **retrieval.top_k**: Antal resultater at hente fra vektordatabasen
- **indexing.chunk_size**: Størrelse på kodechunks ved indeksering

## Fejlfinding

- **Langsom responstid**: Tjek `logs/rag_server.log` for eventuelle fejl
- **Serveren starter ikke**: Sørg for at Ollama kører og at alle afhængigheder er installeret
- **Dårlige søgeresultater**: Prøv at genindeksere kodebasen med `python mcp_services/rag_server/index_code_chunks.py`

## Afhængigheder

- sentence-transformers>=4.0.0
- chromadb>=0.4.0
- flask>=2.0.0
- pyyaml>=6.0
- requests>=2.0.0
- numpy
- scikit-learn

## Ollama-optimering

For optimal ydeevne med Ollama på M1 Mac:

1. Sørg for at bruge den nyeste version af Ollama
2. Luk andre ressourcekrævende applikationer
3. Brug streaming-mode for hurtigere brugeroplevelse
4. Overvej at bruge en kvantiseret model hvis llama3.1:8b er for langsom