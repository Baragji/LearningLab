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
    config_path = os.path.join(script_dir, "..", "services", "rag_server", "config.yaml")
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
    
    # Optimeret prompt med kontekst - kortere og mere fokuseret
    full_prompt = f"""Du er en kodeekspert. Besvar kort og præcist:

KONTEKST:
{context}

SPØRGSMÅL:
{prompt}

Svar direkte på spørgsmålet baseret på konteksten. Vær kortfattet.
"""
    
    # Tilføj streaming og optimerede parametre
    payload = {
        "model": config["ollama_model"],
        "prompt": full_prompt,
        "stream": True,
        "options": {
            "num_ctx": 2048,       # Reducer kontekstvinduet for hurtigere inferens
            "temperature": 0.1,    # Lavere temperatur for mere deterministiske svar
            "num_thread": 4        # Optimeret for M1 Mac
        }
    }
    
    print("\n🧠 Genererer svar med Ollama (streaming)...")
    
    # Implementer streaming for hurtigere oplevelse
    try:
        response = requests.post(url, json=payload, stream=True)
        if response.status_code != 200:
            print(f"Fejl ved generering: {response.status_code}")
            return None
        
        # Håndter streaming response
        full_response = ""
        print("\n🤖 SVAR:")
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                if 'response' in chunk:
                    print(chunk['response'], end='', flush=True)
                    full_response += chunk['response']
                if chunk.get('done', False):
                    break
        
        print("\n")  # Afslut med en ny linje
        return {"response": full_response}
    
    except Exception as e:
        print(f"Fejl under streaming: {e}")
        
        # Fallback til non-streaming hvis streaming fejler
        print("Prøver uden streaming...")
        payload["stream"] = False
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
    
    # Søg i vector databasen - øg til 5 resultater for bedre kontekst
    search_results = search_vector_db(query, n_results=5)
    if not search_results:
        print("❌ Kunne ikke få resultater fra vector search")
        return
    
    # Begræns til max 3 chunks for hurtigere inferens
    results = search_results["results"][:3]
    
    # Byg optimeret kontekst fra søgeresultater
    context = ""
    for i, result in enumerate(results):
        context += f"--- KODE {i+1} ---\n"
        if 'metadata' in result and 'file_path' in result['metadata']:
            context += f"Fil: {result['metadata']['file_path']}\n"
        
        # Tilføj kun selve koden uden for meget metadata
        context += result["chunk"].strip()
        context += "\n\n"
    
    print(f"\n✅ Fandt {len(results)} relevante kode-chunks")
    
    # Generer svar med Ollama (nu med streaming i generate_with_ollama funktionen)
    ollama_response = generate_with_ollama(query, context)
    if not ollama_response:
        print("❌ Kunne ikke generere svar med Ollama")
        return

if __name__ == "__main__":
    main()