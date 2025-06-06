# Phase 3: Full RAG Implementation 🚀

## Oversigt

Phase 3 implementerer fuld RAG (Retrieval-Augmented Generation) funktionalitet med Ollama og ChromaDB, optimeret til Google Cloud Run deployment.

## Nye Features i Phase 3

### 🧠 Forbedret RAG Engine

- **Intelligent Chunking**: Automatisk opdeling af kode baseret på sprog og struktur
- **Performance Caching**: Embedding cache for hurtigere responstider
- **Multi-Collection Support**: Separate collections for forskellige indholdstyper
- **Advanced Search**: Semantisk søgning med similarity thresholds

### 🔧 Enhanced MCP Server

- **File Upload**: Upload og indeksér filer direkte via API
- **6 Nye Tools**: Udvidet værktøjssæt til kodeanalyse
- **Better Error Handling**: Forbedret fejlhåndtering og fallback responses
- **Performance Monitoring**: Real-time statistikker og health checks

### 📊 Nye Tools

1. **analyze_code**: Dybdegående kodeanalyse med RAG kontekst
2. **search_codebase**: Semantisk søgning i kodebase
3. **generate_code**: Kodegenerering med codebase eksempler
4. **explain_code**: Kodeforklaring på forskellige niveauer
5. **refactor_code**: Refactoring forslag med fokusområder
6. **find_similar_code**: Find lignende kode patterns

### 🚀 Deployment Forbedringer

- **Optimeret Dockerfile**: Bedre caching og mindre image størrelse
- **Smart Startup**: Intelligent model download og pre-loading
- **Auto-restart**: Automatisk genstart af services ved fejl
- **Health Monitoring**: Omfattende health checks og monitoring

## Deployment

### Hurtig Start

```bash
# Deploy til Google Cloud Run
cd gcp-migration
./deploy-phase3.sh
```

### Manuel Deployment

```bash
# Build Docker image
docker build -f Dockerfile.phase3 -t code-assistant-phase3 .

# Run lokalt
docker run -p 8080:8080 -p 11434:11434 -p 8000:8000 code-assistant-phase3
```

## API Endpoints

### Core Endpoints

- `GET /` - Service information
- `GET /health` - Health check med detaljeret status
- `GET /stats` - System statistikker
- `POST /mcp` - MCP protocol endpoint

### Phase 3 Nye Endpoints

- `POST /upload` - Upload og indeksér filer
- `POST /index-codebase` - Indeksér hele codebase
- `GET /docs` - API dokumentation

## MCP Tools Usage

### 1. Analyze Code

```json
{
  "method": "tools/call",
  "params": {
    "name": "analyze_code",
    "arguments": {
      "code": "def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
      "language": "python",
      "analysis_type": "performance"
    }
  }
}
```

### 2. Search Codebase

```json
{
  "method": "tools/call",
  "params": {
    "name": "search_codebase",
    "arguments": {
      "query": "fibonacci algorithm implementation",
      "limit": 5
    }
  }
}
```

### 3. Generate Code

```json
{
  "method": "tools/call",
  "params": {
    "name": "generate_code",
    "arguments": {
      "requirements": "Create a REST API endpoint for user authentication",
      "language": "python",
      "use_codebase_context": true
    }
  }
}
```

### 4. Explain Code

```json
{
  "method": "tools/call",
  "params": {
    "name": "explain_code",
    "arguments": {
      "code": "async def process_data(data): return await asyncio.gather(*[transform(item) for item in data])",
      "level": "intermediate"
    }
  }
}
```

### 5. Refactor Code

```json
{
  "method": "tools/call",
  "params": {
    "name": "refactor_code",
    "arguments": {
      "code": "def calculate(a, b, c): return a + b * c",
      "language": "python",
      "focus": "readability"
    }
  }
}
```

### 6. Find Similar Code

```json
{
  "method": "tools/call",
  "params": {
    "name": "find_similar_code",
    "arguments": {
      "code": "class DatabaseConnection:",
      "similarity_threshold": 0.8,
      "limit": 3
    }
  }
}
```

## File Upload

Upload filer til RAG systemet:

```bash
curl -X POST http://localhost:8080/upload \
  -F 'file=@example.py' \
  -F 'language=python' \
  -F 'collection=codebase'
```

## Performance Optimizations

### Cloud Run Konfiguration

- **Memory**: 8GB for optimal model performance
- **CPU**: 4 cores for parallel processing
- **Timeout**: 60 minutter for model downloads
- **Concurrency**: 10 for balanced performance

### Model Optimizations

- **Pre-loading**: Models pre-loades ved startup
- **Caching**: Embedding cache for genbrugte queries
- **Parallel Processing**: Ollama konfigureret til parallel requests

## Monitoring og Debugging

### Health Check

```bash
curl http://localhost:8080/health
```

### System Stats

```bash
curl http://localhost:8080/stats
```

### Logs

```bash
# Google Cloud logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=code-assistant-rag" --limit=20

# Docker logs
docker logs <container_id>
```

## Troubleshooting

### Common Issues

1. **RAG Engine Not Available**

   - Check if Ollama is running: `curl http://localhost:11434/api/tags`
   - Check if ChromaDB is running: `curl http://localhost:8000/api/v1/heartbeat`
   - Verify models are downloaded: Check logs for model download status

2. **Slow Response Times**

   - Models may be loading for first time
   - Check memory usage - increase if needed
   - Verify embedding cache is working

3. **Upload Failures**
   - Check file size limits
   - Verify file encoding (UTF-8 required)
   - Check available disk space

### Performance Tuning

1. **Memory**: Increase if models don't fit
2. **CPU**: More cores = faster parallel processing
3. **Concurrency**: Adjust based on memory per request
4. **Cache Size**: Monitor cache hit rates

## Development

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start services locally
./scripts/start-services-phase3.sh

# Run tests
pytest test_deployment.py
```

### Adding New Tools

1. Add tool definition in `handle_tools_list()`
2. Implement logic in `handle_tool_call()`
3. Update documentation
4. Test with MCP client

## Migration fra Phase 2

Phase 3 er backward compatible med Phase 2. Eksisterende MCP clients vil fortsætte med at virke, men får adgang til nye features.

### Breaking Changes

- Ingen breaking changes
- Nye optional parameters i eksisterende tools
- Nye endpoints er additive

## Roadmap

### Kommende Features

- [ ] Git repository integration
- [ ] Batch file processing
- [ ] Custom model support
- [ ] Advanced analytics dashboard
- [ ] Multi-language documentation generation

## Support

For support og spørgsmål:

1. Check logs først
2. Verify health endpoints
3. Test med simple MCP calls
4. Check resource usage (memory/CPU)

## Omkostninger

### Estimerede månedlige omkostninger (Google Cloud Run):

- **Minimal brug** (< 100 requests/dag): 15-30 DKK
- **Moderat brug** (500-1000 requests/dag): 50-100 DKK
- **Intensiv brug** (> 2000 requests/dag): 150-300 DKK

### Optimering tips:

- Brug min-instances=0 for cost savings
- Monitor og juster memory baseret på faktisk brug
- Implementer request caching for hyppige queries
