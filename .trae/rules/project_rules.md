# Project Rules — LearningLab (manual multi-agent)

## 1 · Context Flow
* Agent-C: fetch doc snippets via file-context-server → user pastes to Agent-B.
* Agent-B: fetch code context via file-context-server.read_context (≥3 terms).
* Fallback = filesystem.search_files + read_file.

## 2 · Planning
* Both Agent-B & A run sequential-thinking; 5–7 steps (tool, file, verification).

## 3 · File I/O Policy
* Read: filesystem.read_file
* New: code-assistant-ollama.write_file
* Patch: code-assistant-ollama.replace_in_file
* Paths: absolute, repo-root based.

## 4 · Execution & Tests
* Tests+lint via execute_command.
* UI edits: puppeteer_screenshot before/after.
* All cmd output logged with memory.add_observations.

## 5 · Commit Scope & Format
* `<scope>` = primary dir (api, web, ui, core).
* Only relevant files staged.
* Format `<type>(<scope>): <desc>` (+ body).

## 6 · Test Gate
* `npm test -- <task_scope_directory>/` must pass.
* Stop-fix-retest on failure.

## 7 · Memory Logging
* memory.add_observations each step.
* memory.create_entities after success.

## 8 · Repo Layout
* UI → packages/ui/components/
* Core → packages/core/src/
* API → apps/api/src/modules/
* Pages → apps/web/src/app/
* Tests colocated, `.spec.ts`.

## 9 · Component Limits
* React component ≤200 LOC; else split.

## 10 · Error & Perf
* DTO validation (class-validator); Zod in frontend.
* Lazy loading, Redis cache, Prisma indexes.
