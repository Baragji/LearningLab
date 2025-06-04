#!/usr/bin/env python3
"""
Quick test to see what's running in the container
"""

import requests
import json

def test_endpoints():
    base_url = "https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health endpoint error: {e}")
    
    # Test MCP endpoint
    try:
        response = requests.post(f"{base_url}/mcp", 
                               json={"method": "tools/list"},
                               headers={"Content-Type": "application/json"})
        print(f"MCP endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"MCP endpoint error: {e}")
    
    # Get OpenAPI spec
    try:
        response = requests.get(f"{base_url}/openapi.json")
        spec = response.json()
        print(f"Available endpoints: {list(spec.get('paths', {}).keys())}")
        print(f"App title: {spec.get('info', {}).get('title', 'Unknown')}")
    except Exception as e:
        print(f"OpenAPI error: {e}")

if __name__ == "__main__":
    test_endpoints()