# User Rules for MCPEnterprise Agent

## MISSION FOKUS (KRITISK)
- **Primært mål**: Implementer MCPEnterprise planen 100% autonomt
- **Scope**: RAG/MCP enterprise transformation, GCP deployment, DevOps excellence
- **Kvalitet**: Produktionsklar kode, enterprise sikkerhed, skalerbarhed

## SPROG REGLER (OBLIGATORISK)
- **Forklaringer**: Dansk, teknisk præcision
- **Kode/kommentarer/fejl**: Engelsk
- **Filnavne/paths**: Engelsk
- **Git commits**: Engelsk format
- **Dokumentation**: Dansk for interne, engelsk for kode

## ENTERPRISE WORKFLOW (OBLIGATORISK SEKVENS)
1. **Kontekst & Planlægning**: Memory + file-context + sequential-thinking
2. **Kode Analyse**: Eksisterende MCP server assessment
3. **Enterprise Forbedringer**: Batching, caching, auth, monitoring
4. **Containerisering**: Docker + Terraform IaC
5. **GCP Deployment**: Cloud Run, sikkerhed, CI/CD
6. **Validering**: Tests, performance, security scanning

## TEKNISKE STANDARDER (IKKE-FORHANDLINGSBARE)
- **Python**: PEP8, type hints, async/await, ≥90% test coverage
- **Docker**: Multi-stage builds, non-root user, security scanning
- **Terraform**: Modules, variables, state management
- **GCP**: IAM best practices, Secret Manager, VPC isolation
- **CI/CD**: Automated testing, security scans, blue-green deployment

## AUTONOM KONTEKST INDSAMLING (OBLIGATORISK)
1. **Memory søgning**: Start ALTID med memory.search_nodes (≥3 termer: "mcp", "rag", "enterprise")
2. **File-context-server**: Brug ALTID med ≥5 specifikke termer ("mcp", "rag", "chromadb", "fastapi", "openai")
3. **RAG server**: Suppler med rag-docs søgning (≥3 termer: "docker", "terraform", "gcp")
4. **Code-assistant**: Filoperationer og test execution

## ENTERPRISE KVALITETSKRAV
- **Performance**: <500ms RAG latency, 100+ concurrent requests
- **Availability**: 99.9% uptime target
- **Security**: Bearer auth, TLS, VPC isolation, secret management
- **Scalability**: Auto-scaling 1-10 instances
- **Monitoring**: Structured logging, metrics, alerting

## FEJLHÅNDTERING & ROBUSTHED (KRITISK)
1. **Systematisk approach**: Identificer → Analyser → Løs → Test → Dokumenter
2. **Rollback strategi**: Git rollback, blue-green deployment
3. **Enterprise resilience**: Circuit breakers, retries, graceful degradation
4. **Security first**: Validate all inputs, secure defaults

## MEMORY PROTOKOL (ENTERPRISE FOKUS)
1. **Start**: Søg "mcp", "enterprise", "deployment" beslutninger
2. **Under arbejde**: Log arkitektoniske valg, sikkerhedsbeslutninger
3. **Afslutning**: Opret entities: 'feature', 'architecture', 'deployment', 'security'

## VÆRKTØJSPRIORITET
1. **file-context-server**: Primær kodekontekst
2. **code-assistant-ollama**: Filoperationer og tests
3. **sequential-thinking**: Detaljeret enterprise planlægning
4. **memory**: Kontekstbevarelse
5. **Terminal**: Build, test, deployment

## SUCCESS METRICS
- ✅ RAG/MCP server på GCP Cloud Run
- ✅ CI/CD pipeline aktiv
- ✅ Monitoring og alerting
- ✅ Enterprise sikkerhed implementeret
- ✅ Performance targets opfyldt
- ✅ Dokumentation og handover komplet

## STOP-AGENT NØGLEORD
- Hvis bruger skriver "STOP-AGENT": Rollback alle ændringer og stop

---
**FOKUS**: 100% autonom MCPEnterprise implementering. Ingen spørgsmål om implementeringsdetaljer. Enterprise-kvalitet i alt.