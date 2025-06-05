#!/usr/bin/env python3
"""
Test suite to verify MCP Enterprise Master agent readiness
Validates all required components before mission start
"""

import os
import sys
import json
import subprocess
import requests
from pathlib import Path

class AgentReadinessTest:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.results = []
        
    def log_result(self, test_name, passed, message=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })
        print(f"{status} {test_name}: {message}")
        
    def test_file_structure(self):
        """Test required file structure exists"""
        required_files = [
            ".trae/mcp-config.json",
            ".trae/enterprise-agent-prompt.md",
            "MCP_ENTERPRISE_STATUS.md",
            "gcp-migration/MCPENTEPRISE.md",
            "gcp-migration/src/mcp_server_with_rag.py",
            "gcp-migration/src/rag_engine_openai.py",
            "gcp-migration/test_e2e.py"
        ]
        
        missing_files = []
        for file_path in required_files:
            full_path = self.project_root / file_path
            if not full_path.exists():
                missing_files.append(file_path)
                
        if missing_files:
            self.log_result(
                "File Structure", 
                False, 
                f"Missing files: {', '.join(missing_files)}"
            )
        else:
            self.log_result("File Structure", True, "All required files present")
            
    def test_mcp_config_valid(self):
        """Test MCP configuration is valid JSON"""
        try:
            config_path = self.project_root / ".trae/mcp-config.json"
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            # Check enterprise mission config
            if "enterprise_mission" in config:
                self.log_result("MCP Config", True, "Valid JSON with enterprise mission config")
            else:
                self.log_result("MCP Config", False, "Missing enterprise_mission section")
                
        except json.JSONDecodeError as e:
            self.log_result("MCP Config", False, f"Invalid JSON: {e}")
        except FileNotFoundError:
            self.log_result("MCP Config", False, "Config file not found")
            
    def test_python_dependencies(self):
        """Test required Python dependencies are available"""
        required_packages = [
            "fastapi",
            "uvicorn",
            "openai", 
            "chromadb",
            "pytest",
            "requests"
        ]
        
        missing_packages = []
        for package in required_packages:
            try:
                __import__(package)
            except ImportError:
                missing_packages.append(package)
                
        if missing_packages:
            self.log_result(
                "Python Dependencies", 
                False, 
                f"Missing packages: {', '.join(missing_packages)}"
            )
        else:
            self.log_result("Python Dependencies", True, "All required packages available")
            
    def test_mcp_server_startup(self):
        """Test MCP server can start"""
        try:
            # Change to gcp-migration directory
            os.chdir(self.project_root / "gcp-migration")
            
            # Try to import the server module
            sys.path.insert(0, str(self.project_root / "gcp-migration/src"))
            
            try:
                import mcp_server_with_rag
                self.log_result("MCP Server Import", True, "Server module imports successfully")
            except ImportError as e:
                self.log_result("MCP Server Import", False, f"Import error: {e}")
                return
                
            # Test if we can create the FastAPI app
            try:
                app = mcp_server_with_rag.app
                self.log_result("MCP Server App", True, "FastAPI app created successfully")
            except Exception as e:
                self.log_result("MCP Server App", False, f"App creation error: {e}")
                
        except Exception as e:
            self.log_result("MCP Server Startup", False, f"Startup error: {e}")
        finally:
            os.chdir(self.project_root)
            
    def test_git_repository(self):
        """Test git repository is properly configured"""
        try:
            # Check if we're in a git repo
            result = subprocess.run(
                ["git", "status"], 
                capture_output=True, 
                text=True,
                cwd=self.project_root
            )
            
            if result.returncode == 0:
                self.log_result("Git Repository", True, "Git repository is properly configured")
            else:
                self.log_result("Git Repository", False, "Not a git repository or git not available")
                
        except FileNotFoundError:
            self.log_result("Git Repository", False, "Git command not found")
            
    def test_environment_variables(self):
        """Test required environment variables"""
        required_env_vars = [
            "OPENAI_API_KEY"
        ]
        
        missing_vars = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_vars.append(var)
                
        if missing_vars:
            self.log_result(
                "Environment Variables", 
                False, 
                f"Missing variables: {', '.join(missing_vars)}"
            )
        else:
            self.log_result("Environment Variables", True, "All required variables set")
            
    def test_docker_availability(self):
        """Test Docker is available for containerization phase"""
        try:
            result = subprocess.run(
                ["docker", "--version"], 
                capture_output=True, 
                text=True
            )
            
            if result.returncode == 0:
                self.log_result("Docker", True, f"Docker available: {result.stdout.strip()}")
            else:
                self.log_result("Docker", False, "Docker command failed")
                
        except FileNotFoundError:
            self.log_result("Docker", False, "Docker not installed or not in PATH")
            
    def run_all_tests(self):
        """Run all readiness tests"""
        print("🚀 Running MCP Enterprise Master Agent Readiness Tests\n")
        
        self.test_file_structure()
        self.test_mcp_config_valid()
        self.test_python_dependencies()
        self.test_mcp_server_startup()
        self.test_git_repository()
        self.test_environment_variables()
        self.test_docker_availability()
        
        # Summary
        passed_tests = sum(1 for r in self.results if r["passed"])
        total_tests = len(self.results)
        
        print(f"\n📊 Test Summary: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("✅ Agent is ready for MCP Enterprise mission!")
            return True
        else:
            print("❌ Agent readiness issues detected. Please fix before starting mission.")
            print("\nFailed tests:")
            for result in self.results:
                if not result["passed"]:
                    print(f"  - {result['test']}: {result['message']}")
            return False

if __name__ == "__main__":
    tester = AgentReadinessTest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)