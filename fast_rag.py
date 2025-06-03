#!/usr/bin/env python3
"""
Hurtig RAG med ChromaDB og Ollama
Meget hurtigere end SQLite implementationen
"""

import os
import json
import requests
import chromadb
from pathlib import Path
import hashlib
from typing import List, Dict, Tuple
import argparse

class FastRAG:
    def __init__(self, collection_name: str = "code_chunks", ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.embedding_model = "nomic-embed-text"
        self.llm_model = "llama3.1:8b"
        
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(name=collection_name)
            print(f"📚 Loaded existing collection: {collection_name}")
        except:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
            print(f"🆕 Created new collection: {collection_name}")
    
    def get_embedding(self, text: str) -> List[float]:
        """Hent embedding fra Ollama"""
        response = requests.post(
            f"{self.ollama_url}/api/embeddings",
            json={"model": self.embedding_model, "prompt": text}
        )
        
        if response.status_code == 200:
            return response.json()["embedding"]
        else:
            raise Exception(f"Embedding fejl: {response.text}")
    
    def chunk_code_file(self, file_path: str, chunk_size: int = 1000) -> List[Dict]:
        """Del kodefil op i chunks"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            return []
        
        # Simple chunking by lines
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        current_size = 0
        start_line = 1
        
        for i, line in enumerate(lines, 1):
            current_chunk.append(line)
            current_size += len(line)
            
            if current_size >= chunk_size or i == len(lines):
                chunk_text = '\n'.join(current_chunk)
                chunk_hash = hashlib.md5(chunk_text.encode()).hexdigest()
                
                chunks.append({
                    'text': chunk_text,
                    'hash': chunk_hash,
                    'start_line': start_line,
                    'end_line': i,
                    'file_path': file_path
                })
                
                current_chunk = []
                current_size = 0
                start_line = i + 1
        
        return chunks
    
    def index_directory(self, directory: str, extensions: List[str] = None):
        """Indekser kun relevante kodefiler i directory"""
        if extensions is None:
            extensions = ['.py', '.js', '.ts', '.tsx', '.jsx', '.md', '.json', '.yaml', '.yml']
        
        ignore_dirs = {
            'node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 
            'rag_env', 'venv', '.venv', 'env', '.env', 'target', 'coverage',
            '.pytest_cache', '.mypy_cache', 'logs', 'tmp', 'temp', 'chroma_db'
        }
        
        ignore_patterns = {
            'package-lock.json', 'yarn.lock', '.DS_Store', 'Thumbs.db',
            'code_rag.db', '*.log', '*.tmp', '*.cache'
        }
        
        directory_path = Path(directory)
        
        # Collect all files first
        files_to_process = []
        for file_path in directory_path.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in extensions:
                if any(ignore_dir in file_path.parts for ignore_dir in ignore_dirs):
                    continue
                if any(pattern in file_path.name for pattern in ignore_patterns):
                    continue
                try:
                    if file_path.stat().st_size > 100 * 1024:  # Skip files > 100KB
                        continue
                except OSError:
                    continue
                
                files_to_process.append(file_path)
        
        print(f"🚀 Indexing {len(files_to_process)} files...")
        
        # Process files in batches for better performance
        batch_size = 50
        total_chunks = 0
        
        for i in range(0, len(files_to_process), batch_size):
            batch = files_to_process[i:i + batch_size]
            
            # Prepare batch data
            batch_ids = []
            batch_embeddings = []
            batch_documents = []
            batch_metadatas = []
            
            for file_path in batch:
                try:
                    chunks = self.chunk_code_file(str(file_path))
                    
                    for chunk in chunks:
                        # Check if chunk already exists
                        try:
                            existing = self.collection.get(ids=[chunk['hash']])
                            if existing['ids']:
                                continue  # Skip if already indexed
                        except:
                            pass
                        
                        # Get embedding
                        embedding = self.get_embedding(chunk['text'])
                        
                        batch_ids.append(chunk['hash'])
                        batch_embeddings.append(embedding)
                        batch_documents.append(chunk['text'])
                        batch_metadatas.append({
                            'file_path': chunk['file_path'],
                            'start_line': chunk['start_line'],
                            'end_line': chunk['end_line']
                        })
                        
                        total_chunks += 1
                
                except Exception as e:
                    print(f"❌ Error processing {file_path}: {e}")
            
            # Add batch to ChromaDB
            if batch_ids:
                self.collection.add(
                    ids=batch_ids,
                    embeddings=batch_embeddings,
                    documents=batch_documents,
                    metadatas=batch_metadatas
                )
            
            print(f"📁 Processed batch {i//batch_size + 1}/{(len(files_to_process) + batch_size - 1)//batch_size} - Total chunks: {total_chunks}")
        
        print(f"✅ Indexing complete! Added {total_chunks} chunks to ChromaDB.")
    
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Søg efter relevante code chunks - MEGET hurtigere med ChromaDB"""
        query_embedding = self.get_embedding(query)
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=['documents', 'metadatas', 'distances']
        )
        
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'file_path': results['metadatas'][0][i]['file_path'],
                'chunk_text': results['documents'][0][i],
                'similarity': 1 - results['distances'][0][i],  # Convert distance to similarity
                'start_line': results['metadatas'][0][i]['start_line'],
                'end_line': results['metadatas'][0][i]['end_line']
            })
        
        return formatted_results
    
    def generate_answer(self, query: str, context_chunks: List[Dict]) -> str:
        """Generer svar med LLM baseret på context"""
        context = "\n\n".join([
            f"File: {chunk['file_path']} (lines {chunk['start_line']}-{chunk['end_line']})\n{chunk['chunk_text']}"
            for chunk in context_chunks
        ])
        
        prompt = f"""Du er en ekspert kode-assistent. Baseret på følgende kode-kontekst, besvar spørgsmålet præcist og handlingsrettet.

KONTEKST:
{context}

SPØRGSMÅL: {query}

SVAR:"""
        
        response = requests.post(
            f"{self.ollama_url}/api/generate",
            json={
                "model": self.llm_model,
                "prompt": prompt,
                "stream": False
            }
        )
        
        if response.status_code == 200:
            return response.json()["response"]
        else:
            raise Exception(f"LLM fejl: {response.text}")
    
    def rag_query(self, query: str, top_k: int = 5) -> Dict:
        """Komplet RAG query: search + generate"""
        print(f"🔍 Søger efter: {query}")
        
        # Search for relevant chunks (HURTIG med ChromaDB!)
        relevant_chunks = self.search(query, top_k)
        
        if not relevant_chunks:
            return {
                "query": query,
                "answer": "Ingen relevante kode-chunks fundet.",
                "sources": []
            }
        
        print(f"📚 Fandt {len(relevant_chunks)} relevante chunks")
        
        # Generate answer
        answer = self.generate_answer(query, relevant_chunks)
        
        return {
            "query": query,
            "answer": answer,
            "sources": [
                {
                    "file": chunk['file_path'],
                    "lines": f"{chunk['start_line']}-{chunk['end_line']}",
                    "similarity": round(chunk['similarity'], 3)
                }
                for chunk in relevant_chunks
            ]
        }
    
    def get_stats(self):
        """Vis statistikker om collection"""
        count = self.collection.count()
        print(f"📊 Collection indeholder {count} chunks")
        return count

def main():
    parser = argparse.ArgumentParser(description='Fast RAG with ChromaDB')
    parser.add_argument('--index', type=str, help='Directory to index')
    parser.add_argument('--query', type=str, help='Query to search')
    parser.add_argument('--stats', action='store_true', help='Show collection stats')
    parser.add_argument('--top-k', type=int, default=5, help='Number of results')
    
    args = parser.parse_args()
    
    rag = FastRAG()
    
    if args.stats:
        rag.get_stats()
        return
    
    if args.index:
        print(f"🚀 Indexing directory: {args.index}")
        rag.index_directory(args.index)
    
    if args.query:
        result = rag.rag_query(args.query, args.top_k)
        print(f"\n🤖 SVAR:")
        print(result['answer'])
        print(f"\n📖 KILDER:")
        for source in result['sources']:
            print(f"  - {source['file']} (lines {source['lines']}) - similarity: {source['similarity']}")

if __name__ == "__main__":
    main()