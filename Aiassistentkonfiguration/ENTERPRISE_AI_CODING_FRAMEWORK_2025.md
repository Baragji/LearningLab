# Enterprise AI Coding Framework 2025

Denne guide samler den viden, der ligger i de tidligere versionsdokumenter
(`setupv1.md`, `projekrulesudkast.md`, `ENTERPRISE_*.md`) og den nye
implementeringsplan. Formålet er at beskrive en samlet løsning til fuld eller
næsten fuld autonom kodning i Trae IDE.

## 1. Baggrund og versionshistorik

| Version | Kilde                                        | Nøglepunkter |
| ------- | -------------------------------------------- | ------------ |
| v1      | `Inspiration&udkast/setupv1.md`              | Grundlæggende agentroller og MCP-setup til MVP. |
| v2      | `ENTERPRISE_AI_AGENTS_2025.md` og
`ENTERPRISE_PROJECT_RULES_2025.md` | Udvidede enterprise-regler, avancerede
promptmønstre og streng kvalitetskontrol. |

Ældre "legacy" versioner (v3-v5) eksisterer ikke i repoet, men denne guide
udstikker retningen for den næste iteration (v3).

## 2. Foreslået agentsæt (Trae IDE)

Nedenstående fire agenter bygger videre på v2, men er justeret efter den
opdaterede `IMPLEMENTERINGSPLAN_2025.md`.

### ProjektOrakel
- **Rolle:** Strategisk koordinator og arkitekt.
- **Prompt-ekstrakt:** Henter kontekst via `context-portal` og bruger
  `sequential-thinking` til at nedbryde mål til konkrete opgaver.
- **Tilladte MCP tools:** `sequential-thinking`, `context-portal`, File system,
  Web search.

### KodeRefaktor
- **Rolle:** Infrastruktur- og refaktoreringsspecialist.
- **Prompt-ekstrakt:** Optimerer eksisterende kode, Docker-opsætning og
  afhængigheder i henhold til projektreglerne.
- **Tilladte MCP tools:** `sequential-thinking`, `context-portal`, File system,
  Terminal.

### FeatureBygger
- **Rolle:** Implementerer nye features og AI-integrationer.
- **Prompt-ekstrakt:** Arbejder på både backend (NestJS) og frontend (Next.js)
  samt integrerer AI- og gamification-elementer.
- **Tilladte MCP tools:** `context-portal`, `redis-memory`, File system,
  Terminal, Web search.

### KvalitetsVogter
- **Rolle:** Tester og validerer kode.
- **Prompt-ekstrakt:** Kører test- og reviewprocesser, dokumenterer resultater.
- **Tilladte MCP tools:** `sequential-thinking`, `context-portal`, `sqlite-db`,
  File system, Terminal.

## 3. Regler (udkast)

Reglerne er opdelt i projektregler og brugerregler. De skal placeres i
`.trae/rules/` så Trae IDE automatisk læser dem.

### Projektregler
- Alle commits skal følge Conventional Commits.
- Ingen push direkte til `main` uden godkendt pull request.
- Lint og tests skal passere (se setup-skriptet `scripts/setup-codex.sh`).
- Terminalværktøjet må ikke bruges til langvarige processer i samme session
  (jf. MVP-terminalreglerne).
- Minimum 85 % testdækning for nyt kode.

### Brugeregler
- Kommunikation i chatten foregår på dansk, men alt teknisk output
  (kode, commits, fejlmeddelelser) skrives på engelsk.
- Forklar komplekse forslag i højst 300 ord medmindre brugeren beder om mere.
- Ved usikkerhed om krav skal agenten spørge ProjektOrakel om præcisering.

## 4. MCP-servere

Følgende MCP-servere anbefales for at understøtte den nye plan. De fleste er
allerede beskrevet i `mcp-config.json`, men her er et samlet overblik.

| MCP            | Formål                                   | Kilde/Implementering |
| -------------- | ----------------------------------------- | -------------------- |
| filesystem     | Filoperationer i projektet               | `@modelcontextprotocol/server-filesystem` |
| git            | Versionskontrol                          | `@idosal/git-mcp` |
| python-sandbox | Sikker kørsel af Python-scripts          | `mcp_run_python` |
| vector-search  | Lokal ChromaDB til RAG                   | `scripts/vector_search_server.py` |
| prompt-history | Gemmer og henter prompthistorik          | `scripts/prompt_history_server.py` |
| sequential-thinking | Planlægning og analyse               | `@modelcontextprotocol/server-sequential-thinking` |
| context-portal | Kodebaseret kontekst/RAG                 | `context-portal` (npx) |
| redis-memory   | Deling af kodetemplates og nøgledata      | `@gongrzhe/server-redis-mcp` |
| sqlite-db      | Testdatabase til KvalitetsVogter          | `mcp-server-sqlite-npx` |
| code-lens      | Kontekstuel analyse af filer             | `scripts/code_lens_server.py` |
| openapi        | Lokal OpenAPI-server til API-tests        | `openapi-mcp` (Docker) |

*Andre mulige open source MCP’er:*
- **docker-control-mcp** – styring af Docker-containere.
- **helm-mcp** – deployment af Kubernetes charts.
- **brave-search** – web search via Brave API.

Disse kan tilføjes efter behov via `Configure Manually` i MCP-fanen.

## 5. Alternativ løsningsstrategi

For at opnå mere autonom udvikling end Trae IDE alene kan tilbyde, kombineres
Trae med et lokalt RAG-setup og en prompt-historikdatabase (se `vector-search`
og `prompt-history`). Derudover kan følgende forbedringer implementeres:

1. **Iterative Agent Decoding (IAD)** – send samme prompt igennem to eller flere
   modeller (f.eks. Claude 4 og GPT‑4.1) og lad en verifikator vælge bedste
   resultat. Dette øger præcisionen.
2. **Selective Indexing** – brug `trae.config.json` til at udelade store mapper
   (`node_modules`, `dist`) og reindeksér kun berørte mapper for hurtigere RAG.
3. **Prompt templates** – opret skabeloner i `.trae/templates/` (se
   `docs/trae-optimizations-guide.md`) så agenterne kan genbruge velafprøvede
   prompts til test, bugfixes og nye features.
4. **CI-integration** – lad MCP `git` og `kubernetes` køre i CI-pipelinen, så
   ændringer valideres automatisk, og deployment kan ske direkte fra Trae.
5. **Feedback loops** – gem resultater i `memory` og brug `grafana` til at
   monitorere agenternes effektivitet og fejlrate.

Med disse elementer kombineret med den opdaterede implementeringsplan kan
LearningLab nå målet om en næsten autonom AI-drevet udviklingsplatform.
