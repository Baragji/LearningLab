Notes

The new prompts.py defines reusable prompt templates for planners and synthesizers, which are injected in AgenticRAG during query processing. The NebulaGraphMigrator class enables migration from TigerGraph and is accompanied by tests. A minimal Locust load test and GitHub workflow were added, along with compliance templates and an unimplemented AdaptiveEmbeddingSelector stub whose test currently fails.

Summary

Created prompt templates and integrated them in the RAG orchestration flow
Added NebulaGraph migration support in data_migrator.py
Introduced compliance document skeletons and load-testing scaffolding
Documented changes in fase2_codechanges.md
Testing

❌ pytest gcp-migration/src/agents/test_prompts.py gcp-migration/src/graph/test_migrator.py gcp-migration/tests/test_compliance_templates.py gcp-migration/tests/test_adaptive_selector.py -q (failed to pass due to NotImplementedError)

Filer (15)

.github/workflows/load-tests.yml
Ny

gcp-migration/compliance/HIPAA_template.md
Ny

gcp-migration/compliance/ISO_27001_template.md
Ny

gcp-migration/fase1_kodeanalyse.md
Ny

gcp-migration/fase2_codechanges.md
Ny

gcp-migration/load_tests/locustfile.py
Ny

gcp-migration/src/agents/agentic_rag.py
+13
-4

gcp-migration/src/agents/prompts.py
Ny

gcp-migration/src/agents/test_prompts.py
Ny

gcp-migration/src/core/__init__.py
+2
-1

gcp-migration/src/core/adaptive_embedding_selector.py
Ny

gcp-migration/src/graph/data_migrator.py
+31
-2

gcp-migration/src/graph/test_migrator.py
Ny

gcp-migration/tests/test_adaptive_selector.py
Ny

gcp-migration/tests/test_compliance_templates.py
Ny

