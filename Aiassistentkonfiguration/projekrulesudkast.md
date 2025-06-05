Project Rules Configuration for Trae IDE (LearningLab Projekt)
Version: 1.1 (Terminal Handling Opdateret)
Target: AI Agent Core Logic for LearningLab Project
SECTION 1: PROJECT_CORE_DIRECTIVES
# ... (bevares fra tidligere version) ...

DIRECTIVE: MISSION_ALIGNMENT

# All agent activities MUST support the LearningLab platform development.
PRIMARY_REFERENCE_DOCUMENTS: [
    "FASEINDDELT_IMPLEMENTERINGSPLAN.md",
    "AI_IMPLEMENTERING_PROMPT.md" # and other refactoring plans in README.START.HER/Optimering/
]
MANDATORY_ADHERENCE: True

DIRECTIVE: QUALITY_STANDARD_ENFORCEMENT

# Strict adherence to quality benchmarks.
ZERO_TOLERANCE_POLICY_FOR: [
    "TypeScript_Errors",
    "ESLint_Errors",
    "Critical_Security_Vulnerabilities" # As specified in AI_IMPLEMENTERING_PROMPT.md
]
MINIMUM_TEST_COVERAGE_TARGET: "80%"
DOCUMENTATION_REQUIREMENT: "Sufficient inline comments (English) for all significant code changes and new features. Update project documentation as necessary."

SECTION 2: AGENT_ROLES_AND_COLLABORATION_PROTOCOLS
# ... (bevares fra tidligere version) ...

PROTOCOL: DEFINED_AGENT_ROLES

# Project utilizes four specialized agents.
AGENT_ROSTER: {
    "ProjektOrakel": "Architect, planner, coordinator.",
    "KodeRefaktor": "Specialist in refactoring, optimization, and infrastructure (incl. Docker).",
    "FeatureBygger": "Specialist in new feature development.",
    "KvalitetsVogter": "Specialist in testing, QA, and review."
}

PROTOCOL: COORDINATION_HIERARCHY

# Defines the primary coordination mechanism.
PRIMARY_COORDINATOR: "ProjektOrakel"
TASK_SOURCE_PRIORITY: "Plans and tasks issued by ProjektOrakel."
ESCALATION_PATH_FOR_UNCERTAINTY: "Consult ProjektOrakel."

PROTOCOL: WORK_TRANSPARENCY

# Mandates transparency in ongoing agent tasks.
REQUIREMENT: "Agents must concisely announce current major task or plan, especially at the start of new, complex sessions."

SECTION 3: CONTEXT_AND_INFORMATION_RETRIEVAL_POLICY
# ... (bevares fra tidligere version) ...

POLICY: PRIMARY_CONTEXT_SOURCE

# Specifies the main source for project-specific knowledge.
MCP_TOOL_ID: "context-portal"
USAGE_MANDATE: "Consult BEFORE general Web search for tasks related to the existing codebase."
DATA_TYPES: ["code", "documentation", "history"]

POLICY: AUTHORITATIVE_PLAN_SOURCES

# Defines the definitive documents for project goals and requirements.
DOCUMENT_LIST: [
    "AI_IMPLEMENTERING_PROMPT.md",
    "FASEINDDELT_IMPLEMENTERINGSPLAN.md",
    "README.START.HER/Optimering/*" # All optimization plans
]
STATUS: "Source_Of_Truth"

SECTION 4: TOOL_USAGE_DIRECTIVES (BUILT-IN & MCP)
DIRECTIVE: GENERAL_TOOL_SELECTION

# Governs the selection of tools for any given task.
PRINCIPLE: "Always use the most_specific and least_risky_tool capable of performing the task."

DIRECTIVE: TOOL_FILESYSTEM_USAGE

# Rules for using the 'File system' tool.
WRITE_OPERATIONS_CAUTION: True # (e.g., write_file, delete_file)
USER_CONFIRMATION_REQUIRED_FOR_DESTRUCTIVE_WRITES: True
DESTRUCTIVE_WRITE_EXCEPTION: "Task is explicitly and safely defined by ProjektOrakel."
PRE_OVERWRITE_CHECK: "Always read_file or check_file_existence before overwriting, unless explicitly instructed otherwise."

DIRECTIVE: TOOL_TERMINAL_USAGE_MVP_WORKAROUND (KRITISK - LÆS GRUNDIGT)

# Critical rules for using the 'Terminal' tool, acknowledging current MVP limitations.
# ASSUMPTION (Juni 2025): Trae IDE's 'Terminal' MCP tool provides a SINGLE, BLOCKING terminal session per invocation.
# Advanced process management (background jobs, multiple sessions via agent) is NOT assumed available in MVP.

# PROTOCOL_ID: MVP_TERM_P001 (Server/Long-Running Process Start)
    # CONDITION: Task involves starting a server, watcher, or any other long-running, blocking process.
    # AGENT_ACTION:
        # 1. Execute the start command (e.g., `yarn dev`, `docker-compose up`).
        # 2. Rapporter tilbage til `ProjektOrakel` eller USER om kommandoen er afsendt, og hvad det umiddelbare output er (hvis noget).
        # 3. **Agenten skal herefter AFSLUTTE sin interaktion med denne `Terminal`-instans for denne opgave.** Agenten kan IKKE sende yderligere kommandoer i samme `Terminal`-instans, da den vil være blokeret af serverprocessen.
    # `ProjektOrakel` ANSVAR: Planlæg efterfølgende interaktioner (f.eks. tests, status-tjek) som HELT SEPARATE opgaver, der potentielt kræver manuel brugerintervention eller en ny `Terminal`-instans.

# PROTOCOL_ID: MVP_TERM_P002 (Interaktion med Formodet Kørende Proces)
    # CONDITION: Task involverer interaktion med en server/proces, som `ProjektOrakel` har instrueret om at starte i en *tidligere, separat* opgave.
    # `ProjektOrakel` ANSVAR:
        # 1. At instruere agenten klart om, at den skal *antage*, at den navngivne proces (f.eks. "WebAppServer") kører (eventuelt efter en specificeret forsinkelse eller manuel brugerbekræftelse).
        # 2. At tildele opgaven (f.eks. `curl http://localhost:3000`) til en agent, der kan bruge en *ny, frisk* `Terminal`-instans til denne interaktion.
    # AGENT_ACTION: Udfør den tildelte kommando (f.eks. `curl`) i den nye `Terminal`-instans. Rapporter output.

# PROTOCOL_ID: MVP_TERM_P003 (Generel Kommando Udførsel)
    # CONDITION: Task involverer kortvarige, ikke-blokerende kommandoer (f.eks. `ls`, `git status`, `yarn lint`, `yarn build`).
    # AGENT_ACTION: Udfør kommandoen. Rapporter output. Afslut `Terminal`-interaktion for denne opgave.

# PROHIBITION: Ingen agent må forsøge at starte en blokerende proces OG derefter sende yderligere, uafhængige kommandoer i den SAMME `Terminal`-tool invocation. Dette vil føre til fejl.

# `ProjektOrakel` SKAL bruge `sequential-thinking` MCP til at nedbryde enhver opgavesekvens, der involverer start af servere efterfulgt af interaktion, i separate, håndterbare trin, der respekterer denne MVP-terminalbegrænsning.

DIRECTIVE: MCP_TOOL_SEQUENTIAL_THINKING_ASSIGNMENT

# Primary users and purpose for 'sequential-thinking' MCP.
PRIMARY_USERS: ["ProjektOrakel", "KodeRefaktor", "KvalitetsVogter"]
PURPOSE: {
    "ProjektOrakel": "Planning, complex analysis, workaround_orchestration_for_terminal_limitations.",
    "KodeRefaktor": "Refactoring strategy, complex change planning.",
    "KvalitetsVogter": "Test strategy, root cause analysis."
}

DIRECTIVE: MCP_TOOL_CONTEXT_PORTAL_ASSIGNMENT

# Primary use for 'context-portal' MCP.
ACCESS_LEVEL: "All_Agents"
PURPOSE: "Primary source for project-internal knowledge (code, docs, history)."

DIRECTIVE: MCP_TOOL_REDIS_MEMORY_ASSIGNMENT

# Primary user and purpose for 'redis-memory' MCP.
PRIMARY_USER: "FeatureBygger"
PURPOSE: "Management of code templates, boilerplate, temporary state for feature development."
GUIDANCE_SOURCE: "As directed by ProjektOrakel."

DIRECTIVE: MCP_TOOL_SQLITE_DB_ASSIGNMENT

# Primary user and purpose for 'sqlite-db' MCP.
PRIMARY_USER: "KvalitetsVogter"
PURPOSE: "Interaction with SQLite test database for test data management."

DIRECTIVE: MCP_TOOL_USAGE_ANNOUNCEMENT

# Mandates transparency for MCP tool usage.
REQUIREMENT: "Agent must briefly state which MCP tool is being used and for what purpose."
EXAMPLE: "SYSTEM_MESSAGE: Using 'context-portal' to analyze UserService.ts for existing methods."

SECTION 5: CODE_AND_VERSION_CONTROL_POLICY
# ... (bevares fra tidligere version) ...

POLICY: COMMIT_MESSAGE_STANDARD

# Standard for Git commit messages.
STANDARD_NAME: "Conventional Commits"
FORMAT_EXAMPLE: "feat(auth): implement JWT refresh token logic"
GUIDANCE_PROVIDER: "ProjektOrakel (for scope/description formulation)."

POLICY: BRANCHING_STRATEGY

# Guidelines for Git branching.
DEFAULT_STRATEGY: "Feature-branches from 'main' or 'develop'." # To be further defined by project workflow.
GUIDANCE_PROVIDER: "ProjektOrakel."

POLICY: MAIN_BRANCH_PROTECTION

# Rule against direct pushes to primary branches.
PROHIBIT_DIRECT_PUSH_TO: ["main", "master", "develop"]
REQUIREMENT: "All code changes must undergo a review process (simulated via KvalitetsVogter and approval from ProjektOrakel/USER) before merge."

POLICY: COMMIT_FREQUENCY

# Preferred commit granularity.
PREFERENCE: "Frequent, small commits over large, infrequent ones."

SECTION 6: SECURITY_PROTOCOLS
# ... (bevares fra tidligere version) ...

PROTOCOL: SECRET_MANAGEMENT

# Mandates secure handling of sensitive information.
PROHIBIT_HARDCODING_SECRETS: True
APPLIES_TO: ["API_keys", "passwords", "sensitive_tokens"]
APPROVED_HANDLING_METHODS: ["environment_variables", "dedicated_secret_management_system (e.g., Docker secrets, as per project plans)"]

PROTOCOL: INPUT_VALIDATION

# Mandates validation of all inputs.
APPLIES_TO: ["function_inputs", "API_endpoint_inputs"]
REQUIREMENT: "Implement robust validation."

PROTOCOL: EXTERNAL_CALL_CAUTION

# Guidelines for using tools that interact with external services.
TOOL_IDS: ["Web search", "other_external_facing_tools"]
REQUIREMENT: "Agent must be aware of potential security risks."

SECTION 7: ERROR_HANDLING_AND_ESCALATION_PROCEDURES
# ... (bevares fra tidligere version) ...

PROCEDURE: ROBUST_ERROR_HANDLING_IN_CODE

# Requirement for error handling in agent-generated code.
AGENT_RESPONSIBILITY: "Generate code that includes sensible error handling (e.g., try-catch, validation)."

PROCEDURE: AGENT_BLOCKAGE_ESCALATION

# Protocol for when an agent is stuck or encounters persistent errors.
CONDITION: ["Agent_stuck", "Cannot_solve_task", "Receives_repeated_errors"]
ACTION: "Report problem clearly."
REPORT_TO: ["ProjektOrakel", "USER"]
REQUIRED_CONTEXT_IN_REPORT: ["Attempted_actions", "Observed_errors", "Tools_used"]

SECTION 8: PERFORMANCE_CONSIDERATIONS
# ... (bevares fra tidligere version) ...

DIRECTIVE: AWARENESS_OF_PERFORMANCE_IMPLICATIONS

# General directive for all agents.
AGENT_RESPONSIBILITY: "Be mindful of performance implications of code written or refactored."

DIRECTIVE: PERFORMANCE_OPTIMIZATION_RESPONSIBILITY

# Specific agent responsibility for optimization.
ASSIGNED_AGENT: "KodeRefaktor"
TASK: "Implement performance optimizations."

DIRECTIVE: PERFORMANCE_TESTING_ASSISTANCE

# Specific agent responsibility for performance testing.
ASSIGNED_AGENT: "KvalitetsVogter"
TASK: "Assist with performance testing."

REVISION_POLICY: These rules will be revised and updated as the project evolves.
END_OF_PROJECT_RULES
