Installation og test

Installer afhængigheder
pip install flask chromadb sentence-transformers
Mapper
Placer alle tre filer i samme mappe:
your_project/
├── vector_search_server.py
├── index_code_chunks.py
├── rank_chunks.py
└── (andre projektfiler)
Sørg for, at du kan køre python3 vector_search_server.py, python3 index_code_chunks.py og importere rank_chunks i begge.
Kør index‐skriptet først
python3 index_code_chunks.py
Dette skaber/rydder ./chroma_db og indekserer alle .py/.js/.ts/.jsx/.tsx‐filer i dit projekt.
Start RAG‐serveren
python3 vector_search_server.py
Serveren lytter nu på port 5004.
Test /search‐endpoint
curl -X POST http://localhost:5004/search \
  -H "Content-Type: application/json" \
  -d '{"query":"login validation", "n_results":5, "filepath":"./src/auth.py"}'
Du får et JSON‐svar med top 5 chunks, metadata, distance, total_found, query, context_file.
Integrér i Trae MCP
Åbn Trae → MCP-fanen → “+ Add” → indsæt:
{
  "mcpServers": {
    "vector-search": {
      "command": "python3",
      "args": ["vector_search_server.py"],
      "env": {}
    }
  }
}
Svar “Confirm” og kontroller, at serveren får ✅-ikon.
Disse tre filer indeholder nu ingen pladsholdere og er fuldt ud funktionsdygtige, avancerede implementationer, der matcher Cursor‐niveauet for RAG, chunking, metadata og rangering. Hvis du har yderligere tilpasningsønsker – fx andre vægte, ændringer i chunk‐størrelse eller mere detaljeret logging – så sig endelig til, så vi kan finjustere!