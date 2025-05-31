import os
import re
import ast
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from datetime import datetime
import sys

# Gør det muligt at importere rank_chunks, hvis det skal bruges senere
dir_path = os.path.dirname(os.path.abspath(__file__))
if dir_path not in sys.path:
    sys.path.append(dir_path)

# Konstant konfiguration
CHROMA_DB_DIR = os.path.join(os.getcwd(), "chroma_db")
COLLECTION_NAME = "code_chunks"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
MAX_TOKENS_PER_CHUNK = 500

# Mapper og filtyper, der skal ignoreres
IGNORED_DIRS = {
    "node_modules", "dist", "build", ".git", ".turbo", ".yarn", "__pycache__", ".next"
}
SUPPORTED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx"}

# Globale variabler, initialiseres i initialize_services()
embedding_model = None
chroma_client = None
code_collection = None


def initialize_services():
    """
    Initialiserer ChromaDB og embedding-model.
    Opretter collection, hvis den ikke eksisterer.
    """
    global embedding_model, chroma_client, code_collection

    os.makedirs(CHROMA_DB_DIR, exist_ok=True)
    chroma_client = chromadb.PersistentClient(
        path=CHROMA_DB_DIR, settings=Settings(chroma_db_impl="duckdb+parquet")
    )
    code_collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"✅ ChromaDB collection '{COLLECTION_NAME}' klar (path: {CHROMA_DB_DIR}).")

    print(f"🧠 Indlæser embedding-model '{EMBEDDING_MODEL_NAME}'...")
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    print("✅ Embedding-model indlæst.")


def extract_imports_from_file(content: str, file_ext: str):
    """
    Ekstraherer imports baseret på fil-udvidelse:
    - Python: AST-parser
    - JS/TS: regex
    Returnerer en liste af unikke import-navne.
    """
    imports = set()

    # Python
    if file_ext == ".py":
        try:
            tree = ast.parse(content)
            for node in tree.body:
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom) and node.module:
                    imports.add(node.module.split(".")[0])
        except Exception:
            pass

    # JavaScript/TypeScript
    elif file_ext in {".js", ".jsx", ".ts", ".tsx"}:
        pattern = r"(?:import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]|require\s*\(\s*['\"]([^'\"]+)['\"]\s*\))"
        matches = re.findall(pattern, content)
        for m in matches:
            pkg = m[0] or m[1]
            if pkg and not pkg.startswith("."):
                imports.add(pkg.split("/")[0])

    return list(imports)


def smart_chunk_file(content: str, file_path: str, chunk_size: int = MAX_TOKENS_PER_CHUNK):
    """
    Opdeler en fil intelligent i chunks ved at kigge efter
    funktion- og klassedefinitioner ved brug af AST (hvis Python).
    Hvis ingen AST-træ rammes, eller for JS/TS, laver vi en fallback
    baseret på token-længde.
    Returnerer en liste af (chunk_text, metadata)-tupler.
    """
    file_ext = os.path.splitext(file_path)[1]
    chunks_with_metadata = []

    # Forsøg AST-baseret chunking for Python
    if file_ext == ".py":
        try:
            tree = ast.parse(content)
            lines = content.split("\n")
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    start_line = node.lineno - 1
                    end_line = getattr(node, "end_lineno", start_line + 10)
                    chunk = "\n".join(lines[start_line:end_line])
                    length = len(chunk.split())
                    if 50 < length < 2000:
                        meta = {
                            "type": "function" if isinstance(node, ast.FunctionDef) else "class",
                            "name": node.name,
                            "start_line": start_line,
                            "end_line": end_line,
                        }
                        chunks_with_metadata.append((chunk, meta))
        except Exception:
            pass  # Fald tilbage til enkel token-chunking

    # Hvis ingen AST-chunks blev fundet, eller for andre filtyper:
    if not chunks_with_metadata:
        lines = content.split("\n")
        tokens = content.split()
        total_tokens = len(tokens)
        start_idx = 0
        current_line = 0

        while start_idx < total_tokens:
            end_idx = min(start_idx + chunk_size, total_tokens)
            chunk_tokens = tokens[start_idx:end_idx]
            chunk_text = " ".join(chunk_tokens)

            # Find omtrentlig startlinje ved at tælle nye linjer indtil token-teksten
            idx = content.find(chunk_tokens[0])
            pre_text = content[:idx] if idx != -1 else "\n".join(lines[:current_line])
            chunk_start_line = pre_text.count("\n") + 1 if idx != -1 else current_line

            meta = {
                "type": "code_block",
                "start_line": chunk_start_line,
                "end_line": chunk_start_line + chunk_text.count("\n"),
            }
            chunks_with_metadata.append((chunk_text, meta))

            # Flyt til næste segment
            current_line = chunk_start_line + chunk_text.count("\n")
            start_idx = end_idx

    return chunks_with_metadata


def read_and_chunk_file(file_path: str):
    """
    Læser indholdet af file_path, opdeler i smarte chunks,
    ekstracterer filniveau-imports og tilføjer metadata.
    Returnerer en liste af (chunk_text, metadata)-tupler.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"⚠️ Kan ikke læse {file_path}: {e}")
        return []

    file_ext = os.path.splitext(file_path)[1]
    file_imports = extract_imports_from_file(content, file_ext)
    base_metadata = {
        "file_path": file_path,
        "imports": file_imports,
        "timestamp": datetime.utcnow().isoformat(),
        "file_size": len(content),
        "language": file_ext.lstrip("."),
    }

    chunks_with_meta = smart_chunk_file(content, file_path)
    enhanced = []
    for idx, (chunk_text, meta) in enumerate(chunks_with_meta):
        combined_meta = {**base_metadata, **meta}
        # Tildel en unik ID (brug start_line + indeks for at undgå duplikater)
        combined_meta["chunk_id"] = f"{file_path}:{combined_meta.get('start_line', idx)}:{idx}"
        enhanced.append((chunk_text, combined_meta))
    return enhanced


def index_workspace():
    """
    Går gennem hele projektmappen, læser filer med understøttede extensions,
    deler dem i chunks og gemmer embeddings+metadata i ChromaDB.
    """
    total_files = 0
    total_chunks = 0

    # Ryd eksisterende collection (for frisk start)
    print("🗑️ Rydder eksisterende collection…")
    try:
        chroma_client.delete_collection(COLLECTION_NAME)
        chroma_client.create_collection(COLLECTION_NAME)
    except Exception:
        pass  # Hvis collection ikke eksisterer endnu

    for root, dirs, files in os.walk(os.getcwd()):
        # Filtrer mappestrukturen
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        for fname in files:
            ext = os.path.splitext(fname)[1]
            if ext.lower() in SUPPORTED_EXTENSIONS:
                file_path = os.path.join(root, fname)
                total_files += 1
                chunks = read_and_chunk_file(file_path)

                if not chunks:
                    continue

                print(f"🔄 Processerer {file_path} ({len(chunks)} chunks)…")
                for _, (chunk_text, metadata) in enumerate(chunks):
                    try:
                        # Generer embedding
                        embedding = embedding_model.encode(chunk_text).tolist()
                        chunk_id = metadata["chunk_id"]
                        # Indsæt i ChromaDB
                        code_collection.add(
                            ids=[chunk_id],
                            embeddings=[embedding],
                            metadatas=[metadata],
                            documents=[chunk_text],
                        )
                        total_chunks += 1
                    except Exception as e:
                        print(f"   ⚠️ Skipping chunk {chunk_id} pga. fejl: {e}")

    print("\n🎉 Indeksering færdig!")
    print(f"   - Filer processeret: {total_files}")
    print(f"   - Chunks indekseret: {total_chunks}")
    print(f"   - DB placering: '{CHROMA_DB_DIR}'")


if __name__ == "__main__":
    initialize_services()
    index_workspace()
