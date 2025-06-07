# 🚀 Quick Start Guide - LearningLab RAG

## ⚡ Start MCP Server med RAG (1 kommando)

```bash
cd gcp-migration && python3 src/mcp_server_with_rag.py
```

**Forventet output:**

```
🚀 Starting MCP Server with RAG on port 8080
✅ RAG engine initialized successfully
Uvicorn running on http://0.0.0.0:8080
```

## 🧪 Test alle funktioner (5 minutter)

### 1. Health Check

```bash
curl http://localhost:8080/health
```

**Forventet:** `"rag_engine": true`

### 2. List Tools

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

**Forventet:** 5 tools (analyze_code, search_codebase, generate_code, explain_code, add_document)

### 3. Add Document

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "add_document",
      "arguments": {
        "content": "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr",
        "file_path": "sorting.py",
        "file_type": "python",
        "project": "algorithms"
      }
    }
  }'
```

**Forventet:** `"Successfully added document 'sorting.py' with X chunks"`

### 4. Search Codebase

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_codebase",
      "arguments": {
        "query": "sorting algorithm",
        "limit": 3
      }
    }
  }'
```

**Forventet:** Relevante kode snippets med similarity scores

### 5. Analyze Code

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "analyze_code",
      "arguments": {
        "code": "def factorial(n): return 1 if n <= 1 else n * factorial(n-1)",
        "language": "python"
      }
    }
  }'
```

**Forventet:** Detaljeret kode analyse fra LLM

## 📊 Performance Forventninger

- **Server startup**: 5-10 sekunder
- **Document indexing**: <1 sekund per dokument
- **Vector search**: <1 sekund
- **LLM analysis**: 20-40 sekunder (afhænger af kode kompleksitet)

## 🔧 Troubleshooting

### Problem: "RAG engine not available"

**Løsning:**

1. Tjek at Ollama kører: `ollama list`
2. Tjek at modeller er installeret: `llama3.1:8b` og `nomic-embed-text`
3. Restart server

### Problem: "ChromaDB error"

**Løsning:**

1. Slet `data/chromadb/` mappen
2. Restart server (opretter ny database)

### Problem: Slow LLM responses

**Normal:** LLM responses tager 20-40 sekunder - dette er normalt for lokal Ollama

## 🎯 Integration med Trae IDE

**MCP Endpoint:** `http://localhost:8080/mcp`
**Protocol:** HTTP POST med JSON
**Content-Type:** `application/json`

**Eksempel MCP client kode:**

```python
import requests

def call_mcp_tool(tool_name, arguments):
    response = requests.post(
        "http://localhost:8080/mcp",
        json={
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        },
        headers={"Content-Type": "application/json"}
    )
    return response.json()

# Brug
result = call_mcp_tool("analyze_code", {
    "code": "def hello(): return 'world'",
    "language": "python"
})
print(result["content"][0]["text"])
```

## 📁 Data Persistence

- **ChromaDB database:** `data/chromadb/`
- **Persistent:** Dokumenter gemmes mellem server restarts
- **Backup:** Kopier `data/` mappen for backup

---

**🎉 Du er nu klar til at bruge LearningLab RAG!**
