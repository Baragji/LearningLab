# 👩‍💻 Developer Guide - Agentic RAG System

This comprehensive guide provides detailed information for developers who want to extend, customize, or enhance the Agentic RAG system.

## 🏗️ System Architecture

The Agentic RAG system consists of four main components that work together:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   QueryPlanner  │────▶│  RetrieverAgent │────▶│ SynthesizerAgent│────▶│  ValidatorAgent │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                      │                       │
         │                      │                      │                       │
         ▼                      ▼                      ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              AgenticRAG Orchestrator                                     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
         │                      │                      │                       │
         ▼                      ▼                      ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vector Store   │     │  Graph Database │     │   LLM Service   │     │  Monitoring     │
│   (ChromaDB)    │     │  (TigerGraph)   │     │    (OpenAI)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Data Flow

1. **Query Planning Phase**: The query is analyzed for complexity and intent
2. **Retrieval Phase**: Information is gathered using appropriate strategies 
3. **Synthesis Phase**: The retrieved information is processed into a coherent answer
4. **Validation Phase**: The answer is validated for quality and refined if needed

## 🧩 Core Components

### QueryPlanner

The QueryPlanner is responsible for analyzing the query and creating an execution plan.

**Key Files:**
- `src/agents/planner/query_planner.py`
- `src/agents/planner/__init__.py`

**Extension Points:**
- Add new complexity detection patterns
- Create new retrieval strategy selection rules
- Customize synthesis strategy selection logic
- Implement new query planning algorithms

**Example - Adding New Complexity Pattern:**

```python
def _init_complexity_patterns(self) -> Dict[QueryComplexity, List[str]]:
    patterns = super()._init_complexity_patterns()
    
    # Add new EXPERT patterns
    patterns[QueryComplexity.EXPERT].extend([
        "optimize performance",
        "scale architecture",
        "security vulnerabilities",
        "redesign system"
    ])
    
    return patterns
```

### RetrieverAgent

The RetrieverAgent executes retrieval operations using various strategies.

**Key Files:**
- `src/agents/retriever/retriever_agent.py`
- `src/agents/retriever/__init__.py`

**Extension Points:**
- Implement new retrieval strategies
- Enhance existing strategies
- Add custom document preprocessing
- Implement advanced result ranking

**Example - Creating a New Retrieval Strategy:**

```python
async def _custom_retrieval(self, query: str, step: RetrievalStep, 
                           context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Custom retrieval strategy combining semantic and pattern matching."""
    # Get semantic results
    semantic_results = await self._semantic_retrieval(query, step, context)
    
    # Extract patterns from the query
    patterns = self._extract_patterns(query)
    
    # Find documents matching patterns
    pattern_results = await self._find_pattern_matches(patterns)
    
    # Combine results with deduplication
    combined_results = self._combine_results(semantic_results, pattern_results)
    
    return combined_results
```

### SynthesizerAgent

The SynthesizerAgent creates coherent answers from retrieved information.

**Key Files:**
- `src/agents/synthesizer/synthesizer_agent.py`
- `src/agents/synthesizer/__init__.py`

**Extension Points:**
- Implement new synthesis strategies
- Enhance reasoning engines
- Add domain-specific knowledge integration
- Implement custom content generation

**Example - Implementing Domain-Specific Synthesis:**

```python
async def _domain_specific_synthesis(self, query: str, documents: List[Dict[str, Any]], 
                                    domain: str) -> str:
    """Generate domain-specific answers with specialized knowledge."""
    # Load domain-specific templates and knowledge
    domain_knowledge = self._load_domain_knowledge(domain)
    
    # Extract relevant information from documents
    relevant_info = self._extract_domain_relevant_info(documents, domain)
    
    # Generate answer using domain-specific approach
    prompt = self._create_domain_prompt(query, relevant_info, domain_knowledge)
    answer = await self._generate_llm_response(prompt)
    
    return answer
```

### ValidatorAgent

The ValidatorAgent ensures response quality through validation and refinement.

**Key Files:**
- `src/agents/validator/validator_agent.py`
- `src/agents/validator/__init__.py`

**Extension Points:**
- Add new validation dimensions
- Implement custom quality metrics
- Enhance refinement suggestions
- Create specialized validators for domains

**Example - Adding a New Validation Dimension:**

```python
async def _validate_technical_accuracy(self, answer: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate technical accuracy of code and technical concepts."""
    # Extract technical claims from answer
    technical_claims = self._extract_technical_claims(answer)
    
    # Check claims against sources
    validated_claims = []
    for claim in technical_claims:
        evidence = self._find_supporting_evidence(claim, sources)
        is_valid = len(evidence) > 0
        validated_claims.append({
            "claim": claim,
            "valid": is_valid,
            "evidence": evidence
        })
    
    # Calculate technical accuracy score
    valid_claims = sum(1 for c in validated_claims if c["valid"])
    accuracy_score = valid_claims / len(validated_claims) if validated_claims else 1.0
    
    return {
        "technical_accuracy_score": accuracy_score,
        "validated_claims": validated_claims
    }
```

### AgenticRAG Orchestrator

The Orchestrator coordinates the interactions between all agents.

**Key Files:**
- `src/agents/agentic_rag.py`
- `src/agents/__init__.py`

**Extension Points:**
- Customize agent interaction patterns
- Implement parallel processing optimizations
- Add monitoring and telemetry
- Create specialized orchestration workflows

**Example - Adding Telemetry:**

```python
async def query(self, context: RAGContext) -> RAGResponse:
    """Execute a RAG query with telemetry."""
    # Start telemetry
    trace_id = self._start_trace(context)
    
    try:
        # Execute query with original implementation
        result = await super().query(context)
        
        # Record successful execution
        self._record_success(trace_id, result)
        
        return result
    except Exception as e:
        # Record failure
        self._record_failure(trace_id, str(e))
        raise
    finally:
        # Complete telemetry
        self._end_trace(trace_id)
```

## 🔄 Common Extension Scenarios

### 1. Adding a New Retrieval Strategy

To add a new retrieval strategy:

1. Add the strategy to the `RetrievalStrategy` enum in `src/agents/planner/query_planner.py`
2. Implement the strategy in `RetrieverAgent` class
3. Update strategy selection logic in `QueryPlanner._init_strategy_rules()`
4. Add appropriate test cases

```python
# 1. Add to enum
class RetrievalStrategy(Enum):
    DIRECT = "direct"
    SEMANTIC = "semantic"
    GRAPH = "graph"
    HYBRID = "hybrid"
    ITERATIVE = "iterative"
    MY_NEW_STRATEGY = "my_new_strategy"  # Add your new strategy

# 2. Implement in RetrieverAgent
async def _execute_strategy(self, strategy: RetrievalStrategy, query: str,
                           step: RetrievalStep, context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    if strategy == RetrievalStrategy.MY_NEW_STRATEGY:
        return await self._my_new_strategy(query, step, context)
    # ... existing code ...

async def _my_new_strategy(self, query: str, step: RetrievalStep, 
                          context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    # Implement your strategy
    pass
```

### 2. Enhancing Query Planning Logic

To improve query planning:

1. Extend the `QueryPlanner._analyze_complexity()` method
2. Update the strategy selection rules
3. Add new planning algorithms

```python
def _analyze_complexity(self, query: str) -> QueryComplexity:
    # Original complexity analysis
    complexity = super()._analyze_complexity(query)
    
    # Enhanced analysis
    if self._requires_domain_expertise(query):
        return QueryComplexity.EXPERT
    
    if self._contains_technical_terms(query):
        return max(complexity, QueryComplexity.MODERATE)
    
    return complexity

def _requires_domain_expertise(self, query: str) -> bool:
    domain_terms = ["architecture", "system design", "performance optimization"]
    return any(term in query.lower() for term in domain_terms)

def _contains_technical_terms(self, query: str) -> bool:
    # Implement technical term detection
    pass
```

### 3. Adding Domain-Specific Capabilities

To add domain-specific capabilities:

1. Create domain detection in the query planner
2. Add domain-specific retrieval strategies
3. Implement domain-aware synthesis

```python
# In QueryPlanner
def _detect_domain(self, query: str) -> str:
    if any(term in query.lower() for term in ["security", "vulnerability", "encryption"]):
        return "security"
    if any(term in query.lower() for term in ["performance", "latency", "throughput"]):
        return "performance"
    return "general"

# In SynthesizerAgent
async def synthesize(self, query: str, retrieval_results: List[RetrievalResult],
                   strategy: SynthesisStrategy, context: Dict[str, Any] = None) -> SynthesisResult:
    # Detect domain if not in context
    domain = context.get("domain") if context else None
    if not domain:
        domain = self._detect_domain(query)
    
    # Use domain-specific synthesis if available
    if domain == "security" and hasattr(self, "_security_synthesis"):
        return await self._security_synthesis(query, retrieval_results, strategy, context)
    
    # Default synthesis
    return await super().synthesize(query, retrieval_results, strategy, context)
```

## 📊 Performance Optimization

### Vector Search Optimization

The system uses ChromaDB for vector search. To optimize performance:

1. Use appropriate chunk sizes (recommended: 512-1024 tokens)
2. Implement metadata filtering to narrow search space
3. Use parallel requests for multiple queries

```python
# Optimized retrieval with metadata filtering
async def _optimized_semantic_retrieval(self, query: str, metadata_filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Generate embedding for query
    embedding = await self._generate_embedding(query)
    
    # Execute search with metadata filters
    results = await self.vector_db.similarity_search_with_score_by_vector(
        embedding=embedding,
        k=10,
        filter=metadata_filters
    )
    
    return results
```

### Graph Query Optimization

For TigerGraph optimizations:

1. Use indexed vertex properties for filters
2. Limit result sets to necessary data
3. Optimize multi-hop queries with appropriate pruning

```python
# Optimized graph traversal
async def _optimized_graph_traversal(self, start_vertices: List[str], max_depth: int = 2) -> Dict:
    query = f"""
    USE GRAPH {self.graph_config.graph_name}
    
    CREATE QUERY optimized_traversal(SET<STRING> start_vertices, INT max_depth) FOR GRAPH {self.graph_config.graph_name} {{
        OrAccum @visited = false;
        SetAccum<VERTEX> @@results;
        
        start = {{ANY}};
        
        start = SELECT s FROM start:s
                WHERE s.id IN start_vertices;
        
        start = SELECT s FROM start:s
                POST-ACCUM s.@visited = true
                ACCUM @@results += s;
        
        FOREACH i IN RANGE[1, max_depth] DO
            next = SELECT t FROM start:s-(:e)->:t
                   WHERE NOT t.@visited
                   POST-ACCUM t.@visited = true
                   ACCUM @@results += t;
            
            IF next.size() == 0 THEN BREAK; END;
            
            start = next;
        END;
        
        PRINT @@results;
    }}
    
    INSTALL QUERY optimized_traversal
    """
    
    # Install query if needed
    if not await self.graph_client.has_query("optimized_traversal"):
        await self.graph_client.execute_gsql(query)
    
    # Execute optimized query
    result = await self.graph_client.run_installed_query(
        "optimized_traversal",
        params={"start_vertices": start_vertices, "max_depth": max_depth}
    )
    
    return result
```

### LLM Response Optimization

To optimize LLM performance:

1. Use efficient prompting techniques
2. Implement caching for common queries
3. Batch requests when possible

```python
# Efficient LLM prompting
async def _generate_efficient_response(self, query: str, context: List[Dict]) -> str:
    # Check cache first
    cache_key = self._generate_cache_key(query, context)
    cached_response = self._get_from_cache(cache_key)
    if cached_response:
        return cached_response
    
    # Create efficient prompt with clear instructions
    prompt = f"""
    You are an expert AI assistant for code and software architecture.
    
    CONTEXT:
    {self._format_context(context)}
    
    QUERY:
    {query}
    
    INSTRUCTIONS:
    - Be concise and clear
    - Focus only on information from the context
    - Structure your response with headers and bullet points
    - Provide code examples where appropriate
    
    RESPONSE:
    """
    
    # Generate response
    response = await self.llm.generate(prompt)
    
    # Cache response
    self._add_to_cache(cache_key, response)
    
    return response
```

## 🧪 Testing Strategies

### Unit Testing

For unit testing individual components:

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.mark.asyncio
async def test_query_planner_complexity_detection():
    """Test query complexity detection."""
    planner = QueryPlanner()
    
    # Test simple queries
    assert await planner._analyze_complexity("find functions that handle login") == QueryComplexity.SIMPLE
    
    # Test moderate queries
    assert await planner._analyze_complexity("explain how the authentication system works") == QueryComplexity.MODERATE
    
    # Test complex queries
    assert await planner._analyze_complexity("compare different approaches to authentication") == QueryComplexity.COMPLEX
    
    # Test expert queries
    assert await planner._analyze_complexity("design a secure and scalable authentication system") == QueryComplexity.EXPERT
```

### Integration Testing

For testing component interactions:

```python
@pytest.mark.asyncio
async def test_retrieval_synthesis_integration():
    """Test integration between retrieval and synthesis."""
    # Mock retriever
    retriever = AsyncMock()
    retriever.execute_retrieval_step.return_value = RetrievalResult(
        step_id="step1",
        strategy=RetrievalStrategy.SEMANTIC,
        documents=[{"content": "test content", "metadata": {}}],
        confidence=0.9
    )
    
    # Real synthesizer with mock LLM
    with patch("src.agents.synthesizer.synthesizer_agent.LLMClient") as mock_llm:
        mock_llm.return_value.generate.return_value = "Synthesized answer"
        
        synthesizer = SynthesizerAgent(mock_llm)
        
        # Test integration
        query = "test query"
        step = RetrievalStep(id="step1", strategy=RetrievalStrategy.SEMANTIC)
        retrieval_result = await retriever.execute_retrieval_step(step, query)
        
        synthesis_result = await synthesizer.synthesize(
            query, [retrieval_result], SynthesisStrategy.SIMPLE
        )
        
        assert synthesis_result.answer == "Synthesized answer"
        assert synthesis_result.confidence > 0
```

### Performance Testing

For measuring system performance:

```python
@pytest.mark.asyncio
async def test_agentic_rag_performance():
    """Test AgenticRAG performance."""
    # Create test system
    agentic_rag = create_test_agentic_rag()
    
    # Prepare test queries
    test_queries = [
        "simple query about authentication",
        "moderate query about system architecture",
        "complex query comparing authentication approaches"
    ]
    
    # Measure performance
    results = []
    for query in test_queries:
        context = RAGContext(query=query)
        
        start_time = time.time()
        response = await agentic_rag.query(context)
        execution_time = time.time() - start_time
        
        results.append({
            "query": query,
            "execution_time": execution_time,
            "confidence": response.confidence
        })
    
    # Assert performance meets requirements
    for result in results:
        assert result["execution_time"] < 5.0  # Max 5 seconds
        assert result["confidence"] > 0.7  # Min confidence 0.7
```

## 📚 Best Practices

### 1. Component Design

- Follow the single responsibility principle
- Use dependency injection for components
- Implement clear interfaces between components
- Favor composition over inheritance

### 2. Error Handling

- Implement graceful degradation
- Use appropriate error types
- Log detailed error information
- Provide user-friendly error messages

```python
try:
    result = await self._execute_complex_operation()
    return result
except GraphDatabaseError as e:
    logger.error(f"Graph database error: {str(e)}", exc_info=True)
    # Fall back to vector search
    return await self._fallback_to_vector_search()
except LLMServiceError as e:
    logger.error(f"LLM service error: {str(e)}", exc_info=True)
    # Use cached or template response
    return self._generate_fallback_response()
except Exception as e:
    logger.critical(f"Unexpected error: {str(e)}", exc_info=True)
    # Provide graceful error response
    return self._create_error_response("An unexpected error occurred.")
```

### 3. Asynchronous Programming

- Use `async`/`await` consistently
- Avoid blocking operations in async code
- Implement proper exception handling
- Use appropriate concurrency patterns

```python
async def process_parallel_tasks(self, tasks):
    """Execute multiple tasks in parallel with proper error handling."""
    results = []
    errors = []
    
    async def _safe_execute(task):
        try:
            return await task, None
        except Exception as e:
            return None, e
    
    # Execute tasks in parallel
    tasks = [_safe_execute(task) for task in tasks]
    outcomes = await asyncio.gather(*tasks)
    
    # Process results and errors
    for result, error in outcomes:
        if error:
            errors.append(error)
        else:
            results.append(result)
    
    return results, errors
```

### 4. Performance Monitoring

- Implement comprehensive logging
- Track key performance metrics
- Use structured logging for analysis
- Set up alerting for critical issues

```python
async def query(self, context: RAGContext) -> RAGResponse:
    """Execute a RAG query with performance monitoring."""
    metrics = {
        "query_length": len(context.query),
        "start_time": time.time()
    }
    
    logger.info(f"Processing query: {context.query}", extra={"query_id": id(context)})
    
    # Execute query planning
    plan_start = time.time()
    query_plan = await self.query_planner.create_plan(context.query, context=context.user_context)
    metrics["planning_time"] = time.time() - plan_start
    
    logger.info(f"Query plan created", extra={
        "query_id": id(context),
        "complexity": query_plan.complexity.value,
        "steps": len(query_plan.steps),
        "planning_time": metrics["planning_time"]
    })
    
    # Continue with execution...
    
    # Record final metrics
    metrics["total_time"] = time.time() - metrics["start_time"]
    metrics["confidence"] = response.confidence
    
    logger.info("Query processing completed", extra={
        "query_id": id(context),
        "metrics": metrics
    })
    
    return response
```

## 🔍 Debugging Techniques

### 1. Component-Level Debugging

Enable detailed logging for specific components:

```python
import logging

# Set component-specific logging
logging.getLogger('src.agents.planner').setLevel(logging.DEBUG)
logging.getLogger('src.agents.retriever').setLevel(logging.DEBUG)
```

### 2. Query Plan Inspection

Inspect the query plan for debugging:

```python
async def debug_query_plan(query: str):
    """Debug a query plan for a given query."""
    planner = QueryPlanner()
    plan = await planner.create_plan(query)
    
    print(f"Query: {query}")
    print(f"Complexity: {plan.complexity}")
    print(f"Synthesis Strategy: {plan.synthesis_strategy}")
    print("\nRetrieval Steps:")
    
    for i, step in enumerate(plan.steps):
        print(f"\nStep {i+1}: {step.id}")
        print(f"  Strategy: {step.strategy}")
        print(f"  Description: {step.description}")
        print(f"  Parameters: {step.parameters}")
        if step.depends_on:
            print(f"  Depends On: {step.depends_on}")
```

### 3. LLM Prompt Inspection

Debug LLM interactions by inspecting prompts:

```python
class DebugSynthesizerAgent(SynthesizerAgent):
    """SynthesizerAgent with prompt debugging."""
    
    async def _generate_llm_response(self, prompt: str) -> str:
        """Generate LLM response with prompt debugging."""
        print("\n" + "="*80)
        print("DEBUG: LLM PROMPT")
        print("="*80)
        print(prompt)
        print("="*80 + "\n")
        
        response = await super()._generate_llm_response(prompt)
        
        print("\n" + "="*80)
        print("DEBUG: LLM RESPONSE")
        print("="*80)
        print(response)
        print("="*80 + "\n")
        
        return response
```

## 🔮 Advanced Topics

### 1. Multi-Modal Support

Extend the system to support multi-modal inputs:

```python
class MultiModalRetrieverAgent(RetrieverAgent):
    """RetrieverAgent with multi-modal support."""
    
    async def retrieve_from_image(self, image_data: bytes, query: str) -> List[Dict[str, Any]]:
        """Retrieve information based on image and query."""
        # Extract image features
        image_features = await self._extract_image_features(image_data)
        
        # Generate image embedding
        image_embedding = await self._generate_image_embedding(image_features)
        
        # Combine with text query
        combined_query = await self._create_multimodal_query(image_embedding, query)
        
        # Execute retrieval
        return await self._semantic_retrieval(combined_query, None)
```

### 2. Custom Embedding Models

Implement custom embedding model support:

```python
class CustomEmbeddingProvider:
    """Custom embedding provider for domain-specific embeddings."""
    
    def __init__(self, model_path: str):
        """Initialize with custom model."""
        import torch
        from transformers import AutoModel, AutoTokenizer
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModel.from_pretrained(model_path).to(self.device)
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using custom model."""
        import torch
        
        # Tokenize and prepare input
        inputs = self.tokenizer(text, return_tensors="pt", 
                               truncation=True, max_length=512).to(self.device)
        
        # Generate embedding
        with torch.no_grad():
            outputs = self.model(**inputs)
            embedding = outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()
        
        return embedding.tolist()
```

### 3. Distributed Deployment

Implement distributed deployment architecture:

```python
# api_server.py
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import asyncio
import uuid

app = FastAPI()

# Task queue
tasks = {}

class QueryRequest(BaseModel):
    query: str
    user_context: dict = {}

class QueryResponse(BaseModel):
    task_id: str
    status: str

@app.post("/query", response_model=QueryResponse)
async def create_query(request: QueryRequest, background_tasks: BackgroundTasks):
    """Create a new query task."""
    task_id = str(uuid.uuid4())
    
    # Store task
    tasks[task_id] = {
        "status": "pending",
        "request": request.dict(),
        "result": None
    }
    
    # Execute in background
    background_tasks.add_task(process_query, task_id, request)
    
    return {"task_id": task_id, "status": "pending"}

@app.get("/query/{task_id}", response_model=dict)
async def get_query_result(task_id: str):
    """Get query result by task ID."""
    if task_id not in tasks:
        return {"error": "Task not found"}
    
    return tasks[task_id]

async def process_query(task_id: str, request: QueryRequest):
    """Process query in background."""
    try:
        tasks[task_id]["status"] = "processing"
        
        # Create agentic RAG context
        context = RAGContext(
            query=request.query,
            user_context=request.user_context
        )
        
        # Execute query
        response = await agentic_rag.query(context)
        
        # Store result
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["result"] = {
            "answer": response.answer,
            "confidence": response.confidence,
            "sources": response.sources,
            "execution_time": response.execution_time
        }
    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
```

---

## 📈 Contributing

We welcome contributions to improve the Agentic RAG system! Please follow these guidelines:

1. Create a feature branch for your changes
2. Add appropriate tests
3. Update documentation
4. Submit a pull request

---

This Developer Guide provides comprehensive information for extending and customizing the Agentic RAG system. For additional questions, please refer to the API documentation or contact the development team.

---

**Happy coding!** 🚀