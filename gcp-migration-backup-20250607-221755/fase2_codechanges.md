# FASE 2 – Code Changes Summary

## Agentic Prompt Engineering
- Added `agents/prompts.py` with basic templates
- Updated `agentic_rag.py` to inject prompt templates during planning and synthesis
- Tests added in `agents/test_prompts.py`

## NebulaGraph Migration
- Implemented `NebulaGraphMigrator` in `graph/data_migrator.py`
- Added `graph/test_migrator.py` covering migration flow

## Load Testing Scaffold
- Created `load_tests/locustfile.py` for simple health check load test
- Added GitHub action `load-tests.yml` to run Locust

## Compliance-skabelon
- Added empty templates under `compliance/`
- Test `tests/test_compliance_templates.py` ensures templates are present

## Adaptive Embeddings
- Stub `AdaptiveEmbeddingSelector` added in `core/`
- Test `tests/test_adaptive_selector.py` currently fails until implemented
