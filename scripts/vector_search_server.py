# scripts/vector_search_server.py
import os
import chromadb
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify

# Initialiser Flask app
app = Flask(__name__)

# Definer stien til ChromaDB databasen.
# Scriptet forventes at køre fra projektets rodmappe,
# eller stien til chroma_db skal være absolut eller relativ til rodmappen.
# Vi antager, at serveren startes fra projektets rodmappe,
# så ./chroma_db peger korrekt.
CHROMA_DB_PATH = "./chroma_db"
COLLECTION_NAME = "code_chunks"

# Global variabel for SentenceTransformer modellen for at undgå at loade den ved hver request
# og for ChromaDB clienten
embedding_model = None
chroma_client = None
code_collection = None

def initialize_services():
    """Initialiserer embedding model og ChromaDB client/collection."""
    global embedding_model, chroma_client, code_collection
    
    if embedding_model is None:
        print("Loading local embedding model (all-MiniLM-L6-v2)...")
        try:
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Embedding model loaded successfully.")
        except Exception as e:
            print(f"Error loading embedding model: {e}")
            raise
            
    if chroma_client is None:
        print(f"Initializing ChromaDB client with path: {CHROMA_DB_PATH}")
        try:
            chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        except Exception as e:
            print(f"Error initializing ChromaDB client: {e}")
            # Det kan være, at databasen ikke findes, eller der er et problem med filrettigheder.
            # For nu lader vi fejlen propagere, så brugeren ser den ved opstart.
            raise

    if code_collection is None:
        print(f"Getting or creating collection: {COLLECTION_NAME}")
        try:
            code_collection = chroma_client.get_or_create_collection(COLLECTION_NAME)
            print(f"Collection '{COLLECTION_NAME}' loaded/created successfully.")
            # En lille test for at se om collection er tom
            count = code_collection.count()
            if count == 0:
                print(f"Warning: Collection '{COLLECTION_NAME}' is empty. Ensure 'index_code_chunks.py' has been run successfully.")
            else:
                print(f"Collection '{COLLECTION_NAME}' contains {count} items.")
        except Exception as e:
            print(f"Error getting/creating collection '{COLLECTION_NAME}': {e}")
            # Dette kan ske, hvis der er et problem med databasen, selv efter clienten er initialiseret.
            raise

@app.route('/search', methods=['POST'])
def search_code_chunks():
    """
    Modtager en søgeforespørgsel, finder relevante kode-chunks og returnerer dem.
    Forventer JSON-input: {"query": "din søgestreng", "n_results": 5}
    """
    global embedding_model, code_collection

    # Sørg for at services er initialiseret
    if embedding_model is None or code_collection is None:
        try:
            initialize_services() # Prøv at initialisere igen, hvis det ikke skete ved opstart
        except Exception as e:
            return jsonify({"error": f"Service initialization failed: {str(e)}"}), 500
            
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "Invalid input. 'query' is required."}), 400

    query_text = data['query']
    n_results = data.get('n_results', 5) # Standard til 5 resultater

    try:
        # Generer embedding for søgeforespørgslen
        query_embedding = embedding_model.encode(query_text).tolist()

        # Søg i ChromaDB
        results = code_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=['documents', 'metadatas'] # Inkluder selve koden og metadata
        )
        
        # Formater resultaterne pænt
        # ChromaDB returnerer resultater i et lidt komplekst format, 
        # så vi pakker det ud for nemmere brug.
        # results['documents'][0] er en liste af dokument-tekster
        # results['metadatas'][0] er en liste af metadata-objekter
        
        formatted_results = []
        if results and results.get('documents') and results.get('metadatas'):
            docs = results['documents'][0]
            metas = results['metadatas'][0]
            for doc, meta in zip(docs, metas):
                formatted_results.append({
                    "document": doc,
                    "metadata": meta
                })
        
        return jsonify({"results": formatted_results}), 200

    except Exception as e:
        print(f"Error during search: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialiser services ved opstart af serveren
    try:
        initialize_services()
        # Serveren kører nu på port 5004
        app.run(host='0.0.0.0', port=5004, debug=True)
    except Exception as e:
        print(f"Failed to start RAG API server: {e}")
        # Dette vil forhindre serveren i at starte, hvis initialiseringen fejler.
