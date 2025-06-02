#!/usr/bin/env python3
import requests
import json
import sys
import os

# Læs konfiguration fra config.yaml hvis den findes
config = {
    "vector_search_url": "http://localhost:5004/search",
    "ollama_url": "http://localhost:11434/api/generate",
    "ollama_model": "llama3.1:8b"
}

# Prøv at læse konfiguration fra config.yaml
try:
    import yaml
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, "rag_server", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            yaml_config = yaml.safe_load(f)
            if yaml_config and 'llm' in yaml_config:
                config["ollama_model"] = yaml_config['llm'].get('model_name', config["ollama_model"])
                base_url = yaml_config['llm'].get('base_url', 'http://localhost:11434')
                config["ollama_url"] = f"{base_url}/api/generate"
except Exception as e:
    print(f"Advarsel: Kunne ikke læse config.yaml: {e}")

def search_vector_db(query, n_results=3):
    """Søg i vector databasen efter relevante kode-chunks"""
    url = config["vector_search_url"]
    payload = {
        "query": query,
        "n_results": n_results,
        "filepath": ""
    }
    
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        print(f"Fejl ved søgning: {response.status_code}")
        return None
    
    return response.json()

def generate_with_ollama(prompt, context):
    """Generer svar med Ollama baseret på kontekst"""
    url = config["ollama_url"]
    
    # Byg prompt med kontekst
    full_prompt = f"""Du er en hjælpsom assistent, der besvarer spørgsmål om kodebasen.
    
KONTEKST:
{context}

SPØRGSMÅL:
{prompt}

Besvar spørgsmålet baseret på konteksten ovenfor. Hvis konteksten ikke indeholder nok information til at besvare spørgsmålet, så sig det.
"""
    
    payload = {
        "model": config["ollama_model"],
        "prompt": full_prompt,
        "stream": False
    }
    
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        print(f"Fejl ved generering: {response.status_code}")
        return None
    
    return response.json()

def main():
    if len(sys.argv) < 2:
        print("Brug: python test-rag-pipeline.py 'Dit spørgsmål her'")
        return
    
    query = " ".join(sys.argv[1:])
    print(f"\n🔍 Søger efter: '{query}'")
    
    # Søg i vector databasen
    search_results = search_vector_db(query)
    if not search_results:
        print("❌ Kunne ikke få resultater fra vector search")
        return
    
    # Byg kontekst fra søgeresultater
    context = ""
    for i, result in enumerate(search_results["results"]):
        context += f"\n--- CHUNK {i+1} ---\n"
        if 'metadata' in result:
            metadata = result['metadata']
            if 'file_path' in metadata:
                context += f"Fil: {metadata['file_path']}\n"
            if 'type' in metadata:
                context += f"Type: {metadata['type']}\n"
            if 'name' in metadata:
                context += f"Navn: {metadata['name']}\n"
        context += "\n"
        context += result["chunk"]
        context += "\n\n"
    
    print(f"\n✅ Fandt {len(search_results['results'])} relevante kode-chunks")
    
    # Generer svar med Ollama
    print("\n🧠 Genererer svar med Ollama...")
    ollama_response = generate_with_ollama(query, context)
    if not ollama_response:
        print("❌ Kunne ikke generere svar med Ollama")
        return
    
    # Vis svar
    print("\n🤖 SVAR:")
    print(ollama_response["response"])

if __name__ == "__main__":
    main()