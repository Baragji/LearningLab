# 🚀 Code Assistant + RAG Migration til Google Cloud

## 📋 Oversigt

Denne guide hjælper dig med at migrere din eksisterende Code Assistant + RAG setup fra lokal Mac til Google Cloud for at løse performance problemer og udnytte dit 2000kr kredit.

### 🎯 Mål
- **Fra**: Lokal setup med langsom RAG (2-3 minutter per query)
- **Til**: Cloud setup med hurtig RAG (<5 sekunder per query)
- **Omkostning**: 75-340kr/måned (afhænger af konfiguration)

## 🏗️ Arkitektur Sammenligning

### Nuværende (Lokal)
```
[Trae IDE] ←→ [MCP] ←→ [Code Assistant (Rust)] ←→ [Ollama] ←→ [SQLite RAG]
                                                              ↓
                                                        [Langsom søgning]
```

### Ny (Google Cloud)
```
[Trae IDE] ←→ [MCP] ←→ [Google Cloud Run] ←→ [Code Assistant + Ollama + ChromaDB]
                              ↓                              ↓
                      [Auto-scaling]                [Hurtig vector search]
```

## 📊 Omkostningsanalyse

### Option 1: CPU-Only (Anbefalet til start)
- **Månedlig omkostning**: ~75kr
- **Varighed med 2000kr**: 27 måneder
- **Performance**: God til de fleste use cases
- **RAM**: 4GB, 2 vCPU

### Option 2: GPU-Enabled (Optimal performance)
- **Månedlig omkostning**: ~340kr  
- **Varighed med 2000kr**: 6 måneder
- **Performance**: Optimal (hurtigste inference)
- **Hardware**: NVIDIA L4 GPU, 8GB RAM, 4 vCPU

## 🚀 Migration Steps

### Trin 1: Forberedelse

1. **Installer Google Cloud CLI** (hvis ikke allerede gjort):
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. **Verificer Docker installation**:
   ```bash
   docker --version
   ```

3. **Naviger til migration directory**:
   ```bash
   cd gcp-migration
   ```

### Trin 2: Deploy til Google Cloud

Kør deployment scriptet:
```bash
./deploy-to-gcp.sh
```

Scriptet vil:
- ✅ Oprette Google Cloud projekt
- ✅ Aktivere nødvendige APIs
- ✅ Bygge Docker container med Ollama + Code Assistant + ChromaDB
- ✅ Deploye til Cloud Run
- ✅ Konfigurere persistent storage
- ✅ Opsætte monitoring
- ✅ Generere Trae IDE konfiguration

### Trin 3: Konfigurer Trae IDE

Efter deployment får du en `trae-mcp-config.json` fil. Tilføj indholdet til din Trae IDE konfiguration:

```json
{
  "mcpServers": {
    "code-assistant-cloud": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json", 
        "-d", "@-",
        "https://your-service-url/mcp"
      ]
    }
  }
}
```

### Trin 4: Test Setup

1. **Test service health**:
   ```bash
   curl https://your-service-url/health
   ```

2. **Test MCP functionality**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        -d '{"method": "tools/list"}' \
        https://your-service-url/mcp
   ```

3. **Test i Trae IDE**:
   - Genstart Trae IDE
   - Verificer at "code-assistant-cloud" er tilgængelig
   - Test en simpel query

## 🔧 Tekniske Forbedringer

### ChromaDB vs SQLite
- **SQLite (nuværende)**: 2-3 minutter per query
- **ChromaDB (ny)**: <5 sekunder per query
- **Årsag**: Optimeret vector search vs. sequential scanning

### Smart Chunking
Ny chunking strategi baseret på filtype:
- **Python/JS/Rust**: Chunk by functions/classes
- **Markdown**: Chunk by headers  
- **Text**: Intelligent overlap chunking

### Caching
- Embedding caching for genbrugte queries
- Model caching for hurtigere startup
- Persistent storage for ChromaDB data

## 📊 Performance Forventninger

### Lokal (nuværende)
- RAG query: 2-3 minutter
- Embedding generation: 30-60 sekunder
- Model loading: 10-20 sekunder

### Cloud (forventet)
- RAG query: 2-5 sekunder
- Embedding generation: 1-3 sekunder  
- Model loading: 0 sekunder (persistent)

## 🔍 Monitoring & Debugging

### Cloud Console Links
Efter deployment får du links til:
- **Service logs**: Real-time logs fra din service
- **Monitoring**: CPU, memory, request metrics
- **Cost tracking**: Løbende omkostningsovervågning

### Debugging Commands
```bash
# View logs
gcloud logs read 'resource.type=cloud_run_revision' --limit=50

# Check service status
gcloud run services describe code-assistant-rag --region=europe-west1

# Scale service
gcloud run services update code-assistant-rag --max-instances=5
```

## 💰 Omkostningsoptimering

### Auto-scaling
- **Min instances**: 0 (scale to zero når ikke i brug)
- **Max instances**: 3-5 (afhænger af behov)
- **Timeout**: 1 time (for lange RAG operationer)

### Cost Monitoring
- Sæt budget alerts på 500kr/måned
- Monitor daglig usage i Cloud Console
- Scale ned om natten hvis ikke nødvendigt

## 🚨 Troubleshooting

### Common Issues

1. **Service ikke tilgængelig**:
   - Check logs for startup errors
   - Verificer at alle modeller er downloadet
   - Øg timeout hvis nødvendigt

2. **Langsom performance**:
   - Overvej GPU upgrade
   - Check memory usage
   - Optimér chunking størrelse

3. **Høje omkostninger**:
   - Reducer max instances
   - Implementér bedre caching
   - Scale til zero når ikke i brug

### Support
- **Cloud Console**: https://console.cloud.google.com
- **Documentation**: https://cloud.google.com/run/docs
- **Community**: https://stackoverflow.com/questions/tagged/google-cloud-run

## 🎉 Forventede Resultater

Efter migration skulle du opleve:
- ✅ **95% hurtigere RAG queries** (2-3 min → 2-5 sek)
- ✅ **Bedre reliability** (cloud infrastructure)
- ✅ **Auto-scaling** (håndterer variable workloads)
- ✅ **Persistent storage** (ingen data tab)
- ✅ **Professional monitoring** (logs, metrics, alerts)

## 📞 Næste Skridt

1. **Kør deployment**: `./deploy-to-gcp.sh`
2. **Test grundigt** med din eksisterende codebase
3. **Sammenlign performance** med lokal setup
4. **Optimér** baseret på resultater
5. **Dokumentér** din erfaring for fremtidige forbedringer

God migration! 🚀