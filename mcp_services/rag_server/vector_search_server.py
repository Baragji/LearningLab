from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import chromadb
import os
import sys
from datetime import datetime

# Gør det muligt at importere rank_chunks fra samme mappe
dir_path = os.path.dirname(os.path.abspath(__file__))
if dir_path not in sys.path:
    sys.path.append(dir_path)
from rank_chunks import rank_chunks

# Konstant konfiguration
CHROMA_DB_DIR = os.path.join(os.getcwd(), "chroma_db")
COLLECTION_NAME = "code_chunks"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

app = Flask(__name__)

# Globale variabler, initialiseres i initialize_services()
embedding_model = None
chroma_client = None
code_collection = None


def initialize_services():
    """
    Initialiserer embedding-modellen og ChromaDB-collection.
    Logger om collection er tom eller indeholder dokumenter.
    """
    global embedding_model, chroma_client, code_collection

    try:
        print(f"🧠 Indlæser embedding-model '{EMBEDDING_MODEL_NAME}'...")
        embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        print("✅ Embedding-model indlæst.")

        os.makedirs(CHROMA_DB_DIR, exist_ok=True)
        print(f"🗄️ Initialiserer ChromaDB i '{CHROMA_DB_DIR}'...")
        chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        print("✅ ChromaDB-klient initialiseret.")

        code_collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
        print(f"✅ ChromaDB-collection '{COLLECTION_NAME}' klar.")

        # Tjek om collection er tom
        count = code_collection.count()
        if count == 0:
            print(f"⚠️ Advarsel: Collection '{COLLECTION_NAME}' er tom. Kør index_code_chunks.py først.")
        else:
            print(f"📂 Collection indeholder {count} items.")

    except Exception as e:
        print(f"❌ Fejl ved initialisering: {e}")
        sys.exit(1)


@app.route("/search", methods=["POST"])
def search():
    """
    /search-endpoint:
    - Firegger en søgning i ChromaDB baseret på en query-embedding.
    - Indeholder parameter 'n_results' (antal ønskede resultater, default=10).
    - Returnerer:
      {
        "results": [
            {
              "chunk": "<tekst>",
              "metadata": {...},
              "distance": <float>
            },
            ...
        ],
        "total_found": <antal fundne>,
        "query": "<original_query>",
        "context_file": "<filepath>"
      }
    """
    try:
        # Hent JSON-data
        data = request.get_json(force=True)
        query_text = data.get("query", "").strip()
        n_results = int(data.get("n_results", 10))
        filepath = data.get("filepath", "").strip()

        if not query_text:
            return jsonify({"error": "Parameter 'query' kan ikke være tom."}), 400

        # Optimeret: Lav embedding for forespørgslen med batch_size=1 for hurtigere inferens
        start_time = datetime.now()
        query_embedding = embedding_model.encode(query_text, batch_size=1, show_progress_bar=False).tolist()
        
        # Optimeret: Hent færre kandidater (2*n_results) for hurtigere søgning
        candidates = code_collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results * 2, 30),  # Reduceret fra 3*n_results til 2*n_results og max 30
            include=["documents", "metadatas", "distances"],
        )

        raw_docs = candidates.get("documents", [[]])[0]
        raw_metas = candidates.get("metadatas", [[]])[0]
        raw_distances = candidates.get("distances", [[]])[0]

        total_found = len(raw_docs)

        # Optimeret: Brug list comprehension i stedet for for-loop
        combined = [
            {"chunk": doc_text, "metadata": meta, "distance": dist}
            for doc_text, meta, dist in zip(raw_docs, raw_metas, raw_distances)
        ]

        # Hvis der er angivet en filepath, rangér med rank_chunks
        if filepath:
            combined = rank_chunks(combined, filepath)

        # Tag kun top n_results
        results = combined[:n_results]
        
        # Optimeret: Fjern unødvendig metadata fra response for at reducere størrelsen
        for result in results:
            if "metadata" in result:
                # Behold kun de vigtigste metadata-felter
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
        return jsonify(response), 200

    except Exception as e:
        print(f"❌ Fejl under /search: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    initialize_services()
    print("🚀 Starter RAG-server på http://0.0.0.0:5004 ...")
    app.run(host="0.0.0.0", port=5004, debug=False)
