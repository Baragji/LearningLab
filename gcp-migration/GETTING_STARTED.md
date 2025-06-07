# 🚀 Getting Started Guide - Agentic RAG System

This guide provides a quick introduction to working with the Agentic RAG system.

## 📋 Prerequisites

- **Python 3.8+** 
- **OpenAI API Key** (required for embeddings and LLM)
- **TigerGraph** (optional, for advanced graph capabilities)

## 🔧 Installation

### 1. Set Up Environment

```bash
# Clone the repository
cd /path/to/your/projects
git clone https://github.com/yourusername/LearningLab.git
cd LearningLab/gcp-migration

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On Unix/macOS
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file with your API keys:

```bash
# Create .env file
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key
TIGERGRAPH_HOST=localhost
TIGERGRAPH_PORT=14240
TIGERGRAPH_USERNAME=tigergraph
TIGERGRAPH_PASSWORD=tigergraph123
TIGERGRAPH_GRAPH=RAGKnowledgeGraph
EOF
```

## 🏃‍♂️ Quick Start

### 1. Run the Demo Script

```bash
# Run the demo with sample queries
python demo_agentic_rag.py

# Or run in interactive mode
python demo_agentic_rag.py --interactive
```

### 2. Adding Your Own Documents

```python
import asyncio
from src.rag_engine_openai import RAGEngine

async def add_documents():
    # Initialize RAG Engine
    rag_engine = RAGEngine(
        embedding_model="text-embedding-3-small",
        llm_model="gpt-3.5-turbo",
        chromadb_path="data/chromadb/"
    )
    await rag_engine.initialize()
    
    # Add a document
    await rag_engine.add_document(
        content="Your code or text content here",
        file_path="path/to/file.py",
        file_type="python",
        project="your-project"
    )
    
    print("Document added successfully!")

# Run the function
asyncio.run(add_documents())
```

### 3. Using the Agentic RAG System

```python
import asyncio
from src.agents.agentic_rag import create_agentic_rag, RAGContext
from src.graph.query_engine import GraphQueryEngine
from src.graph.tigergraph_client import TigerGraphClient, GraphConfig
from src.rag_engine_openai import RAGEngine

async def query_example():
    # Initialize components
    rag_engine = RAGEngine(
        embedding_model="text-embedding-3-small",
        llm_model="gpt-3.5-turbo",
        chromadb_path="data/chromadb/"
    )
    await rag_engine.initialize()
    
    # Setup graph components (using minimal configuration)
    graph_config = GraphConfig(
        host="localhost",
        port=14240,
        graph_name="RAGKnowledgeGraph"
    )
    graph_client = TigerGraphClient(graph_config)
    query_engine = GraphQueryEngine(graph_client)
    
    # Create Agentic RAG system
    agentic_rag = await create_agentic_rag(
        graph_query_engine=query_engine,
        graph_client=graph_client,
        vector_rag_engine=rag_engine
    )
    
    # Create query context
    context = RAGContext(
        query="Explain how the authentication system works",
        user_context={"language": "python"}
    )
    
    # Execute query
    response = await agentic_rag.query(context)
    
    # Use the response
    print(f"Answer: {response.answer}")
    print(f"Confidence: {response.confidence}")
    print(f"Sources: {len(response.sources)}")

# Run the function
asyncio.run(query_example())
```

## 🧪 Running Tests

```bash
# Run unit tests
python -m pytest src/agents/test_agentic_rag.py -v

# Run comprehensive test suite
python test_agentic_rag_comprehensive.py
```

## 📚 Core Components

### QueryPlanner

The QueryPlanner analyzes queries and determines the best approach:

```python
from src.agents.planner.query_planner import QueryPlanner

planner = QueryPlanner()
query_plan = await planner.create_plan("How does authentication work?")

print(f"Complexity: {query_plan.complexity}")
print(f"Strategy: {query_plan.synthesis_strategy}")
print(f"Steps: {len(query_plan.steps)}")
```

### RetrieverAgent

The RetrieverAgent handles document retrieval with multiple strategies:

```python
from src.agents.retriever.retriever_agent import RetrieverAgent

retriever = RetrieverAgent(query_engine, graph_client)
results = await retriever.execute_retrieval_step(step, query)

print(f"Found {len(results.documents)} documents")
print(f"Confidence: {results.confidence}")
```

### SynthesizerAgent

The SynthesizerAgent creates answers from retrieved information:

```python
from src.agents.synthesizer.synthesizer_agent import SynthesizerAgent

synthesizer = SynthesizerAgent(vector_rag_engine)
result = await synthesizer.synthesize(query, retrieval_results, synthesis_strategy)

print(f"Answer: {result.answer}")
print(f"Reasoning Steps: {result.reasoning_steps}")
```

### ValidatorAgent

The ValidatorAgent ensures high-quality responses:

```python
from src.agents.validator.validator_agent import ValidatorAgent

validator = ValidatorAgent()
validation = await validator.validate(query, synthesis_result, retrieval_results)

print(f"Quality Score: {validation.quality_score}")
print(f"Needs Refinement: {validation.needs_refinement}")
```

## 📈 Performance Optimization

### Caching Retrieval Results

The system automatically caches retrieval results, but you can optimize further:

```python
# Preload frequent queries
common_queries = [
    "How does authentication work?",
    "Explain database connections",
    "Show user registration code"
]

for query in common_queries:
    context = RAGContext(query=query, query_type="preload")
    await agentic_rag.query(context)
```

### Parallel Processing

The system automatically parallelizes independent retrieval steps. To maximize this benefit, ensure your TigerGraph instance has sufficient resources for concurrent queries.

## 🔍 Troubleshooting

### Common Issues

1. **Low Confidence Scores**
   - Add more relevant documents to the RAG system
   - Refine your queries to be more specific

2. **Slow Response Times**
   - Check OpenAI API latency
   - Optimize TigerGraph queries
   - Use smaller, more focused documents

3. **Connection Errors**
   - Verify TigerGraph is running
   - Check environment variables
   - Ensure network connectivity

## 🎯 Next Steps

- Check the [Developer Guide](./DEVELOPER_GUIDE.md) for more advanced usage
- Explore custom strategy implementation in the agent components
- Try adding domain-specific knowledge to improve results

---

**Happy coding with Agentic RAG!** 🚀