# MCP System for LearningLab

Dette er en reference-fil, der peger på den nye placering af MCP-systemet.

## Ny placering

MCP-systemet er nu organiseret i `mcp/` mappen.

Den komplette dokumentation findes i:
- `mcp/README.md` - Hovedoversigt
- `mcp/docs/` - Detaljeret dokumentation

## Start og stop af MCP-tjenester

### Start tjenester
```bash
# Standard MCP-tjenester
./mcp/bin/start-mcp.command

# Optimeret MCP-konfiguration
./mcp/bin/start-mcp-optimized.sh
```

### Stop tjenester
```bash
# Standard MCP-tjenester
./mcp/bin/stop-mcp.command

# Optimeret MCP-konfiguration
./mcp/bin/stop-mcp-optimized.sh
```

## Bemærk
Alle MCP-relaterede filer er nu samlet i `mcp/` mappen for bedre organisering.