# RAG-implementering til kodebase

Dette er en RAG-implementering (Retrieval Augmented Generation), der kan bruges til at besvare spørgsmål om din kodebase ved hjælp af vector search og LLM.

## Indhold

- `rag_server/` - Mappe med Python-scripts til RAG-implementeringen
  - `index_code_chunks.py` - Script til at indeksere kode i ChromaDB
  - `vector_search_server.py` - Flask-server til vektor-søgning
  - `rank_chunks.py` - Algoritme til at rangere søgeresultater
  - `query_classifier.py` - Klassificerer forespørgsler
  - `benchmark.py` - Værktøj til at benchmarke RAG-systemet
  - `config.yaml` - Konfigurationsfil til RAG-systemet
- `start-rag-server.sh` - Script til at starte vector search serveren
- `stop-all-rag-servers.sh` - Script til at stoppe serveren
- `test-rag-pipeline.py` - Script til at teste RAG-pipelinen

## Installation

1. Opret et Python virtual environment (anbefalet):
   ```bash
   python -m venv venv
   source venv/bin/activate  # På Windows: venv\Scripts\activate
   ```

2. Installer de nødvendige afhængigheder:
   ```bash
   pip install sentence-transformers chromadb flask pyyaml
   ```

3. Installer Ollama fra [ollama.ai](https://ollama.ai) og download en model:
   ```bash
   ollama pull llama3.1:8b
   ```

## Brug

1. Start vector search serveren:
   ```bash
   ./start-rag-server.sh
   ```

2. Test RAG-pipelinen med et spørgsmål:
   ```bash
   python test-rag-pipeline.py "Hvordan indekserer jeg kode i ChromaDB?"
   ```

3. Stop serveren når du er færdig:
   ```bash
   ./stop-all-rag-servers.sh
   ```

## Konfiguration

Du kan tilpasse RAG-systemet ved at redigere `rag_server/config.yaml`. Her kan du ændre:
- Embedding-model
- LLM-model og parametre
- Indekseringsparametre
- Søgeparametre

## Tilpasning

Hvis du vil tilpasse prompten, der sendes til LLM, kan du redigere `test-rag-pipeline.py` og ændre `full_prompt` variablen i `generate_with_ollama` funktionen.