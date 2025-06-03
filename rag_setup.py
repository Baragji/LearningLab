#!/usr/bin/env python3
"""
RAG Setup for Code Assistant with Ollama
Opretter en lokal RAG pipeline med nomic-embed-text og llama3.1:8b
"""

import os
import json
import requests
import sqlite3
import numpy as np
from pathlib import Path
import hashlib
from typing import List, Dict, Tuple
import argparse

class LocalRAG:
    def __init__(self, db_path: str = "code_rag.db", ollama_url: str = "http://localhost:11434"):
        self.db_path = db_path
        self.ollama_url = ollama_url
        self.embedding_model = "nomic-embed-text"
        self.llm_model = "llama3.1:8b"
        self.init_database()
    
    def init_database(self):
        """Initialiser SQLite database til embeddings"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS code_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT NOT NULL,
                chunk_text TEXT NOT NULL,
                chunk_hash TEXT UNIQUE NOT NULL,
                embedding BLOB NOT NULL,
                start_line INTEGER,
                end_line INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_file_path ON code_chunks(file_path);
        ''')
        
        conn.commit()
        conn.close()
    
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
                lines = f.readlines()
        except UnicodeDecodeError:
            # Skip binary files
            return []
        
        chunks = []
        current_chunk = []
        current_size = 0
        start_line = 1
        
        for i, line in enumerate(lines, 1):
            current_chunk.append(line)
            current_size += len(line)
            
            if current_size >= chunk_size or i == len(lines):
                chunk_text = ''.join(current_chunk)
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
        
        # Directories to completely ignore
        ignore_dirs = {
            'node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 
            'rag_env', 'venv', '.venv', 'env', '.env', 'target', 'coverage',
            '.pytest_cache', '.mypy_cache', 'logs', 'tmp', 'temp'
        }
        
        # File patterns to ignore
        ignore_patterns = {
            'package-lock.json', 'yarn.lock', '.DS_Store', 'Thumbs.db',
            'code_rag.db', '*.log', '*.tmp', '*.cache'
        }
        
        directory_path = Path(directory)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        total_files = 0
        processed_files = 0
        
        print(f"🔍 Scanner directory: {directory}")
        print(f"📁 Ignoring directories: {', '.join(ignore_dirs)}")
        
        for file_path in directory_path.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in extensions:
                # Skip if any parent directory is in ignore list
                if any(ignore_dir in file_path.parts for ignore_dir in ignore_dirs):
                    continue
                
                # Skip specific file patterns
                if any(pattern in file_path.name for pattern in ignore_patterns):
                    continue
                
                # Skip files larger than 100KB (likely not useful code)
                try:
                    if file_path.stat().st_size > 100 * 1024:
                        continue
                except OSError:
                    continue
                
                total_files += 1
                
                try:
                    chunks = self.chunk_code_file(str(file_path))
                    
                    for chunk in chunks:
                        # Check if chunk already exists
                        cursor.execute('SELECT id FROM code_chunks WHERE chunk_hash = ?', (chunk['hash'],))
                        if cursor.fetchone():
                            continue  # Skip if already indexed
                        
                        # Get embedding
                        embedding = self.get_embedding(chunk['text'])
                        embedding_blob = np.array(embedding, dtype=np.float32).tobytes()
                        
                        # Insert into database
                        cursor.execute('''
                            INSERT INTO code_chunks (file_path, chunk_text, chunk_hash, embedding, start_line, end_line)
                            VALUES (?, ?, ?, ?, ?, ?)
                        ''', (
                            chunk['file_path'],
                            chunk['text'],
                            chunk['hash'],
                            embedding_blob,
                            chunk['start_line'],
                            chunk['end_line']
                        ))
                    
                    processed_files += 1
                    if processed_files % 10 == 0:
                        print(f"📁 Processed {processed_files}/{total_files} files...")
                        conn.commit()
                
                except Exception as e:
                    print(f"❌ Error processing {file_path}: {e}")
        
        conn.commit()
        conn.close()
        print(f"✅ Indexing complete! Processed {processed_files} files.")
    
    def cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Beregn cosine similarity"""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Søg efter relevante code chunks"""
        query_embedding = np.array(self.get_embedding(query), dtype=np.float32)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT file_path, chunk_text, embedding, start_line, end_line FROM code_chunks')
        results = []
        
        for row in cursor.fetchall():
            file_path, chunk_text, embedding_blob, start_line, end_line = row
            chunk_embedding = np.frombuffer(embedding_blob, dtype=np.float32)
            
            similarity = self.cosine_similarity(query_embedding, chunk_embedding)
            
            results.append({
                'file_path': file_path,
                'chunk_text': chunk_text,
                'similarity': similarity,
                'start_line': start_line,
                'end_line': end_line
            })
        
        conn.close()
        
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]
    
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
        
        # Search for relevant chunks
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
    
    def preview_indexing(self, directory: str, extensions: List[str] = None):
        """Preview hvilke filer der vil blive indexeret"""
        if extensions is None:
            extensions = ['.py', '.js', '.ts', '.tsx', '.jsx', '.md', '.json', '.yaml', '.yml']
        
        ignore_dirs = {
            'node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 
            'rag_env', 'venv', '.venv', 'env', '.env', 'target', 'coverage',
            '.pytest_cache', '.mypy_cache', 'logs', 'tmp', 'temp'
        }
        
        ignore_patterns = {
            'package-lock.json', 'yarn.lock', '.DS_Store', 'Thumbs.db',
            'code_rag.db', '*.log', '*.tmp', '*.cache'
        }
        
        directory_path = Path(directory)
        files_to_index = []
        
        for file_path in directory_path.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in extensions:
                if any(ignore_dir in file_path.parts for ignore_dir in ignore_dirs):
                    continue
                if any(pattern in file_path.name for pattern in ignore_patterns):
                    continue
                try:
                    if file_path.stat().st_size > 100 * 1024:
                        continue
                except OSError:
                    continue
                
                files_to_index.append(str(file_path))
        
        print(f"📋 Preview: {len(files_to_index)} filer vil blive indexeret:")
        for i, file_path in enumerate(files_to_index[:20], 1):  # Show first 20
            print(f"  {i}. {file_path}")
        
        if len(files_to_index) > 20:
            print(f"  ... og {len(files_to_index) - 20} flere")
        
        return files_to_index

def main():
    parser = argparse.ArgumentParser(description='Local RAG for Code Assistant')
    parser.add_argument('--index', type=str, help='Directory to index')
    parser.add_argument('--preview', type=str, help='Preview files to be indexed')
    parser.add_argument('--query', type=str, help='Query to search')
    parser.add_argument('--top-k', type=int, default=5, help='Number of results')
    
    args = parser.parse_args()
    
    rag = LocalRAG()
    
    if args.preview:
        files = rag.preview_indexing(args.preview)
        print(f"\n💡 Kør med --index {args.preview} for at indexere disse {len(files)} filer")
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