from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from sentence_transformers import SentenceTransformer
import chromadb
import logging
import numpy as np
from datetime import datetime
import os
import sys
import torch

# Gør det muligt at importere rank_chunks fra samme mappe
dir_path = os.path.dirname(os.path.abspath(__file__))
if dir_path not in sys.path:
    sys.path.append(dir_path)
from rank_chunks import rank_chunks
from proximity_cache import ProximityCache

# Konstant konfiguration
CHROMA_DB_DIR = os.path.join(os.getcwd(), "chroma_db")
COLLECTION_NAME = "code_chunks"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# Tjek om GPU er tilgængelig
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️ Bruger {device} til embedding-generering")

# Initialiser cache
proximity_cache = ProximityCache(threshold=0.85, max_size=100)

# Opsæt logging
logging.basicConfig(
    filename=os.path.join(os.getcwd(), "logs", "rag_server.log"),
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="RAG Vector Search API", version="2.0.0")

# Globale variabler
model = None
client = None
collection = None
total_queries = 0

@app.on_event("startup")
async def startup_event():
    """Kører ved opstart af FastAPI-appen."""
    initialize_services()

def initialize_services():
    """
    Initialiserer embedding-modellen og ChromaDB-collection.
    """
    global model, client, collection
    
    try:
        print(f"🧠 Indlæser embedding-model '{EMBEDDING_MODEL_NAME}'...")
        model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=device)
        print("✅ Embedding-model indlæst.")

        os.makedirs(CHROMA_DB_DIR, exist_ok=True)
        print(f"🗄️ Initialiserer ChromaDB i '{CHROMA_DB_DIR}'...")
        client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        print("✅ ChromaDB-klient initialiseret.")

        collection = client.get_or_create_collection(name=COLLECTION_NAME)
        print(f"✅ ChromaDB-collection '{COLLECTION_NAME}' klar.")

        # Tjek om collection er tom
        count = collection.count()
        if count == 0:
            print(f"⚠️ Advarsel: Collection '{COLLECTION_NAME}' er tom. Kør index_code_chunks.py først.")
        else:
            print(f"📂 Collection indeholder {count} items.")

    except Exception as e:
        print(f"❌ Fejl ved initialisering: {e}")
        sys.exit(1)

class SearchRequest(BaseModel):
    query: str
    n_results: int = 10
    filepath: str = ""

@app.get("/health")
async def health():
    return {"status": "OK"}

@app.get("/cache/stats")
async def cache_stats():
    """Returner statistik om proximity cache."""
    stats = proximity_cache.get_stats()
    stats["total_queries"] = total_queries
    stats["hit_rate"] = stats["size"] / (total_queries + 1) if total_queries > 0 else 0
    return stats

@app.post("/search")
async def search(request: SearchRequest):
    global total_queries
    total_queries += 1
    
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
        
        # Beregn cache hit rate og log statistik
        cache_stats = proximity_cache.get_stats()
        cache_hit_rate = cache_stats["size"] / (total_queries + 1) if total_queries > 0 else 0
        print(f"📊 Cache statistik: {cache_stats['size']}/{cache_stats['max_size']} indgange, hit rate: {cache_hit_rate:.2f}")
        
        return response

    except Exception as e:
        print(f"❌ Fejl under /search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    initialize_services()
    uvicorn.run(app, host="0.0.0.0", port=5004)