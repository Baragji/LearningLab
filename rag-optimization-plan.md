# RAG Optimeringsplan: Trin-for-trin guide

Dette dokument indeholder en detaljeret plan for at optimere RAG-implementeringen i LearningLab-projektet. Planen er baseret på forskningsvaliderede teknikker og er designet til at give betydelige ydeevneforbedringer.

## Fase 1: Grundlæggende optimering (allerede implementeret)

- [x] Streaming-implementering for Ollama
- [x] Optimerede Ollama-parametre (temperatur, kontekstvindue, thread-count)
- [x] Prompt-optimering
- [x] Optimering af vector search
- [x] Forbedret server-håndtering

## Fase 2: Avanceret optimering (næste trin)

### Trin 1: Implementer Approximate Caching (Proximity)

**Formål:** Reducere latenstid ved at genbruge tidligere søgeresultater for lignende forespørgsler.

**Implementering:**

1. Opret en ny fil `proximity_cache.py` med følgende indhold:
   ```python
   import numpy as np
   from typing import Dict, List, Any, Optional, Tuple
   
   class ProximityCache:
       def __init__(self, threshold: float = 0.8, max_size: int = 100):
           """
           Initialiser en Proximity Cache.
           
           Args:
               threshold: Kosinus-lighedsgrænse for at betragte to forespørgsler som lignende (0.0-1.0)
               max_size: Maksimalt antal forespørgsler at gemme i cachen
           """
           self.threshold = threshold
           self.max_size = max_size
           self.cache: Dict[str, Tuple[np.ndarray, Any]] = {}
       
       def query(self, query_vector: np.ndarray, query_id: Optional[str] = None) -> Optional[Any]:
           """
           Søg i cachen efter lignende forespørgsler.
           
           Args:
               query_vector: Embedding-vektor for forespørgslen
               query_id: Valgfri ID for forespørgslen
               
           Returns:
               Cached resultater hvis en lignende forespørgsel findes, ellers None
           """
           # Normaliser forespørgselsvektor
           query_vector = query_vector / np.linalg.norm(query_vector)
           
           # Søg efter lignende forespørgsler i cachen
           for cache_id, (cached_vector, results) in self.cache.items():
               # Beregn kosinus-lighed
               similarity = np.dot(query_vector, cached_vector)
               
               if similarity >= self.threshold:
                   print(f"Cache hit! Similarity: {similarity:.4f}")
                   return results
           
           return None
       
       def store(self, query_vector: np.ndarray, results: Any, query_id: Optional[str] = None) -> None:
           """
           Gem resultater i cachen.
           
           Args:
               query_vector: Embedding-vektor for forespørgslen
               results: Resultater at gemme
               query_id: Valgfri ID for forespørgslen
           """
           # Normaliser forespørgselsvektor
           query_vector = query_vector / np.linalg.norm(query_vector)
           
           # Generer et ID hvis ikke angivet
           if query_id is None:
               query_id = f"query_{len(self.cache)}"
           
           # Hvis cachen er fuld, fjern den ældste indgang
           if len(self.cache) >= self.max_size:
               oldest_key = next(iter(self.cache))
               del self.cache[oldest_key]
           
           # Gem resultater i cachen
           self.cache[query_id] = (query_vector, results)
   ```

2. Integrer cachen i `vector_search_server.py`:
   ```python
   from proximity_cache import ProximityCache
   
   # Initialiser cache
   proximity_cache = ProximityCache(threshold=0.85, max_size=100)
   
   @app.route("/search", methods=["POST"])
   def search():
       # ... eksisterende kode ...
       
       # Lav embedding for forespørgslen
       query_embedding = embedding_model.encode(query_text, batch_size=1, show_progress_bar=False).tolist()
       
       # Tjek cache først
       cache_results = proximity_cache.query(np.array(query_embedding))
       if cache_results:
           print(f"🔍 Cache hit for query: '{query_text}'")
           return jsonify(cache_results), 200
       
       # Hvis ikke i cache, fortsæt med normal søgning
       # ... eksisterende kode for søgning ...
       
       # Gem resultater i cache
       proximity_cache.store(np.array(query_embedding), response)
       
       return jsonify(response), 200
   ```

3. Tilføj cache-statistik til logfilen:
   ```python
   # I slutningen af search-funktionen
   cache_hit_rate = len([k for k, v in proximity_cache.cache.items()]) / (total_queries + 1)
   print(f"📊 Cache hit rate: {cache_hit_rate:.2f}")
   ```

### Trin 2: Optimér chunking-strategien

**Formål:** Forbedre relevansen af søgeresultater og reducere antallet af chunks.

**Implementering:**

1. Opdater `index_code_chunks.py` med semantisk chunking:
   ```python
   from sentence_transformers import SentenceTransformer
   import numpy as np
   
   def semantic_chunk(text, min_size=200, max_size=500, model=None):
       """
       Opdel tekst i semantisk meningsfulde chunks.
       
       Args:
           text: Tekst at opdele
           min_size: Minimum chunk-størrelse
           max_size: Maksimum chunk-størrelse
           model: SentenceTransformer-model til embedding
           
       Returns:
           Liste af semantisk meningsfulde chunks
       """
       if model is None:
           model = SentenceTransformer("all-MiniLM-L6-v2")
       
       # Del tekst i sætninger eller linjer
       lines = text.split('\n')
       
       # Hvis teksten er kortere end min_size, returner den som en enkelt chunk
       if len(text) < min_size:
           return [text]
       
       chunks = []
       current_chunk = []
       current_size = 0
       
       # Beregn embeddings for hver linje
       line_embeddings = model.encode(lines, batch_size=32, show_progress_bar=False)
       
       # Normaliser embeddings
       line_embeddings = line_embeddings / np.linalg.norm(line_embeddings, axis=1, keepdims=True)
       
       for i, line in enumerate(lines):
           # Hvis linjen er tom, fortsæt
           if not line.strip():
               continue
           
           # Hvis current_chunk er tom, tilføj linjen
           if not current_chunk:
               current_chunk.append(line)
               current_size += len(line)
               continue
           
           # Beregn lighed mellem nuværende linje og sidste linje i current_chunk
           similarity = np.dot(line_embeddings[i], line_embeddings[i-1])
           
           # Hvis ligheden er høj og chunk-størrelsen er under max_size, tilføj til nuværende chunk
           if similarity > 0.7 and current_size + len(line) < max_size:
               current_chunk.append(line)
               current_size += len(line)
           # Ellers start en ny chunk
           else:
               chunks.append('\n'.join(current_chunk))
               current_chunk = [line]
               current_size = len(line)
       
       # Tilføj den sidste chunk
       if current_chunk:
           chunks.append('\n'.join(current_chunk))
       
       return chunks
   ```

2. Integrer semantisk chunking i filindekseringen:
   ```python
   # I extract_chunks_from_file-funktionen
   
   # Erstat den eksisterende chunking-logik med:
   chunks = []
   with open(filepath, "r", encoding="utf-8") as f:
       source = f.read()
   
   # Brug semantisk chunking
   semantic_chunks = semantic_chunk(source, min_size=300, max_size=600)
   
   for i, chunk_text in enumerate(semantic_chunks):
       chunks.append({
           "text": chunk_text,
           "filepath": filepath,
           "chunk_id": f"{filepath}:{i}"
       })
   
   return chunks
   ```

### Trin 3: Skift til FastAPI for bedre ydeevne

**Formål:** Forbedre serverens gennemstrømning og håndtering af samtidige forespørgsler.

**Implementering:**

1. Installer FastAPI og Uvicorn:
   ```bash
   pip install fastapi uvicorn
   ```

2. Omskriv `vector_search_server.py` til FastAPI:
   ```python
   from fastapi import FastAPI, HTTPException, Request
   from fastapi.responses import JSONResponse
   from pydantic import BaseModel
   import uvicorn
   from sentence_transformers import SentenceTransformer
   import chromadb
   import yaml
   import logging
   import numpy as np
   from datetime import datetime
   from proximity_cache import ProximityCache
   
   # Indlæs konfiguration
   with open("config.yaml", "r") as f:
       config = yaml.safe_load(f)
   
   # Opsæt logging
   logging.basicConfig(
       filename=config["logging"]["file_path"],
       level=getattr(logging, config["logging"]["level"]),
       format=config["logging"]["format"],
   )
   
   # Initialiser cache
   proximity_cache = ProximityCache(threshold=0.85, max_size=100)
   
   # Initialiser ChromaDB
   client = chromadb.Client()
   collection = client.get_collection("code_chunks", persist_directory=config["database"]["chroma_db_dir"])
   
   # Indlæs embedder
   model = SentenceTransformer("all-MiniLM-L6-v2")
   
   app = FastAPI()
   
   class SearchRequest(BaseModel):
       query: str
       n_results: int = 10
       filepath: str = ""
   
   @app.get("/health")
   async def health():
       return {"status": "OK"}
   
   @app.post("/search")
   async def search(request: SearchRequest):
       try:
           query_text = request.query.strip()
           n_results = request.n_results
           filepath = request.filepath.strip()
   
           if not query_text:
               raise HTTPException(status_code=400, detail="Parameter 'query' kan ikke være tom.")
   
           # Lav embedding for forespørgslen
           start_time = datetime.now()
           query_embedding = model.encode(query_text, batch_size=1, show_progress_bar=False).tolist()
           
           # Tjek cache først
           cache_results = proximity_cache.query(np.array(query_embedding))
           if cache_results:
               print(f"🔍 Cache hit for query: '{query_text}'")
               return cache_results
           
           # Hvis ikke i cache, fortsæt med normal søgning
           candidates = collection.query(
               query_embeddings=[query_embedding],
               n_results=min(n_results * 2, 30),
               include=["documents", "metadatas", "distances"],
           )
   
           raw_docs = candidates.get("documents", [[]])[0]
           raw_metas = candidates.get("metadatas", [[]])[0]
           raw_distances = candidates.get("distances", [[]])[0]
   
           total_found = len(raw_docs)
   
           # Brug list comprehension i stedet for for-loop
           combined = [
               {"chunk": doc_text, "metadata": meta, "distance": dist}
               for doc_text, meta, dist in zip(raw_docs, raw_metas, raw_distances)
           ]
   
           # Hvis der er angivet en filepath, rangér med rank_chunks
           if filepath:
               combined = rank_chunks(combined, filepath)
   
           # Tag kun top n_results
           results = combined[:n_results]
           
           # Fjern unødvendig metadata
           for result in results:
               if "metadata" in result:
                   meta = result["metadata"]
                   result["metadata"] = {
                       "file_path": meta.get("file_path", ""),
                       "chunk_id": meta.get("chunk_id", ""),
                       "type": meta.get("type", ""),
                       "name": meta.get("name", ""),
                   }
   
           # Log performance
           end_time = datetime.now()
           search_time = (end_time - start_time).total_seconds()
           print(f"🔍 Søgning udført på {search_time:.3f} sekunder, fandt {total_found} resultater")
   
           response = {
               "results": results,
               "total_found": total_found,
               "query": query_text,
               "context_file": filepath,
           }
           
           # Gem resultater i cache
           proximity_cache.store(np.array(query_embedding), response)
           
           return response
   
       except Exception as e:
           print(f"❌ Fejl under /search: {e}")
           raise HTTPException(status_code=500, detail=str(e))
   
   if __name__ == "__main__":
       uvicorn.run(app, host=config["server"]["host"], port=config["server"]["port"])
   ```

3. Opdater `start-rag-server.sh` til at bruge Uvicorn:
   ```bash
   #!/bin/bash

   # Change to the project directory
   cd "$(dirname "$0")"

   # Activate the virtual environment if it exists
   if [ -d "mcp-venv" ]; then
       source mcp-venv/bin/activate
   elif [ -d "venv" ]; then
       source venv/bin/activate
   elif [ -d "../venv" ]; then
       source ../venv/bin/activate
   fi

   # Optimering: Ryd Python cache for at sikre friske imports
   find mcp_services/rag_server -name "__pycache__" -type d -exec rm -rf {} +

   # Tjek om Ollama kører
   if ! curl -s http://localhost:11434/api/tags >/dev/null; then
       echo "⚠️ Advarsel: Ollama ser ikke ud til at køre på http://localhost:11434"
       echo "Start Ollama før du fortsætter for optimal ydeevne."
       read -p "Tryk Enter for at fortsætte alligevel, eller Ctrl+C for at afbryde..."
   fi

   # Run the indexing script if needed
   if [ ! -d "chroma_db" ] || [ -z "$(ls -A chroma_db 2>/dev/null)" ]; then
       echo "ChromaDB directory is empty or doesn't exist. Running indexing script..."
       python mcp_services/rag_server/index_code_chunks.py
   fi

   # Optimering: Opret log-mappe hvis den ikke findes
   mkdir -p logs

   # Start the vector search server with optimized settings
   echo "🚀 Starter RAG-server med optimerede indstillinger..."
   echo "📝 Log gemmes i logs/rag_server.log"

   # Kør serveren med Uvicorn i baggrunden
   uvicorn mcp_services.rag_server.vector_search_server:app --host 0.0.0.0 --port 5004 --workers 4 > logs/rag_server.log 2>&1 &

   # Gem PID for nem reference
   echo $! > logs/rag_server.pid
   echo "✅ RAG-server startet med PID $(cat logs/rag_server.pid)"
   echo "🌐 Server kører på http://localhost:5004"
   echo "📊 Test serveren med: curl -X POST http://localhost:5004/search -H \"Content-Type: application/json\" -d '{\"query\": \"authentication\", \"n_results\": 3}'"
   echo "🛑 Stop serveren med: ./stop-all-rag-servers.sh"
   ```

### Trin 4: Implementer GPU-acceleration (hvis tilgængelig)

**Formål:** Accelerer embedding-generering og reranking ved hjælp af GPU.

**Implementering:**

1. Tjek om GPU er tilgængelig og brug den til embedding-modellen:
   ```python
   import torch
   
   # I vector_search_server.py
   
   # Tjek om GPU er tilgængelig
   device = "cuda" if torch.cuda.is_available() else "cpu"
   print(f"🖥️ Bruger {device} til embedding-generering")
   
   # Indlæs embedder med GPU-support
   model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
   ```

2. Opdater reranking-funktionen til at bruge GPU:
   ```python
   # I rank_chunks.py
   
   class CrossEncoderReranker:
       def __init__(self, model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"):
           self.device = "cuda" if torch.cuda.is_available() else "cpu"
           self.tokenizer = AutoTokenizer.from_pretrained(model_name)
           self.model = AutoModelForSequenceClassification.from_pretrained(model_name).to(self.device).eval()
   
       def rerank(self, query: str, chunks: List[str]):
           inputs = self.tokenizer(
               [f"{query} [SEP] {chunk}" for chunk in chunks],
               return_tensors="pt",
               padding=True,
               truncation=True,
           ).to(self.device)
           
           with torch.no_grad():
               scores = self.model(**inputs).logits.squeeze(-1).cpu().tolist()
           
           ranked = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)
           return [{"chunk": c, "score": s} for c, s in ranked]
   ```

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

## Konklusion

Denne plan giver en struktureret tilgang til at optimere RAG-implementeringen i LearningLab-projektet. Ved at følge disse trin kan du opnå betydelige ydeevneforbedringer og skabe en mere skalerbar og robust løsning.

Start med at implementere Fase 2-optimeringerne, da disse giver den største umiddelbare gevinst med den mindste indsats. Hvis yderligere optimering er nødvendig, kan du fortsætte med Fase 3-optimeringerne.