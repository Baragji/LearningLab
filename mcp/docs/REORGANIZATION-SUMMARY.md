# MCP Reorganization Summary

## Formål
Denne reorganisering blev udført for at samle alle MCP-relaterede filer i en enkelt, logisk struktureret mappe for at forbedre vedligeholdelse og overblik.

## Ændringer

### Ny mappestruktur
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

### Flyttede filer
1. **Kørbare scripts**
   - Alle start/stop scripts er flyttet til `mcp/bin/`
   - Alle scripts er opdateret til at referere til de nye filplaceringer

2. **Konfigurationsfiler**
   - `docker-compose.mcp.yml` er flyttet til `mcp/config/`
   - MCP-konfigurationsfiler er flyttet til `mcp/config/`

3. **Tjenester**
   - RAG server, Memory server og Code Lens server er flyttet til `mcp/services/`

4. **Dokumentation**
   - `README.mcp.md`, `README-RAG.md` og `MCPtools.md` er flyttet til `mcp/docs/`

5. **Test scripts**
   - `test-rag-pipeline.py` og `test-rag-performance.py` er flyttet til `mcp/scripts/`

### Nye filer
1. **Dokumentation**
   - `mcp/README.md` - Hovedoversigt over MCP-systemet
   - `README-MCP.md` - Reference-fil i rodmappen der peger på den nye struktur

2. **Hjælpescripts**
   - `mcp/scripts/cleanup-old-files.sh` - Script til at flytte gamle filer til legacy-mappen

### Symlinks
- `mcp-bin` i rodmappen linker til `mcp/bin/` for nem adgang

## Fordele ved den nye struktur
1. **Bedre organisering**: Alle MCP-relaterede filer er nu samlet ét sted
2. **Lettere vedligeholdelse**: Klar adskillelse mellem forskellige typer af filer
3. **Bedre overblik**: Logisk mappestruktur gør det nemmere at finde filer
4. **Fremtidssikring**: Struktur der kan udvides med nye komponenter
5. **Konsistens**: Ensartet navngivning og placering af filer

## Næste skridt
1. Kør `mcp/scripts/cleanup-old-files.sh` for at flytte gamle filer til legacy-mappen
2. Opdater eventuelle eksterne referencer til de gamle filplaceringer
3. Test alle scripts for at sikre at de fungerer med den nye struktur