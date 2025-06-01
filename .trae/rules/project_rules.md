# Project Rules

1.  ## **Tool Priority & Fallback**
    * **Context:** Use `rag-docs-ollama` or `file-context-server` first.
    * **File I/O:** Use MCP `filesystem`.
        * **Fallback:** If MCP `filesystem` fails (error or timeout), use Built-in `File system` and log a warning.
    * **Execution:** Use `Terminal` exclusively for git, build, test, and dependency operations.

2.  ## **Commit Scope**
    * The `<scope>` in the commit message must match the primary directory of the task (e.g., `dummy-test-full`).
    * Stage only paths relevant to the current task (e.g., `git add dummy-test-full/**`).
    * Respect `.gitignore`.

3.  ## **Test Gate**
    * Define a `<task_scope_directory>` variable based on the task context.
    * Run tests targeting only this directory: `npm test -- <task_scope_directory>/`
    * If exit code is not 0: stop, fix errors, and rerun tests.
    * Commit and push only on exit code 0.

4.  ## **Commit Message Format**
    * `<type>(<scope>): <short description>`
    * `type`: feat | fix | docs | style | refactor | test | chore
    * `scope`: Dynamically determined folder or module name.

5.  ## **Memory Logging**
    * After green tests (exit code 0):
        * Call `memory.create_entities` with a relevant type (e.g., `unit-test`).
        * Call `memory.add_observations` with the result, including the exit code.
    * Never log a successful exit code if tests failed.

6.  ## **Documentation & Comments**
    * Public APIs require JSDoc.
    * Add a one-line comment for non-obvious internal functions.
    * Update project README for new endpoints or scripts.

7.  ## **Plan First**
    * Always run `sequential-thinking` before code changes.
    * Display the generated plan at the start of the response.

8.  ## **Code Placement & Monorepo Logic**
    * Before file creation, the generated plan must include a step to validate the correct file path according to these rules.
    * **Reusable UI components:** Place in `packages/ui/`.
    * **Shared business logic/utilities (core):** Place in `packages/core/`.
    * **API-specific code (NestJS modules, controllers, services):** Place in `apps/api/src`.
    * **Web-specific code (Next.js pages, layouts):** Place in `apps/web/`.
    * **Database schema (`schema.prisma`):** Must only be edited, not moved.

9.  ## Component Granularity and Composition
    * **Principle:** Favor Composition over Monolithic Components. All components should adhere to the Single Responsibility Principle.
    * **Rule:** Any React component estimated to exceed **200 lines** must be broken down into smaller, single-purpose sub-components.
    * **Workflow Integration:** During the `sequential-thinking` phase, if a component is identified as complex (e.g., a page with multiple sections, forms, and data displays), the plan must include steps to refactor it into smaller components, each with a clearly defined set of props.
    * **Placement of Sub-components:**
        * Truly reusable, generic components must be placed in `packages/ui/`.
        * Page-specific sub-components can be placed in a local `components/` sub-directory (e.g., `apps/web/src/app/profile/components/`).