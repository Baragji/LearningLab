#!/usr/bin/env python3
"""
Test script for Phase 3 RAG implementation
Tests all new features and tools
"""

import asyncio
import json
import time
import requests
from typing import Dict, Any

class Phase3Tester:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": time.time()
        })
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                rag_ready = data.get("services", {}).get("rag_engine", False)
                self.log_test("Health Check", True, f"RAG Engine Ready: {rag_ready}")
                return data
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return None
    
    def test_stats_endpoint(self):
        """Test stats endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/stats")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Stats Endpoint", True, f"Collections: {data.get('rag_engine', {}).get('total_collections', 0)}")
                return data
            else:
                self.log_test("Stats Endpoint", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Stats Endpoint", False, str(e))
            return None
    
    def test_mcp_initialize(self):
        """Test MCP initialize"""
        try:
            payload = {"method": "initialize", "params": {}}
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                version = data.get("protocolVersion")
                self.log_test("MCP Initialize", True, f"Protocol Version: {version}")
                return data
            else:
                self.log_test("MCP Initialize", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("MCP Initialize", False, str(e))
            return None
    
    def test_tools_list(self):
        """Test tools list"""
        try:
            payload = {"method": "tools/list"}
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                tools = data.get("tools", [])
                tool_names = [tool["name"] for tool in tools]
                self.log_test("Tools List", True, f"Tools: {', '.join(tool_names)}")
                return tools
            else:
                self.log_test("Tools List", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Tools List", False, str(e))
            return None
    
    def test_analyze_code(self):
        """Test analyze_code tool"""
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "analyze_code",
                    "arguments": {
                        "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
                        "language": "python",
                        "analysis_type": "performance"
                    }
                }
            }
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                success = len(content) > 50  # Basic check for meaningful response
                self.log_test("Analyze Code", success, f"Response length: {len(content)} chars")
                return data
            else:
                self.log_test("Analyze Code", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Analyze Code", False, str(e))
            return None
    
    def test_search_codebase(self):
        """Test search_codebase tool"""
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "search_codebase",
                    "arguments": {
                        "query": "fibonacci algorithm",
                        "limit": 3
                    }
                }
            }
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                success = "search" in content.lower() or "found" in content.lower()
                self.log_test("Search Codebase", success, f"Response contains search results")
                return data
            else:
                self.log_test("Search Codebase", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Search Codebase", False, str(e))
            return None
    
    def test_generate_code(self):
        """Test generate_code tool"""
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "generate_code",
                    "arguments": {
                        "requirements": "Create a simple function to calculate the square of a number",
                        "language": "python",
                        "use_codebase_context": True
                    }
                }
            }
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                success = "def " in content or "function" in content
                self.log_test("Generate Code", success, f"Generated code contains function definition")
                return data
            else:
                self.log_test("Generate Code", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Generate Code", False, str(e))
            return None
    
    def test_explain_code(self):
        """Test explain_code tool"""
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "explain_code",
                    "arguments": {
                        "code": "list(map(lambda x: x**2, range(10)))",
                        "level": "intermediate"
                    }
                }
            }
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                success = len(content) > 50 and ("map" in content.lower() or "lambda" in content.lower())
                self.log_test("Explain Code", success, f"Explanation contains relevant terms")
                return data
            else:
                self.log_test("Explain Code", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Explain Code", False, str(e))
            return None
    
    def test_refactor_code(self):
        """Test refactor_code tool"""
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "refactor_code",
                    "arguments": {
                        "code": "def calc(a, b, c): return a + b * c",
                        "language": "python",
                        "focus": "readability"
                    }
                }
            }
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                success = len(content) > 50
                self.log_test("Refactor Code", success, f"Refactoring suggestions provided")
                return data
            else:
                self.log_test("Refactor Code", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Refactor Code", False, str(e))
            return None
    
    def test_find_similar_code(self):
        """Test find_similar_code tool"""
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "find_similar_code",
                    "arguments": {
                        "code": "class DatabaseConnection:",
                        "similarity_threshold": 0.7,
                        "limit": 3
                    }
                }
            }
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                success = len(content) > 20
                self.log_test("Find Similar Code", success, f"Similar code search completed")
                return data
            else:
                self.log_test("Find Similar Code", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Find Similar Code", False, str(e))
            return None
    
    def test_file_upload(self):
        """Test file upload functionality"""
        try:
            # Create a test file
            test_code = """
def hello_world():
    '''A simple hello world function'''
    print("Hello, World!")
    return "Hello, World!"

if __name__ == "__main__":
    hello_world()
"""
            
            files = {'file': ('test_hello.py', test_code, 'text/plain')}
            data = {'language': 'python', 'collection': 'test'}
            
            response = self.session.post(f"{self.base_url}/upload", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                chunks = result.get("chunks_created", 0)
                self.log_test("File Upload", True, f"Created {chunks} chunks")
                return result
            else:
                self.log_test("File Upload", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("File Upload", False, str(e))
            return None
    
    def test_resources_list(self):
        """Test resources list"""
        try:
            payload = {"method": "resources/list"}
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                resources = data.get("resources", [])
                resource_names = [res["name"] for res in resources]
                self.log_test("Resources List", True, f"Resources: {', '.join(resource_names)}")
                return resources
            else:
                self.log_test("Resources List", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Resources List", False, str(e))
            return None
    
    def test_prompts_list(self):
        """Test prompts list"""
        try:
            payload = {"method": "prompts/list"}
            response = self.session.post(f"{self.base_url}/mcp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                prompts = data.get("prompts", [])
                prompt_names = [prompt["name"] for prompt in prompts]
                self.log_test("Prompts List", True, f"Prompts: {', '.join(prompt_names)}")
                return prompts
            else:
                self.log_test("Prompts List", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Prompts List", False, str(e))
            return None
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting Phase 3 Test Suite")
        print("=" * 50)
        
        # Basic connectivity tests
        print("\n📡 Basic Connectivity Tests")
        self.test_health_check()
        self.test_stats_endpoint()
        
        # MCP Protocol tests
        print("\n🔌 MCP Protocol Tests")
        self.test_mcp_initialize()
        self.test_tools_list()
        self.test_resources_list()
        self.test_prompts_list()
        
        # Tool functionality tests
        print("\n🛠️ Tool Functionality Tests")
        self.test_analyze_code()
        self.test_search_codebase()
        self.test_generate_code()
        self.test_explain_code()
        self.test_refactor_code()
        self.test_find_similar_code()
        
        # File upload tests
        print("\n📁 File Upload Tests")
        self.test_file_upload()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed_tests == total_tests

def main():
    """Main test function"""
    import sys
    
    # Get base URL from command line or use default
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    
    print(f"🎯 Testing Phase 3 RAG implementation at: {base_url}")
    
    tester = Phase3Tester(base_url)
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Phase 3 is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()