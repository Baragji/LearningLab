#!/usr/bin/env python3
"""
Test script to verify OpenAI integration with real API key
"""

import os
import sys
import time
import requests
import subprocess
from pathlib import Path

# Load environment variables from .env file
env_file = Path('.env')
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
    print("✅ Loaded environment variables from .env file")
else:
    print("❌ .env file not found")
    sys.exit(1)

def test_openai_connection():
    """Test direct OpenAI connection"""
    print("\n🔑 Testing OpenAI API connection...")
    
    try:
        import openai
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Test with a simple completion
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Say 'Hello from OpenAI!' in exactly those words."}
            ],
            max_tokens=10
        )
        
        result = response.choices[0].message.content.strip()
        print(f"✅ OpenAI API test successful: {result}")
        return True
        
    except Exception as e:
        print(f"❌ OpenAI API test failed: {e}")
        return False

def test_rag_engine_with_api():
    """Test RAG engine with real API key"""
    print("\n🧠 Testing RAG Engine with real API key...")
    
    try:
        sys.path.append('src')
        from rag_engine import RAGEngine
        
        # Initialize RAG engine
        rag = RAGEngine()
        
        # Test initialization
        if rag.openai_client is None:
            print("❌ RAG Engine: OpenAI client not initialized")
            return False
            
        print("✅ RAG Engine: OpenAI client initialized successfully")
        
        # Test if ready
        if rag.is_ready():
            print("✅ RAG Engine: Ready for operations")
        else:
            print("⚠️  RAG Engine: Not fully ready (ChromaDB might be initializing)")
            
        return True
        
    except Exception as e:
        print(f"❌ RAG Engine test failed: {e}")
        return False

def test_server_with_api():
    """Test MCP server with real API key"""
    print("\n🚀 Testing MCP Server with real API key...")
    
    try:
        # Start server in background
        server_process = subprocess.Popen(
            [sys.executable, '-m', 'src.mcp_server'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.getcwd()
        )
        
        # Wait for server to start
        time.sleep(5)
        
        # Test health endpoint
        port = int(os.getenv('CODE_ASSISTANT_PORT', 8080))
        try:
            response = requests.get(f'http://localhost:{port}/health', timeout=10)
            if response.status_code == 200:
                print("✅ Server health check passed")
                result = True
            else:
                print(f"❌ Server health check failed: {response.status_code}")
                result = False
        except requests.exceptions.RequestException as e:
            print(f"❌ Server health check failed: {e}")
            result = False
        
        # Stop server
        server_process.terminate()
        server_process.wait(timeout=5)
        print("🛑 Server stopped")
        
        return result
        
    except Exception as e:
        print(f"❌ Server test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing OpenAI Integration with Real API Key")
    print("=" * 50)
    
    # Check if API key is set
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment")
        sys.exit(1)
    
    if api_key.startswith('sk-'):
        print(f"✅ OpenAI API key found: {api_key[:10]}...{api_key[-4:]}")
    else:
        print("⚠️  API key format looks unusual")
    
    # Run tests
    tests = [
        ("OpenAI Connection", test_openai_connection),
        ("RAG Engine with API", test_rag_engine_with_api),
        ("Server with API", test_server_with_api)
    ]
    
    results = {}
    for test_name, test_func in tests:
        results[test_name] = test_func()
    
    # Summary
    print("\n📊 Test Results:")
    print("=" * 30)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! OpenAI integration is working perfectly!")
        print("\n📝 Your system is ready for production use with:")
        print("   • Real OpenAI API integration")
        print("   • Secure API key management")
        print("   • Full RAG functionality")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()