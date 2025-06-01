# Project Rules

## Tool priority

* Use `file-context-server` or `rag-docs-ollama` for context retrieval first.
* All file I/O must go through the MCP `filesystem`; never use the built‑in File system.
* Use `Terminal` exclusively for git, build, test and dependency operations.

## Commit scope

* Stage only paths related to the current task (e.g. `git add dummy-test-full/**`).
* Exclude `node_modules`, log and build directories (respect `.gitignore`).

## Test gate

* Run only the tests inside the task folder:
  `npm test -- dummy-test-full/`
* If exit code ≠ 0: stop, fix errors, rerun tests.
* Commit and push only when exit code = 0.

## Commit message format

* `<type>(<scope>): <short description>`
* `type`: feat | fix | docs | style | refactor | test | chore
* `scope`: folder or module name.
* Example: `feat(dummy-test-full): add calculator, unit test and README`.

## Memory logging

* After green tests:

  * Call `memory.create_entities` with relevant type (e.g. `unit-test`).
  * Call `memory.add_observations` with a truthful result (include exit code).
* Never log “exit 0” when tests failed.

## Documentation & comments

* Public APIs require JSDoc.
* Add a one‑line comment for non‑obvious internal helpers.
* Update the project README for new endpoints or scripts.

## Plan first

* Always run `sequential-thinking` before code changes and show the generated plan at the start of the response.
