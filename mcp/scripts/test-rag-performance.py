#!/usr/bin/env python3
"""
Test script for measuring RAG pipeline performance.
"""

import requests
import json
import time
import sys
import os
import statistics
from datetime import datetime

# Test queries
TEST_QUERIES = [
    "hvordan fungerer authentication?",
    "hvordan håndteres database migrationer?",
    "hvordan implementeres caching?",
    "hvordan fungerer error handling?",
    "hvordan bruges context i React komponenter?"
]

def measure_search_performance(query, n_results=3):
    """Measure vector search performance"""
    url = "http://localhost:5004/search"
    payload = {
        "query": query,
        "n_results": n_results,
        "filepath": ""
    }
    
    start_time = time.time()
    response = requests.post(url, json=payload)
    end_time = time.time()
    
    if response.status_code != 200:
        print(f"Fejl ved søgning: {response.status_code}")
        return None, None
    
    search_time = end_time - start_time
    results = response.json()
    
    return search_time, results

def measure_ollama_performance(query, context, stream=True):
    """Measure Ollama response generation performance"""
    url = "http://localhost:11434/api/generate"
    
    # Optimeret prompt
    full_prompt = f"""Du er en kodeekspert. Besvar kort og præcist:

KONTEKST:
{context}

SPØRGSMÅL:
{query}

Svar direkte på spørgsmålet baseret på konteksten. Vær kortfattet.
"""
    
    payload = {
        "model": "llama3.1:8b",
        "prompt": full_prompt,
        "stream": stream,
        "options": {
            "num_ctx": 2048,
            "temperature": 0.1,
            "num_thread": 4
        }
    }
    
    start_time = time.time()
    
    if stream:
        response = requests.post(url, json=payload, stream=True)
        full_response = ""
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                if 'response' in chunk:
                    full_response += chunk['response']
                if chunk.get('done', False):
                    break
    else:
        response = requests.post(url, json=payload)
        full_response = response.json().get("response", "")
    
    end_time = time.time()
    generation_time = end_time - start_time
    
    return generation_time, len(full_response)

def run_performance_test():
    """Run performance tests on the RAG pipeline"""
    print(f"🧪 Starting RAG performance test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Testing {len(TEST_QUERIES)} queries...")
    
    search_times = []
    generation_times = []
    total_times = []
    
    for i, query in enumerate(TEST_QUERIES):
        print(f"\n📊 Test {i+1}/{len(TEST_QUERIES)}: '{query}'")
        
        # Measure search performance
        search_time, results = measure_search_performance(query)
        if not results:
            print("❌ Search failed")
            continue
        
        search_times.append(search_time)
        print(f"🔍 Search time: {search_time:.3f} seconds")
        print(f"✅ Found {len(results['results'])} relevant code chunks")
        
        # Build context from search results
        context = ""
        for i, result in enumerate(results["results"]):
            context += f"--- KODE {i+1} ---\n"
            if 'metadata' in result and 'file_path' in result['metadata']:
                context += f"Fil: {result['metadata']['file_path']}\n"
            context += result["chunk"].strip()
            context += "\n\n"
        
        # Measure Ollama performance
        generation_time, response_length = measure_ollama_performance(query, context)
        generation_times.append(generation_time)
        print(f"🧠 Ollama generation time: {generation_time:.3f} seconds")
        print(f"📏 Response length: {response_length} characters")
        
        # Calculate total time
        total_time = search_time + generation_time
        total_times.append(total_time)
        print(f"⏱️ Total time: {total_time:.3f} seconds")
    
    # Calculate statistics
    if search_times and generation_times and total_times:
        print("\n📈 Performance Statistics:")
        print(f"Search time (avg): {statistics.mean(search_times):.3f} seconds")
        print(f"Search time (min/max): {min(search_times):.3f}/{max(search_times):.3f} seconds")
        print(f"Generation time (avg): {statistics.mean(generation_times):.3f} seconds")
        print(f"Generation time (min/max): {min(generation_times):.3f}/{max(generation_times):.3f} seconds")
        print(f"Total time (avg): {statistics.mean(total_times):.3f} seconds")
        print(f"Total time (min/max): {min(total_times):.3f}/{max(total_times):.3f} seconds")
    
    print("\n✅ Performance test completed")

if __name__ == "__main__":
    run_performance_test()