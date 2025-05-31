# index_code_chunks.py
import os
import chromadb
from sentence_transformers import SentenceTransformer # Udskiftet fra OpenAI

# Initialiser ChromaDB på den nye, korrekte måde
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("code_chunks")

# Initialiser den lokale embedding-model (gratis, kører på din Mac)
print("Loading local embedding model... (kan tage et øjeblik første gang)")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully.")

# Funktion til at læse kodefiler og dele dem op i chunks:
def read_and_chunk_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Could not read file {file_path}: {e}")
        return []
    # Simpelt eksempel: split ved dobbelt linjeskift (du kan justere efter behov)
    chunks = content.split("\n\n")
    # Tag kun chunks på max 1000 tegn for at undgå for store embeddings
    return [chunk for chunk in chunks if len(chunk) > 50 and len(chunk) < 1000]

# Loop igennem .ts, .tsx, .js, .jsx filer i projektet:
project_root = os.path.abspath(os.getcwd())
for subdir, dirs, files in os.walk(project_root):
    # Ekskluder node_modules, dist, build osv.:
    if any(exclude in subdir for exclude in ["node_modules", "dist", "build", ".git"]):
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx")):
            file_path = os.path.join(subdir, file)
            chunks = read_and_chunk_file(file_path)
            if not chunks:
                continue

            print(f"Processing {file_path}...")
            for i, chunk in enumerate(chunks):
                try:
                    # Opret embedding lokalt med det nye værktøj
                    embedding = model.encode(chunk).tolist()
                    
                    # Gem i ChromaDB med metadata
                    collection.add(
                        ids=[f"{file_path}:{i}"],
                        embeddings=[embedding],
                        metadatas=[{"file_path": file_path, "chunk_index": i}],
                        documents=[chunk]
                    )
                except Exception as e:
                    print(f"  Skipping chunk {i} in file {file_path} due to error: {e}")

print("\n🎉 Indeksering færdig! ChromaDB er oprettet i mappen './chroma_db'.")