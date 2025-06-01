# Project Rules

1.  ## **Tool Priority & Fallback (STRICT SEQUENCE)**
    * **Context Gathering (MANDATORY FIRST STEP):**
        1. Use `memory.search_nodes` to retrieve past decisions.
        2. Use `file-context-server.read_context` with multiple specific search terms.
        3. Use `rag-docs-ollama.search_documentation` for external knowledge.
        4. FALLBACK: If above fail, use `filesystem.search_files` + `read_file`.
    * **Planning (MANDATORY SECOND STEP):**
        * Use `sequential-thinking.sequentialthinking` with retrieved context.
    * **File I/O:**
        * ALWAYS use MCP `filesystem` for all file operations.
        * ALWAYS read file content before editing with `filesystem.read_file`.
        * FALLBACK: If MCP `filesystem` fails (error or timeout), use Built-in `File system` and log a warning.
    * **Execution:**
        * Use `Terminal` exclusively for git, build, test, and dependency operations.
        * ALWAYS check command output and exit code before proceeding.

2.  ## **Commit Scope (PRECISE RULES)**
    * The `<scope>` in the commit message MUST match the primary directory of the task (e.g., `api`, `web`, `ui`).
    * Stage ONLY paths relevant to the current task (e.g., `git add apps/api/src/auth/**`).
    * NEVER stage unrelated files or generated files that should be ignored.
    * ALWAYS respect `.gitignore`.
    * ALWAYS run `git status` before committing to verify staged files.

3.  ## **Test Gate (MANDATORY BEFORE COMMIT)**
    * Define a `<task_scope_directory>` variable based on the task context.
    * ALWAYS run tests targeting only this directory: `npm test -- <task_scope_directory>/`
    * If exit code is not 0: STOP, fix errors, and rerun tests.
    * Commit and push ONLY on exit code 0.
    * For UI changes, ALWAYS validate with `puppeteer_screenshot`.

4.  ## **Commit Message Format (STRICT FORMAT)**
    * `<type>(<scope>): <short description>`
    * `type`: feat | fix | docs | style | refactor | test | chore
    * `scope`: Dynamically determined folder or module name.
    * `description`: Concise, specific, and in imperative mood (e.g., "add", not "added").
    * EXAMPLES:
        * `feat(auth): implement JWT refresh token mechanism`
        * `fix(api): resolve user profile data retrieval issue`
        * `refactor(ui): optimize button component rendering`

5.  ## **Memory Logging (COMPREHENSIVE PROTOCOL)**
    * **During Task Execution:**
        * Call `memory.add_observations` after EACH significant step.
        * Include file paths, component names, and code snippets in observations.
    * **After Test Success (exit code 0):**
        * Call `memory.create_entities` with a relevant type (e.g., `feature`, `bugfix`, `test`).
        * Include detailed properties: files, components, dependencies, architectural decisions.
    * **After Test Failure:**
        * Call `memory.add_observations` with error details and attempted solutions.
        * NEVER log a successful outcome if tests failed.
    * **Entity Types:**
        * Use specific entity types: 'feature', 'bug', 'refactor', 'test', 'docs'
        * Include relationships between entities when relevant.

6.  ## **Documentation & Comments (MANDATORY)**
    * **Public APIs:** REQUIRE comprehensive JSDoc with @param, @returns, and @example.
    * **Internal Functions:** Add a one-line comment explaining purpose and non-obvious behavior.
    * **Complex Logic:** Add inline comments for any code with non-trivial logic.
    * **Project Documentation:**
        * Update project README for new endpoints or scripts.
        * Update relevant documentation files in `/docs` directory.
        * For new features, add usage examples.

7.  ## **Plan First (MANDATORY WORKFLOW)**
    * ALWAYS run `sequential-thinking.sequentialthinking` before ANY code changes.
    * The plan MUST include 5-7 concrete, actionable steps.
    * Each step MUST specify:
        * Which tools will be used
        * What files will be affected
        * Expected outcome of the step
    * Display the generated plan at the start of the response.
    * Follow the plan step by step, validating after each step.

8.  ## **Code Placement & Monorepo Logic (STRICT ARCHITECTURE)**
    * Before file creation, the generated plan MUST include a step to validate the correct file path according to these rules.
    * **Reusable UI components:** Place in `packages/ui/components/`.
        * EXAMPLE: `packages/ui/components/Button/Button.tsx`
    * **Shared business logic/utilities (core):** Place in `packages/core/src/`.
        * EXAMPLE: `packages/core/src/auth/tokenService.ts`
    * **API-specific code (NestJS):**
        * Modules: `apps/api/src/modules/`
        * Controllers: `apps/api/src/modules/<module-name>/controllers/`
        * Services: `apps/api/src/modules/<module-name>/services/`
        * DTOs: `apps/api/src/modules/<module-name>/dto/`
    * **Web-specific code (Next.js):**
        * Pages: `apps/web/src/app/`
        * Components: `apps/web/src/components/`
        * Hooks: `apps/web/src/hooks/`
        * Utils: `apps/web/src/utils/`
    * **Database schema (`schema.prisma`):** Must only be edited, not moved.
    * **Tests:** Place adjacent to the code being tested with `.spec.ts` or `.test.ts` suffix.

9.  ## **Component Granularity and Composition (STRICT DESIGN PRINCIPLES)**
    * **Principle:** Favor Composition over Monolithic Components. All components MUST adhere to the Single Responsibility Principle.
    * **Rule:** Any React component estimated to exceed **200 lines** MUST be broken down into smaller, single-purpose sub-components.
    * **Props Interface:** EVERY component MUST have a clearly defined props interface with JSDoc comments.
    * **Workflow Integration:** During the `sequential-thinking` phase, if a component is identified as complex (e.g., a page with multiple sections, forms, and data displays), the plan MUST include steps to refactor it into smaller components, each with a clearly defined set of props.
    * **Placement of Sub-components:**
        * Truly reusable, generic components MUST be placed in `packages/ui/components/`.
        * Page-specific sub-components MUST be placed in a local `components/` sub-directory (e.g., `apps/web/src/app/profile/components/`).
    * **Component Testing:** EVERY component MUST have at least one test file that verifies its rendering and basic functionality.

10. ## **Error Handling & Validation (COMPREHENSIVE STRATEGY)**
    * **Frontend:**
        * ALWAYS validate user input with proper error messages.
        * Implement form validation using Zod or similar schema validation.
        * Handle API errors gracefully with user-friendly messages.
    * **Backend:**
        * Use class-validator for DTO validation.
        * Implement proper exception filters for consistent error responses.
        * Log errors with appropriate severity levels.
    * **Database:**
        * Use Prisma's validation capabilities.
        * Implement proper error handling for database operations.
        * Use transactions for operations that modify multiple records.
    * **Testing:**
        * Include error case tests for all error handling code.
        * Verify that error messages are user-friendly and actionable.