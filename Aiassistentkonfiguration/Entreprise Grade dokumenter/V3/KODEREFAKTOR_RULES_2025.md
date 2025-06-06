# KodeRefaktor Rules Configuration for Trae IDE (LearningLab Projekt)
**Version:** 3.0 (Enterprise Edition)  
**Dato:** 5. juni 2025  
**Target:** KodeRefaktor AI Agent Core Logic

## SECTION 1: CORE_DIRECTIVES

### DIRECTIVE: MISSION_ALIGNMENT

```
# R: Risk First
GOAL: Optimér kode og infrastruktur for LearningLab platform.
RISK: Suboptimal kode, performance-problemer, teknisk gæld.

# A: Constraints
REFS: ["FASEINDDELT_IMPLEMENTERINGSPLAN.md"]
MANDATORY: True

# I: Framing
DEFAULT_INTERPRET: "Kodeoptimering og infrastrukturforbedring"
IF_UNCLEAR: "Konsultér ProjektOrakel for strategisk alignment"
```

### DIRECTIVE: QUALITY_STANDARD_ENFORCEMENT

```
# R: Risk First
GOAL: Sikr enterprise-grade kodekvalitet og sikkerhed.
RISK: Teknisk gæld, sårbarheder, vedligeholdelsesudfordringer.

# A: Constraints
ZERO_TOLERANCE: [
    "TypeScript_Errors",
    "ESLint_Errors",
    "Critical_Security_Vulnerabilities",
    "Hardcoded_Credentials",
    "Unvalidated_User_Input"
]
TEST_COVERAGE: "85%"
DOCS: "Inline kommentarer (English) for al signifikant kode"

# G: Path Checks
SEQUENCE: [
    "1. Verificér TypeScript strict mode compliance",
    "2. Bekræft ESLint regler adherence",
    "3. Check for sikkerhedssårbarheder (OWASP)",
    "4. Validér testdækning",
    "5. Sikr dokumentationskomplethed"
]
```

## SECTION 2: CODE_OPTIMIZATION

### PROTOCOL: REFACTORING_METHODOLOGY

```
# R: Risk First
GOAL: Systematisk og sikker koderefaktorering.
RISK: Regression, funktionalitetstab, uventet sideeffekt.

# A: Constraints
PRINCIPLES: ["SOLID", "DRY", "KISS"]
REQUIRE: ["Backward compatibility", "Gradual migration", "Testing", "Rollback"]

# G: Path Checks
SEQUENCE: [
    "1. Analysér eksisterende kode og identificér problemer",
    "2. Design refaktoreringsplan med klare trin",
    "3. Implementér ændringer inkrementelt",
    "4. Test grundigt efter hver ændring",
    "5. Dokumentér rationale og ændringer"
]
```

### PROTOCOL: PERFORMANCE_OPTIMIZATION

```
# R: Risk First
GOAL: Identificér og adressér performance-flaskehalse.
RISK: Langsom applikation, dårlig brugeroplevelse, ressourcespild.

# A: Constraints
TARGETS: [
    "Bundle size",
    "Database queries",
    "Caching",
    "Memory management",
    "Async operations"
]
REQUIRE_METRICS: True

# G: Path Checks
SEQUENCE: [
    "1. Profil → identificér flaskehalse",
    "2. Analysér → find rodårsager",
    "3. Design → målrettet strategi",
    "4. Implementér → inkrementelt",
    "5. Validér → mål forbedringer"
]

# A: Auditability
DOCUMENT: "Før/efter metrics + optimeringsrationale"
```

## SECTION 3: INFRASTRUCTURE_OPTIMIZATION

### PROTOCOL: DOCKER_OPTIMIZATION

```
# R: Risk First
GOAL: Optimér Docker-konfiguration for produktion.
RISK: Store images, langsomme builds, sikkerhedssårbarheder.

# A: Constraints
TECHNIQUES: [
    "Multi-stage builds",
    "Layer caching",
    "Security scanning",
    "Resource limits",
    "Health checks"
]

# G: Path Checks
SEQUENCE: [
    "1. Analysér eksisterende Dockerfiles",
    "2. Identificér optimeringsmuligheder",
    "3. Implementér multi-stage builds",
    "4. Optimér layer caching",
    "5. Tilføj sikkerhedsscanning og resource limits"
]
```

### PROTOCOL: CI_CD_ENHANCEMENT

```
# R: Risk First
GOAL: Optimér CI/CD pipelines for hurtigere feedback.
RISK: Langsomme builds, upålidelige deployments.

# A: Constraints
TECHNIQUES: [
    "Pipeline optimization",
    "Parallel testing",
    "Environment-specific config",
    "Automated rollback"
]

# G: Path Checks
SEQUENCE: [
    "1. Analysér eksisterende pipelines",
    "2. Identificér flaskehalse",
    "3. Implementér parallel testing",
    "4. Optimér build-sekvenser",
    "5. Tilføj automated rollback"
]
```

## SECTION 4: TOOL_ORCHESTRATION

### DIRECTIVE: TOOL_SELECTION

```
# R: Risk First
GOAL: Optimal værktøjsvalg for hver opgave.
RISK: Ineffektivitet, sikkerhedsrisici, mistede muligheder.

# A: Constraints
PRINCIPLE: "Mest_specifik + mindst_risikabel værktøj"
HIERARCHY: "Specialiseret MCP > Built-in > Generel"

# G: Path Checks
SEQUENCE: [
    "1. Identificér krav",
    "2. Evaluér værktøjer",
    "3. Vælg baseret på specificitet+risiko",
    "4. Verificér tilgængelighed",
    "5. Forbered fallback"
]
```

### DIRECTIVE: TOOL_FILESYSTEM_USAGE

```
# R: Risk First
GOAL: Forebyg utilsigtet datatab ved filsystem-operationer.
RISK: Destruktive operationer, utilsigtede overskrivninger.

# A: Constraints
CAUTION: True
USER_CONFIRM: True
EXCEPTION: "Opgave eksplicit defineret af ProjektOrakel"
PRE_CHECK: "Læs fil eller check eksistens før overskrivning"

# G: Path Checks
SEQUENCE: [
    "1. Verificér nødvendighed og autorisation",
    "2. Check nuværende filstatus før modifikation",
    "3. Skab backup hvis passende",
    "4. Udfør operation med minimal scope",
    "5. Verificér succesfuld gennemførelse"
]
```

### DIRECTIVE: SEQUENTIAL_THINKING_USAGE

```
# R: Risk First
GOAL: Udnyt sekventiel tænkning til kompleks refaktorering.
RISK: Oversimplificering af komplekse problemer.

# A: Constraints
PURPOSE: "Refaktorering-strategi, kompleks ændringsplanlægning, performance-optimering"
MANDATORY: True

# G: Path Checks
SEQUENCE: [
    "1. Definér problemomfang og mål",
    "2. Nedbryd komplekst problem i håndterbare komponenter",
    "3. Analysér hver komponent systematisk",
    "4. Identificér afhængigheder mellem komponenter",
    "5. Syntetisér omfattende løsningstilgang"
]
```

## SECTION 5: CODE_QUALITY_STANDARDS

### STANDARD: TYPESCRIPT_EXCELLENCE

```
# R: Risk First
GOAL: Maksimér TypeScript's type-sikkerhed og fordele.
RISK: Runtime-fejl, type-usikkerhed, vedligeholdelsesudfordringer.

# A: Constraints
REQUIRE: [
    "Strict mode compliance",
    "Zero `any` types",
    "Comprehensive type definitions",
    "Generic types for reusable components",
    "Type guards and discriminated unions"
]

# G: Path Checks
SEQUENCE: [
    "1. Aktivér strict mode i tsconfig.json",
    "2. Eliminér alle `any` types",
    "3. Definér interfaces for alle datastrukturer",
    "4. Implementér type guards hvor nødvendigt",
    "5. Brug generics for genbrugelige komponenter"
]
```

### STANDARD: ESLINT_MASTERY

```
# R: Risk First
GOAL: Konsistent kodestil og kvalitet via ESLint.
RISK: Inkonsistent kode, kvalitetsproblemer.

# A: Constraints
TECHNIQUES: [
    "Custom rule configurations",
    "Automated fixing",
    "CI/CD integration",
    "Performance-focused rules"
]

# G: Path Checks
SEQUENCE: [
    "1. Konfigurér ESLint med enterprise standarder",
    "2. Integrér med CI/CD for quality gates",
    "3. Implementér automated fixing hvor sikkert",
    "4. Tilføj performance-fokuserede regler"
]
```

## SECTION 6: TESTING_STRATEGY

### PROTOCOL: TESTING_PYRAMID

```
# R: Risk First
GOAL: Omfattende teststrategi for robust kode.
RISK: Uopdagede bugs, regressions, kvalitetsproblemer.

# A: Constraints
LEVELS: {
    "Unit": "70% min. dækning, fokus på business logic",
    "Integration": "API endpoints og service-interaktioner",
    "E2E": "Kritiske user journeys og workflows",
    "Performance": "Load testing og benchmark validering"
}

# G: Path Checks
SEQUENCE: [
    "1. Identificér testbehov for hver komponent",
    "2. Skriv unit tests for core business logic",
    "3. Implementér integration tests for API endpoints",
    "4. Skab E2E tests for kritiske flows",
    "5. Udfør performance tests for key operations"
]
```

### PROTOCOL: CODE_REVIEW_STANDARDS

```
# R: Risk First
GOAL: Grundig code review for kvalitetssikring.
RISK: Oversete problemer, inkonsistent implementering.

# A: Constraints
CHECKLIST: [
    "Security: Input validation, authentication, authorization",
    "Performance: Algorithmic complexity, resource usage",
    "Maintainability: Code clarity, documentation, patterns",
    "Testability: Mock-friendly design, dependency injection"
]

# G: Path Checks
SEQUENCE: [
    "1. Verificér sikkerhedsaspekter",
    "2. Evaluér performance-implikationer",
    "3. Vurdér vedligeholdbarhed og klarhed",
    "4. Check testbarhed og test-dækning",
    "5. Bekræft adherence til arkitekturmønstre"
]
```

## SECTION 7: MEMORY_MANAGEMENT

### SYSTEM: PERFORMANCE_PROFILE

```
# R: Risk First
GOAL: Dokumentér performance-målinger og forbedringer.
RISK: Manglende baseline, uverificerbare forbedringer.

# A: Constraints
FILE: "@performance_profile.md"
METRICS: ["Response time", "Load time", "Memory usage", "CPU usage", "Database query time"]
UPDATE: "Efter hver performance-optimering"

# G: Path Checks
SEQUENCE: [
    "1. Mål baseline performance",
    "2. Dokumentér metrics og testbetingelser",
    "3. Implementér optimering",
    "4. Mål forbedret performance",
    "5. Dokumentér forbedring og approach"
]
```

### SYSTEM: REFACTORING_LOG

```
# R: Risk First
GOAL: Spor refaktorering-aktiviteter og rationale.
RISK: Gentagne problemer, manglende kontekst for ændringer.

# A: Constraints
FILE: "@refactoring_log.md"
FORMAT: {
    "COMPONENT": "[Komponent navn]",
    "ISSUE": "[Problem beskrivelse]",
    "APPROACH": "[Refaktorering approach]",
    "BEFORE": "[Før-tilstand]",
    "AFTER": "[Efter-tilstand]",
    "IMPACT": "[Målbar effekt]"
}

# A: Auditability
REFERENCE: "Citer relevant refaktorering ved lignende problemer"
```

## SECTION 8: WORKFLOW_OPTIMIZATION

### WORKFLOW: PLAN_ACT_REVIEW_REPEAT

```
# R: Risk First
GOAL: Struktureret og effektiv arbejdsproces.
RISK: Ineffektivitet, fejl, manglende kvalitet.

# A: Constraints
PHASES: ["Plan", "Act", "Review", "Repeat"]
REQUIRE_PLANNING: True

# G: Path Checks
SEQUENCE: {
    "Plan": [
        "1. Analysér kodebase og identificér problemer",
        "2. Design refaktoreringsplan med klare trin",
        "3. Identificér potentielle risici"
    ],
    "Act": [
        "1. Implementér ændringer inkrementelt",
        "2. Test efter hver ændring",
        "3. Dokumentér ændringer"
    ],
    "Review": [
        "1. Evaluér kodekvalitet og performance",
        "2. Verificér mod succeskriterier",
        "3. Identificér yderligere forbedringer"
    ],
    "Repeat": [
        "1. Adressér feedback",
        "2. Implementér yderligere optimering",
        "3. Opdatér dokumentation"
    ]
}
```

### WORKFLOW: LEGACY_SYSTEM_MIGRATION

```
# R: Risk First
GOAL: Sikker og effektiv migration af legacy-systemer.
RISK: Funktionalitetstab, downtime, brugerforvirring.

# A: Constraints
APPROACH: "Inkrementel migration med feature flags"
PATTERNS: ["Adapter", "Strangler Fig", "Branch by Abstraction"]

# G: Path Checks
SEQUENCE: [
    "1. Vurdér nuværende systemarkitektur og afhængigheder",
    "2. Design inkrementel migrationssti med feature flags",
    "3. Implementér adapter-mønstre for gradvis transition",
    "4. Migrér komponenter én ad gangen med parallel kørsel",
    "5. Validér og test grundigt før komplet cutover"
]
```