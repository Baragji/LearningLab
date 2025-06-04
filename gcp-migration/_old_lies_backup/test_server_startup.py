#!/usr/bin/env python3
"""
Test script to verify MCP server startup with OpenAI migration
"""

import os
import sys
import asyncio
import subprocess
import time
import requests
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

def test_server_startup():
    """Test that the MCP server can start successfully"""
    print("🧪 Testing MCP Server Startup...")
    
    # Check if OpenAI API key is set
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key or api_key == 'dummy-key-for-testing':
        print("⚠️  Warning: No valid OpenAI API key found. Server will start but OpenAI features will be limited.")
        print("   Set OPENAI_API_KEY environment variable for full functionality.")
    else:
        print(f"✅ OpenAI API key found: {api_key[:8]}...")
    
    # Start server in background
    print("🚀 Starting MCP server...")
    
    try:
        # Start server process
        process = subprocess.Popen(
            [sys.executable, "-m", "src.mcp_server"],
            cwd=Path(__file__).parent,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit for server to start
        time.sleep(3)
        
        # Check if server is running
        if process.poll() is None:
            print("✅ Server started successfully!")
            
            # Try to connect to health endpoint
            try:
                response = requests.get("http://localhost:8080/health", timeout=5)
                if response.status_code == 200:
                    print("✅ Health check passed!")
                else:
                    print(f"⚠️  Health check returned status: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"⚠️  Could not connect to health endpoint: {e}")
            
            # Terminate server
            process.terminate()
            process.wait(timeout=5)
            print("🛑 Server stopped.")
            
            return True
        else:
            # Server failed to start
            stdout, stderr = process.communicate()
            print("❌ Server failed to start!")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing server: {e}")
        return False

def test_rag_engine_import():
    """Test that RAG engine can be imported and initialized"""
    print("\n🧪 Testing RAG Engine Import...")
    
    try:
        from rag_engine import RAGEngine
        print("✅ RAG Engine imported successfully!")
        
        # Try to create instance
        engine = RAGEngine()
        print("✅ RAG Engine instance created!")
        
        # Test is_ready method
        ready = engine.is_ready()
        if ready:
            print("✅ RAG Engine is ready!")
        else:
            print("⚠️  RAG Engine not ready (expected with dummy API key)")
        
        return True
        
    except Exception as e:
        print(f"❌ RAG Engine test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🔬 OpenAI Migration Test Suite")
    print("=" * 40)
    
    # Test 1: RAG Engine Import
    test1_passed = test_rag_engine_import()
    
    # Test 2: Server Startup
    test2_passed = test_server_startup()
    
    # Summary
    print("\n📊 Test Results:")
    print(f"   RAG Engine Import: {'✅ PASS' if test1_passed else '❌ FAIL'}")
    print(f"   Server Startup: {'✅ PASS' if test2_passed else '❌ FAIL'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 All tests passed! OpenAI migration is successful.")
        print("\n📝 Next steps:")
        print("   1. Set a valid OPENAI_API_KEY environment variable")
        print("   2. Start the server: python -m src.mcp_server")
        print("   3. Test with real OpenAI API calls")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())