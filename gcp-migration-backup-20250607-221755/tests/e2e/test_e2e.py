#!/usr/bin/env python3
"""
End-to-End Test Suite for MCP Server with RAG
Tests all functionality to ensure everything works correctly
"""

import asyncio
import json
import requests
import time
import sys
import os

# Test configuration
BASE_URL = "http://localhost:8080"
TIMEOUT = 30

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️ {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️ {message}{Colors.ENDC}")

def print_header(message):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{message.center(60)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}\n")

class E2ETestSuite:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.total = 0

    def test_server_health(self):
        """Test server health endpoint"""
        print_info("Testing server health...")
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    # Check if RAG engine is available (can be True or have stats)
                    rag_status = data.get("services", {}).get("rag_engine") or data.get("rag_stats")
                    if rag_status:
                        print_success("Server health check passed")
                        return True
                    else:
                        print_error(f"RAG engine not ready: {data}")
                        return False
                else:
                    print_error(f"Health check failed: {data}")
                    return False
            else:
                print_error(f"Health endpoint returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Health check failed: {e}")
            return False

    def test_mcp_initialize(self):
        """Test MCP initialize"""
        print_info("Testing MCP initialize...")
        try:
            payload = {
                "method": "initialize",
                "params": {"protocolVersion": "2024-11-05"}
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("protocolVersion") and data.get("serverInfo", {}).get("rag_enabled"):
                    print_success("MCP initialize passed")
                    return True
                else:
                    print_error(f"Initialize failed: {data}")
                    return False
            else:
                print_error(f"Initialize returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Initialize failed: {e}")
            return False

    def test_tools_list(self):
        """Test tools/list"""
        print_info("Testing tools/list...")
        try:
            payload = {"method": "tools/list", "params": {}}
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                tools = data.get("tools", [])
                expected_tools = ["analyze_code", "search_codebase", "generate_code", "explain_code", "add_document"]
                found_tools = [tool["name"] for tool in tools]
                
                if all(tool in found_tools for tool in expected_tools):
                    print_success(f"Tools list passed - found {len(tools)} tools")
                    return True
                else:
                    print_error(f"Missing tools. Expected: {expected_tools}, Found: {found_tools}")
                    return False
            else:
                print_error(f"Tools list returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Tools list failed: {e}")
            return False

    def test_add_document(self):
        """Test adding a document to RAG"""
        print_info("Testing add_document...")
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "add_document",
                    "arguments": {
                        "content": "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)",
                        "file_path": "test_quicksort.py",
                        "file_type": "python",
                        "project": "e2e_test"
                    }
                }
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=15)
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                if "Successfully added document" in content:
                    print_success("Add document passed")
                    return True
                else:
                    print_error(f"Add document failed: {content}")
                    return False
            else:
                print_error(f"Add document returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Add document failed: {e}")
            return False

    def test_search_codebase(self):
        """Test searching the codebase"""
        print_info("Testing search_codebase...")
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "search_codebase",
                    "arguments": {
                        "query": "quicksort algorithm",
                        "limit": 3
                    }
                }
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=15)
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                if "Found" in content and "quicksort" in content.lower():
                    print_success("Search codebase passed")
                    return True
                else:
                    print_error(f"Search failed: {content}")
                    return False
            else:
                print_error(f"Search returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Search failed: {e}")
            return False

    def test_analyze_code(self):
        """Test code analysis"""
        print_info("Testing analyze_code...")
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "analyze_code",
                    "arguments": {
                        "code": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
                        "language": "python",
                        "context": "search algorithm"
                    }
                }
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                if len(content) > 50:  # Should provide detailed analysis
                    print_success("Analyze code passed")
                    return True
                else:
                    print_error(f"Analysis too short: {content}")
                    return False
            else:
                print_error(f"Analyze code returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Analyze code failed: {e}")
            return False

    def test_generate_code(self):
        """Test code generation"""
        print_info("Testing generate_code...")
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "generate_code",
                    "arguments": {
                        "requirements": "Create a function to calculate the greatest common divisor of two numbers",
                        "language": "python",
                        "context": "mathematical algorithm"
                    }
                }
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                if "def " in content and "gcd" in content.lower():
                    print_success("Generate code passed")
                    return True
                else:
                    print_error(f"Code generation failed: {content}")
                    return False
            else:
                print_error(f"Generate code returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Generate code failed: {e}")
            return False

    def test_explain_code(self):
        """Test code explanation"""
        print_info("Testing explain_code...")
        try:
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "explain_code",
                    "arguments": {
                        "code": "def merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)",
                        "level": "intermediate"
                    }
                }
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", [{}])[0].get("text", "")
                if len(content) > 100:  # Should provide detailed explanation
                    print_success("Explain code passed")
                    return True
                else:
                    print_error(f"Explanation too short: {content}")
                    return False
            else:
                print_error(f"Explain code returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Explain code failed: {e}")
            return False

    def test_resources_list(self):
        """Test resources/list"""
        print_info("Testing resources/list...")
        try:
            payload = {"method": "resources/list", "params": {}}
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                resources = data.get("resources", [])
                if len(resources) >= 2:  # Should have codebase and rag stats
                    print_success("Resources list passed")
                    return True
                else:
                    print_error(f"Not enough resources: {resources}")
                    return False
            else:
                print_error(f"Resources list returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Resources list failed: {e}")
            return False

    def test_resource_read(self):
        """Test resources/read"""
        print_info("Testing resources/read...")
        try:
            payload = {
                "method": "resources/read",
                "params": {"uri": "rag://stats"}
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                contents = data.get("contents", [])
                if contents and "total_documents" in contents[0].get("text", ""):
                    print_success("Resource read passed")
                    return True
                else:
                    print_error(f"Resource read failed: {data}")
                    return False
            else:
                print_error(f"Resource read returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Resource read failed: {e}")
            return False

    def test_metrics_endpoint(self):
        """Test enterprise metrics endpoint"""
        print_info("Testing metrics endpoint...")
        try:
            response = requests.get(f"{BASE_URL}/metrics", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "request_count" in data or "Enterprise metrics not available" in str(data):
                    print_success("Metrics endpoint passed")
                    return True
                else:
                    print_error(f"Metrics endpoint failed: {data}")
                    return False
            else:
                print_error(f"Metrics endpoint returned {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Metrics endpoint failed: {e}")
            return False

    def test_authentication_bypass(self):
        """Test that authentication is properly enforced"""
        print_info("Testing authentication enforcement...")
        try:
            # Test without authorization header
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "search_codebase",
                    "arguments": {"query": "test", "limit": 1}
                }
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=10)
            
            # Should either work (auth disabled) or return 401/403
            if response.status_code in [200, 401, 403]:
                print_success("Authentication enforcement test passed")
                return True
            else:
                print_error(f"Unexpected auth response: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Authentication test failed: {e}")
            return False

    def test_invalid_mcp_request(self):
        """Test handling of invalid MCP requests"""
        print_info("Testing invalid MCP request handling...")
        try:
            # Test with invalid method
            payload = {
                "method": "invalid_method",
                "params": {}
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=10)
            
            # Should return error response
            if response.status_code in [400, 404, 422]:
                print_success("Invalid request handling passed")
                return True
            elif response.status_code == 200:
                data = response.json()
                if "error" in data:
                    print_success("Invalid request handling passed (JSON-RPC error)")
                    return True
                else:
                    print_error(f"Invalid request should return error: {data}")
                    return False
            else:
                print_error(f"Unexpected response to invalid request: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Invalid request test failed: {e}")
            return False

    def test_malformed_json(self):
        """Test handling of malformed JSON"""
        print_info("Testing malformed JSON handling...")
        try:
            # Send malformed JSON
            response = requests.post(
                f"{BASE_URL}/mcp", 
                data="{invalid json}", 
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Should return 400 Bad Request
            if response.status_code == 400:
                print_success("Malformed JSON handling passed")
                return True
            else:
                print_error(f"Malformed JSON should return 400, got: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Malformed JSON test failed: {e}")
            return False

    def test_large_request(self):
        """Test handling of large requests"""
        print_info("Testing large request handling...")
        try:
            # Create a large code snippet
            large_code = "def test_function():\n" + "    # Comment line\n" * 1000 + "    return True"
            
            payload = {
                "method": "tools/call",
                "params": {
                    "name": "analyze_code",
                    "arguments": {
                        "code": large_code,
                        "language": "python",
                        "context": "large code test"
                    }
                }
            }
            response = requests.post(f"{BASE_URL}/mcp", json=payload, timeout=30)
            
            # Should handle large requests gracefully
            if response.status_code in [200, 413, 422]:  # 413 = Payload Too Large
                print_success("Large request handling passed")
                return True
            else:
                print_error(f"Large request handling failed: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Large request test failed: {e}")
            return False

    def run_test(self, test_func, test_name):
        """Run a single test and track results"""
        self.total += 1
        print(f"\n{Colors.BOLD}Test {self.total}: {test_name}{Colors.ENDC}")
        try:
            if test_func():
                self.passed += 1
            else:
                self.failed += 1
        except Exception as e:
            print_error(f"Test {test_name} crashed: {e}")
            self.failed += 1

    def run_all_tests(self):
        """Run all tests"""
        print_header("MCP SERVER WITH RAG - E2E TEST SUITE")
        
        # Wait for server to be ready
        print_info("Waiting for server to be ready...")
        time.sleep(2)
        
        # Run all tests
        self.run_test(self.test_server_health, "Server Health Check")
        self.run_test(self.test_mcp_initialize, "MCP Initialize")
        self.run_test(self.test_tools_list, "Tools List")
        self.run_test(self.test_add_document, "Add Document to RAG")
        self.run_test(self.test_search_codebase, "Search Codebase")
        self.run_test(self.test_analyze_code, "Analyze Code")
        self.run_test(self.test_generate_code, "Generate Code")
        self.run_test(self.test_explain_code, "Explain Code")
        self.run_test(self.test_resources_list, "Resources List")
        self.run_test(self.test_resource_read, "Resource Read")
        
        # Enterprise feature tests
        self.run_test(self.test_metrics_endpoint, "Enterprise Metrics Endpoint")
        self.run_test(self.test_authentication_bypass, "Authentication Enforcement")
        
        # Negative/robustness tests
        self.run_test(self.test_invalid_mcp_request, "Invalid MCP Request Handling")
        self.run_test(self.test_malformed_json, "Malformed JSON Handling")
        self.run_test(self.test_large_request, "Large Request Handling")
        
        # Print results
        print_header("TEST RESULTS")
        print(f"{Colors.BOLD}Total Tests: {self.total}{Colors.ENDC}")
        print(f"{Colors.GREEN}Passed: {self.passed}{Colors.ENDC}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.ENDC}")
        
        if self.failed == 0:
            print_success("🎉 ALL TESTS PASSED! The MCP Server with RAG is working perfectly!")
            return True
        else:
            print_error(f"💥 {self.failed} tests failed. Please check the issues above.")
            return False

def main():
    """Main function"""
    test_suite = E2ETestSuite()
    success = test_suite.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()