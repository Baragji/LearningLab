#!/usr/bin/env python3
"""
Quick syntax test for agentic RAG components
"""
import sys
import traceback

def test_imports():
    """Test that all agentic components can be imported"""
    failures = []
    success = True
    
    # Test QueryPlanner import
    try:
        from src.agents.planner.query_planner import QueryPlanner, QueryComplexity
        print("✅ QueryPlanner import successful")
    except Exception as e:
        print(f"❌ QueryPlanner import failed: {e}")
        traceback.print_exc()
        failures.append(f"QueryPlanner: {str(e)}")
        success = False
    
    # Test RetrieverAgent import
    try:
        from src.agents.retriever.retriever_agent import RetrieverAgent
        print("✅ RetrieverAgent import successful")
    except Exception as e:
        print(f"❌ RetrieverAgent import failed: {e}")
        traceback.print_exc()
        failures.append(f"RetrieverAgent: {str(e)}")
        success = False
    
    # Test SynthesizerAgent import
    try:
        from src.agents.synthesizer.synthesizer_agent import SynthesizerAgent
        print("✅ SynthesizerAgent import successful")
    except Exception as e:
        print(f"❌ SynthesizerAgent import failed: {e}")
        traceback.print_exc()
        failures.append(f"SynthesizerAgent: {str(e)}")
        success = False
    
    # Test ValidatorAgent import
    try:
        from src.agents.validator.validator_agent import ValidatorAgent
        print("✅ ValidatorAgent import successful")
    except Exception as e:
        print(f"❌ ValidatorAgent import failed: {e}")
        traceback.print_exc()
        failures.append(f"ValidatorAgent: {str(e)}")
        success = False
    
    # Test AgenticRAG import
    try:
        from src.agents.agentic_rag import AgenticRAG
        print("✅ AgenticRAG import successful")
    except Exception as e:
        print(f"❌ AgenticRAG import failed: {e}")
        traceback.print_exc()
        failures.append(f"AgenticRAG: {str(e)}")
        success = False
    
    if failures:
        print("\nSummary of failures:")
        for failure in failures:
            print(f"  - {failure}")
    
    return success

def test_basic_functionality():
    """Test basic functionality"""
    failures = []
    success = True
    
    try:
        from src.agents.planner.query_planner import QueryPlanner, QueryComplexity
        
        # Test QueryPlanner initialization
        try:
            planner = QueryPlanner()
            print("✅ QueryPlanner initialized")
        except Exception as e:
            print(f"❌ QueryPlanner initialization failed: {e}")
            traceback.print_exc()
            failures.append(f"QueryPlanner initialization: {str(e)}")
            success = False
            return False  # Can't continue without planner
        
        # Test complexity analysis
        try:
            simple_complexity = planner._analyze_complexity("What is a function?")
            print(f"✅ Simple query complexity: {simple_complexity}")
        except Exception as e:
            print(f"❌ Simple complexity analysis failed: {e}")
            traceback.print_exc()
            failures.append(f"Simple complexity analysis: {str(e)}")
            success = False
        
        try:
            complex_complexity = planner._analyze_complexity("Analyze the architecture patterns for scalable microservices")
            print(f"✅ Complex query complexity: {complex_complexity}")
        except Exception as e:
            print(f"❌ Complex complexity analysis failed: {e}")
            traceback.print_exc()
            failures.append(f"Complex complexity analysis: {str(e)}")
            success = False
        
        if failures:
            print("\nSummary of functionality failures:")
            for failure in failures:
                print(f"  - {failure}")
        
        return success
        
    except Exception as e:
        print(f"❌ Functionality test error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing Agentic RAG Components...")
    print("=" * 50)
    
    # Set Python path to include the project root
    import os
    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
        print(f"Added {project_root} to Python path")
    
    # Test imports
    print("\n📦 Testing imports...")
    import_success = test_imports()
    
    if import_success:
        print("\n🔧 Testing basic functionality...")
        func_success = test_basic_functionality()
        
        if func_success:
            print("\n🎉 All tests passed! Agentic RAG components are working correctly.")
        else:
            print("\n❌ Functionality tests failed.")
    else:
        print("\n❌ Import tests failed.")