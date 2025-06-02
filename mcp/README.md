# MCP (Model Context Protocol) System

Dette er hovedmappen for alle MCP-relaterede filer og tjenester i LearningLab-projektet.

## Mappestruktur

```
mcp/
├── bin/                # Kørbare scripts (start/stop/test)
├── config/             # Konfigurationsfiler
├── data/               # Data-filer (ChromaDB, etc.)
├── docs/               # Dokumentation
├── legacy/             # Ældre filer (arkiveret)
├── logs/               # Log-filer (genereres automatisk)
├── scripts/            # Hjælpescripts og testværktøjer
└── services/           # MCP-tjenester (RAG, Memory, Code Lens)
```

## Kom i gang

### Start MCP-tjenester

```bash
# Start standard MCP-tjenester
./mcp/bin/start-mcp.command

# Start optimeret MCP-konfiguration
./mcp/bin/start-mcp-optimized.sh
```

### Stop MCP-tjenester

```bash
# Stop standard MCP-tjenester
./mcp/bin/stop-mcp.command

# Stop optimeret MCP-konfiguration
./mcp/bin/stop-mcp-optimized.sh
```

### Test MCP-tjenester

```bash
# Test om alle MCP-tjenester kører
./mcp/bin/test-mcp.command

# Test RAG-pipeline med et spørgsmål
python ./mcp/scripts/test-rag-pipeline.py "hvordan fungerer authentication?"

# Test RAG-performance
python ./mcp/scripts/test-rag-performance.py
```

## Tjenester

### RAG Server

RAG (Retrieval Augmented Generation) serveren giver kontekstbaseret søgning i kodebasen.

- **Port:** 5021
- **Endpoint:** `/search`
- **Start:** `./mcp/bin/start-rag-server.sh`
- **Stop:** `./mcp/bin/stop-rag-server.sh`

### Memory Server

Memory serveren gemmer og henter prompt-historik og andre data.

- **Port:** 5007
- **Endpoint:** `/last`, `/create`, `/search`

### Code Lens Server

Code Lens serveren analyserer kode og giver kontekstbaseret forståelse.

- **Port:** 5006
- **Endpoint:** `/analyze`

## Konfiguration

Konfigurationsfiler findes i `mcp/config/` mappen:

- `mcp-config.json` - Standard MCP-konfiguration
- `mcp-config-optimized.json` - Optimeret MCP-konfiguration
- `trae.config.json` - Trae-specifik konfiguration

## Dokumentation

Se `mcp/docs/` mappen for detaljeret dokumentation:

- `README.mcp.md` - Hovedoversigt over MCP-systemet
- `MCPtools.md` - Værktøjer og funktioner i MCP
- `README-RAG.md` - RAG-system dokumentation