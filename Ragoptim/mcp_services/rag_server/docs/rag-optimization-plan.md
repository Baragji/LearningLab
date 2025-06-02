# RAG Optimeringsplan: Trin-for-trin guide

Dette dokument indeholder en detaljeret plan for at optimere RAG-implementeringen i LearningLab-projektet. Planen er baseret på forskningsvaliderede teknikker og er designet til at give betydelige ydeevneforbedringer.

## Fase 1: Grundlæggende optimering (allerede implementeret)

- [x] Streaming-implementering for Ollama
- [x] Optimerede Ollama-parametre (temperatur, kontekstvindue, thread-count)
- [x] Prompt-optimering
- [x] Optimering af vector search
- [x] Forbedret server-håndtering

## Fase 2: Avanceret optimering

### Trin 1: Implementer Approximate Caching (Proximity) ✅

**Formål:** Reducere latenstid ved at genbruge tidligere søgeresultater for lignende forespørgsler.

**Status:** ✅ Implementeret

**Implementeringsdetaljer:**

1. Oprettet en ny fil `proximity_cache.py` med følgende funktionalitet:
   - Caching af søgeresultater baseret på kosinus-lighed mellem forespørgsler
   - Konfigurerbar tærskel for lighed (default: 0.8)
   - Konfigurerbar maksimal cache-størrelse (default: 100)
   - Automatisk fjernelse af ældste cache-indgange når maksimal størrelse nås

2. Integreret cachen i `vector_search_server_fastapi.py`:
   - Cache tjekkes før normal vektorsøgning
   - Resultater gemmes i cachen efter hver søgning
   - Statistik om cache-brug logges

3. Tilføjet en ny endpoint `/cache/stats` til at vise cache-statistik:
   - Antal indgange i cachen
   - Maksimal cache-størrelse
   - Tærskel for lighed
   - Hit rate

**Forventet ydeevneforbedring:** 40-60% reduktion i latenstid for gentagne eller lignende forespørgsler.

### Trin 2: Optimér chunking-strategien ✅

**Formål:** Forbedre relevansen af søgeresultater og reducere antallet af chunks.

**Status:** ✅ Implementeret

**Implementeringsdetaljer:**

1. Oprettet en separat `semantic_chunking.py` modul med følgende funktionalitet:
   - Semantisk opdeling af tekst baseret på embeddings-lighed mellem linjer
   - GPU-acceleration hvis tilgængelig
   - Konfigurerbare parametre for minimum og maksimum chunk-størrelse
   - Automatisk normalisering af embeddings for præcis lighed

2. Integreret semantisk chunking i `index_code_chunks.py`:
   - Erstattet den tidligere chunking-logik med semantisk chunking
   - Optimeret parametre (min_size=300, max_size=600) for bedre balance mellem kontekst og præcision

**Forventet ydeevneforbedring:** 20-30% reduktion i antallet af chunks og forbedret relevans af søgeresultater.

### Trin 3: Skift til FastAPI for bedre ydeevne ✅

**Formål:** Forbedre serverens gennemstrømning og håndtering af samtidige forespørgsler.

**Status:** ✅ Implementeret

**Implementeringsdetaljer:**

1. Oprettet en ny `vector_search_server_fastapi.py` med følgende forbedringer:
   - Skiftet fra Flask til FastAPI for bedre ydeevne
   - Implementeret asynkrone endpoints for bedre håndtering af samtidige forespørgsler
   - Tilføjet Pydantic-modeller for validering af input
   - Forbedret fejlhåndtering med strukturerede HTTP-fejlkoder

2. Oprettet et nyt startscript `start-rag-server-fastapi.sh` med følgende optimering:
   - Konfigureret Uvicorn med flere worker-processer (4)
   - Automatisk installation af nødvendige afhængigheder
   - Forbedret logning og fejlhåndtering
   - Automatisk rydning af Python-cache for at sikre friske imports

**Forventet ydeevneforbedring:** 50-100% forbedring i gennemstrømning under belastning.

### Trin 4: Implementer GPU-acceleration (hvis tilgængelig) ✅

**Formål:** Accelerer embedding-generering og reranking ved hjælp af GPU.

**Status:** ✅ Implementeret

**Implementeringsdetaljer:**

1. Tilføjet GPU-detektion og -support i alle relevante komponenter:
   - `vector_search_server_fastapi.py` bruger GPU til embedding-generering hvis tilgængelig
   - `semantic_chunking.py` bruger GPU til at beregne embeddings for chunking
   - `index_code_chunks.py` bruger GPU til at generere embeddings under indeksering

2. Implementeret automatisk fallback til CPU hvis GPU ikke er tilgængelig:
   ```python
   device = "cuda" if torch.cuda.is_available() else "cpu"
   print(f"🖥️ Bruger {device} til embedding-generering")
   ```

3. Optimeret batch-størrelse for bedre GPU-udnyttelse:
   - Større batch-størrelse (32) for chunking
   - Tilpasset batch-størrelse for embedding-generering

**Forventet ydeevneforbedring:** 5-10x hurtigere embedding-generering og reranking (hvis GPU er tilgængelig).

## Fase 3: Avancerede optimeringer (fremtidige trin)

### Trin 5: Skift til FAISS for hurtigere vektorsøgning

**Formål:** Forbedre søgehastigheden ved at bruge FAISS i stedet for ChromaDB.

**Implementering:**

1. Installer FAISS:
   ```bash
   pip install faiss-cpu  # eller faiss-gpu hvis GPU er tilgængelig
   ```

2. Eksporter embeddings fra ChromaDB til FAISS:
   ```python
   import faiss
   import numpy as np
   import json
   import os
   
   def export_chroma_to_faiss(chroma_dir, output_dir):
       """
       Eksporter embeddings fra ChromaDB til FAISS.
       
       Args:
           chroma_dir: Sti til ChromaDB-mappen
           output_dir: Sti til output-mappen
       """
       # Initialiser ChromaDB
       client = chromadb.Client()
       collection = client.get_collection("code_chunks", persist_directory=chroma_dir)
       
       # Hent alle embeddings
       results = collection.get(include=["embeddings", "documents", "metadatas"])
       
       embeddings = results["embeddings"]
       documents = results["documents"]
       metadatas = results["metadatas"]
       
       # Konverter embeddings til numpy array
       embeddings_np = np.array(embeddings).astype('float32')
       
       # Opret FAISS-index
       dimension = embeddings_np.shape[1]
       index = faiss.IndexFlatIP(dimension)  # Indre produkt for kosinus-lighed
       
       # Tilføj embeddings til index
       index.add(embeddings_np)
       
       # Gem index
       os.makedirs(output_dir, exist_ok=True)
       faiss.write_index(index, os.path.join(output_dir, "faiss_index.bin"))
       
       # Gem metadata og dokumenter
       with open(os.path.join(output_dir, "metadata.json"), "w") as f:
           json.dump({"documents": documents, "metadatas": metadatas}, f)
       
       print(f"✅ Eksporteret {len(embeddings)} embeddings til FAISS-index")
   ```

3. Opdater `vector_search_server.py` til at bruge FAISS:
   ```python
   import faiss
   import json
   
   # Indlæs FAISS-index
   index = faiss.read_index("faiss_index.bin")
   
   # Indlæs metadata og dokumenter
   with open("metadata.json", "r") as f:
       metadata_store = json.load(f)
   
   @app.post("/search")
   async def search(request: SearchRequest):
       # ... eksisterende kode ...
       
       # Lav embedding for forespørgslen
       query_embedding = model.encode(query_text, batch_size=1, show_progress_bar=False)
       
       # Tjek cache først
       # ... eksisterende kode ...
       
       # Hvis ikke i cache, søg med FAISS
       query_embedding_np = np.array([query_embedding]).astype('float32')
       distances, indices = index.search(query_embedding_np, n_results * 2)
       
       # Konverter resultater til samme format som ChromaDB
       results = []
       for i, idx in enumerate(indices[0]):
           if idx < 0 or idx >= len(metadata_store["documents"]):
               continue
           
           results.append({
               "chunk": metadata_store["documents"][idx],
               "metadata": metadata_store["metadatas"][idx],
               "distance": float(distances[0][i])
           })
       
       # ... resten af koden ...
   ```

### Trin 6: Implementer mikrotjeneste-arkitektur

**Formål:** Forbedre skalerbarhed og fejltolerance ved at opdele systemet i mindre, specialiserede tjenester.

**Implementering:**

Dette trin kræver en mere omfattende omstrukturering og vil blive beskrevet i en separat plan, hvis de tidligere optimeringer ikke giver tilstrækkelig ydeevneforbedring.

## Testplan

For hver optimering bør følgende tests udføres:

1. **Ydeevnetest**:
   ```bash
   python test-rag-performance.py
   ```

2. **Funktionalitetstest**:
   ```bash
   python test-rag-pipeline.py "hvordan fungerer authentication?"
   ```

3. **Belastningstest** (valgfri):
   ```bash
   # Installer k6
   brew install k6
   
   # Opret en k6-testfil
   cat > load-test.js << EOF
   import http from 'k6/http';
   import { sleep } from 'k6';
   
   export default function () {
     const payload = JSON.stringify({
       query: 'hvordan fungerer authentication?',
       n_results: 3
     });
     
     const params = {
       headers: {
         'Content-Type': 'application/json',
       },
     };
     
     http.post('http://localhost:5004/search', payload, params);
     sleep(1);
   }
   EOF
   
   # Kør belastningstest
   k6 run --vus 10 --duration 30s load-test.js
   ```

## Forventede resultater

Ved implementering af alle optimeringer i Fase 2 forventes følgende forbedringer:

1. **Approximate Caching**: 40-60% reduktion i latenstid for gentagne eller lignende forespørgsler.
2. **Semantisk chunking**: 20-30% reduktion i antallet af chunks og forbedret relevans af søgeresultater.
3. **FastAPI**: 50-100% forbedring i gennemstrømning under belastning.
4. **GPU-acceleration**: 5-10x hurtigere embedding-generering og reranking (hvis GPU er tilgængelig).

Ved implementering af alle optimeringer i Fase 3 forventes yderligere forbedringer:

1. **FAISS**: 2-4x hurtigere vektorsøgning sammenlignet med ChromaDB.
2. **Mikrotjeneste-arkitektur**: Forbedret skalerbarhed og fejltolerance.

## Status og konklusion

### Aktuel status

- **Fase 1: Grundlæggende optimering** ✅ Fuldt implementeret
- **Fase 2: Avanceret optimering** ✅ Fuldt implementeret
  - Trin 1: Approximate Caching (Proximity) ✅
  - Trin 2: Optimeret chunking-strategi ✅
  - Trin 3: Skift til FastAPI ✅
  - Trin 4: GPU-acceleration ✅
- **Fase 3: Avancerede optimeringer** ⏳ Planlagt til fremtidig implementering
  - Trin 5: Skift til FAISS ⏳
  - Trin 6: Mikrotjeneste-arkitektur ⏳

### Næste skridt

Alle planlagte optimeringer i Fase 1 og Fase 2 er nu implementeret. Baseret på ydeevnetests og brugerfeedback kan vi vurdere, om det er nødvendigt at implementere de mere avancerede optimeringer i Fase 3.

Før vi går videre med Fase 3, anbefales det at:

1. Udføre grundige ydeevnetests for at måle forbedringerne fra Fase 2
2. Indsamle brugerfeedback om systemets responsivitet og relevans
3. Identificere eventuelle flaskehalse, der stadig eksisterer

Hvis ydeevnen stadig ikke er tilfredsstillende efter Fase 2, kan vi begynde at implementere FAISS for hurtigere vektorsøgning som det næste skridt.