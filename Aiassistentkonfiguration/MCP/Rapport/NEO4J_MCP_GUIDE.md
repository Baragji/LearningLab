# Neo4j Knowledge Graph MCP Server Guide

## Oversigt
Du har nu en avanceret Neo4j Knowledge Graph Memory Server kørende, som giver AI assistenter persistent hukommelse og kompleks relationsmapping.

## Status
✅ **Neo4j Database**: Kører på port 7474 (web) og 7687 (bolt)
✅ **MCP Server**: `@sylweriusz/mcp-neo4j-memory-server` v2.3.12
✅ **Konfiguration**: Klar til brug

## Adgang til Neo4j Browser
- **URL**: http://localhost:7474
- **Brugernavn**: neo4j
- **Adgangskode**: learninglab2024

## MCP Konfigurationsfiler

### 1. Simpel konfiguration
Fil: `neo4j_mcp_config.json`
```json
{
  "mcpServers": {
    "neo4j-knowledge-graph": {
      "command": "npx",
      "args": ["-y", "@sylweriusz/mcp-neo4j-memory-server"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "learninglab2024",
        "NEO4J_DATABASE": "neo4j"
      }
    }
  }
}
```

### 2. Avanceret konfiguration
Fil: `advanced_neo4j_mcp_config.json`
- Inkluderer Neo4j Knowledge Graph
- Filesystem adgang
- Git integration

## Funktioner

### Knowledge Graph Capabilities
- **Entiteter**: Opret og administrer personer, organisationer, koncepter
- **Relationer**: Definer komplekse forbindelser mellem entiteter
- **Observationer**: Gem fakta og noter om entiteter
- **Søgning**: Avanceret fuzzy search og præcis matching
- **Traversering**: Komplekse graph queries med Cypher

### Tilgængelige Tools
1. `create_entities` - Opret nye entiteter
2. `create_relations` - Definer relationer mellem entiteter
3. `add_observations` - Tilføj observationer til entiteter
4. `search_nodes` - Søg i knowledge graph
5. `get_relations` - Hent relationer for en entitet
6. `delete_entities` - Slet entiteter
7. `update_entities` - Opdater eksisterende entiteter

## Claude Integration

### Custom Instructions for Claude
```
Follow these steps for each interaction:

1. User Identification:
   - You should assume that you are interacting with default_user
   - If you have not identified default_user, proactively try to do so.

2. Memory Retrieval:
   - Always begin your chat by saying only "Remembering..." and search relevant information from your knowledge graph
   - Create a search query from user words, and search things from "memory". If nothing matches, try to break down words in the query at first ("A B" to "A" and "B" for example).
   - Always refer to your knowledge graph as your "memory"

3. Memory Categories:
   - Basic Identity (age, gender, location, job title, education level, etc.)
   - Behaviors (interests, habits, etc.)
   - Preferences (communication style, preferred language, etc.)
   - Goals (goals, targets, aspirations, etc.)
   - Relationships (personal and professional relationships up to 3 degrees of separation)

4. Memory Update:
   - If any new information was gathered during the interaction, update your memory as follows:
     a) Create entities for recurring organizations, people, and significant events
     b) Connect them to the current entities using relations
     c) Store facts about them as observations
```

## Docker Commands

### Start Neo4j
```bash
docker run -d \
  --name neo4j-memory \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/learninglab2024 \
  -e NEO4J_PLUGINS='["apoc"]' \
  -v neo4j_data:/data \
  -v neo4j_logs:/logs \
  neo4j:5.26.0
```

### Stop Neo4j
```bash
docker stop neo4j-memory
```

### Restart Neo4j
```bash
docker restart neo4j-memory
```

### View Logs
```bash
docker logs neo4j-memory
```

## Test MCP Server
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | \
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USER=neo4j \
NEO4J_PASSWORD=learninglab2024 \
NEO4J_DATABASE=neo4j \
npx -y @sylweriusz/mcp-neo4j-memory-server
```

## Fejlfinding

### Neo4j forbindelsesproblemer
1. Tjek at Neo4j kører: `docker ps | grep neo4j`
2. Tjek logs: `docker logs neo4j-memory`
3. Test forbindelse: `docker exec neo4j-memory cypher-shell -u neo4j -p learninglab2024 "RETURN 1;"`

### MCP Server problemer
1. Tjek pakke version: `npm info @sylweriusz/mcp-neo4j-memory-server`
2. Test direkte: Se test kommando ovenfor
3. Tjek environment variabler

## Fordele ved Neo4j vs. andre løsninger

### vs. JSON fil storage
- ✅ Bedre performance ved store datamængder
- ✅ Komplekse relationsqueries
- ✅ ACID transaktioner
- ✅ Concurrent access

### vs. Standard memory servers
- ✅ Native graph database
- ✅ Cypher query language
- ✅ Visualisering i Neo4j Browser
- ✅ Skalerbarhed
- ✅ Backup og recovery

## Næste skridt
1. Konfigurer din MCP klient (Claude Desktop, etc.) med en af config filerne
2. Test basic funktionalitet
3. Udforsk Neo4j Browser på http://localhost:7474
4. Eksperimenter med komplekse knowledge graphs

## Support
- Neo4j Documentation: https://neo4j.com/docs/
- MCP Protocol: https://modelcontextprotocol.io/
- Package Repository: https://github.com/sylweriusz/mcp-neo4j-memory-server