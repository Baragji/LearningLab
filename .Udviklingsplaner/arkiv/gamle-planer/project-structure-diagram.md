# LearningLab Project Structure Diagram

## Overview

This document provides visual diagrams of the LearningLab project structure to complement the guidelines.md file.

## High-Level Architecture

```mermaid
graph TD
    A[LearningLab Monorepo] --> B[apps]
    A --> C[packages]
    A --> D[prisma]
    A --> E[scripts]
    A --> F[docker-compose.yml]
    
    B --> G[api - NestJS Backend]
    B --> H[web - NextJS Frontend]
    
    C --> I[config]
    C --> J[core]
    C --> K[ui]
    C --> L[tsconfig]
    C --> M[create-solid-wow]
    
    D --> N[migrations]
    D --> O[schema.prisma]
    
    G --> G1[src]
    G1 --> G2[auth]
    G1 --> G3[common]
    G1 --> G4[controllers]
    G1 --> G5[modules]
    G1 --> G6[persistence]
    G1 --> G7[quiz]
    G1 --> G8[users]
    G1 --> G9[user-groups]
    G1 --> G10[services]
    G1 --> G11[shared]
    
    H --> H1[pages]
    H --> H2[src]
    H2 --> H3[components]
    H2 --> H4[context/contexts]
    H2 --> H5[hooks]
    H2 --> H6[screens]
    H2 --> H7[store]
    H2 --> H8[services]
    H2 --> H9[styles]
    H2 --> H10[utils]
```

## API Structure Detail

```mermaid
graph TD
    API[api] --> SRC[src]
    SRC --> AUTH[auth]
    AUTH --> STRAT[strategies]
    STRAT --> GH[github]
    STRAT --> GO[google]
    STRAT --> JWT[jwt]
    STRAT --> LOC[local]
    AUTH --> DECO[decorators]
    AUTH --> DTO[dto]
    AUTH --> GRD[guards]
    
    SRC --> COMMON[common]
    COMMON --> FILT[filters]
    COMMON --> INT[interceptors]
    COMMON --> MID[middleware]
    COMMON --> PIP[pipes]
    COMMON --> SRV[services]
    
    SRC --> CTRL[controllers]
    CTRL --> CDTO[dto]
    CDTO --> CERT[certificate]
    CDTO --> CONT[contentBlock]
    CDTO --> LESS[lesson]
    CDTO --> MOD[module]
    CDTO --> QUIZ[quiz]
    
    SRC --> PERS[persistence]
    SRC --> QUIZ[quiz]
    SRC --> USRG[user-groups]
    SRC --> USERS[users]
```

## Web Application Structure Detail

```mermaid
graph TD
    WEB[web] --> PAGES[pages]
    PAGES --> ADMIN[admin]
    PAGES --> COURSES[courses]
    PAGES --> LESSONS[lessons]
    PAGES --> QUIZ[quiz]
    
    WEB --> SRC[src]
    SRC --> COMP[components]
    COMP --> CAUTH[auth]
    COMP --> CCOMM[common]
    COMP --> CCONT[content]
    COMP --> CLAY[layout]
    COMP --> CQUIZ[quiz]
    COMP --> CUI[ui]
    
    SRC --> CTX[context/contexts]
    SRC --> HOOKS[hooks]
    SRC --> SCRN[screens]
    SCRN --> SADM[admin]
    SCRN --> SAUTH[auth]
    SCRN --> SCOMM[common]
    SCRN --> SEMP[employee]
    
    SRC --> STORE[store]
    SRC --> SERV[services]
    SRC --> STYLE[styles]
    SRC --> UTIL[utils]
```

## Package Structure Detail

```mermaid
graph TD
    PKG[packages] --> CFG[config]
    PKG --> CORE[core]
    PKG --> UI[ui]
    UI --> UICOMP[components]
    UI --> UIUTIL[utils]
    PKG --> TSC[tsconfig]
    PKG --> CSW[create-solid-wow]
```

## Database Structure

```mermaid
graph TD
    PRS[prisma] --> MIG[migrations]
    PRS --> SCH[schema.prisma]
```

## Deployment Architecture

```mermaid
graph TD
    DC[docker-compose.yml] --> PG[postgres]
    DC --> API[api]
    
    subgraph "Current Implementation"
        PG --- API
    end
    
    subgraph "Missing Components"
        WEB[web]
        NGINX[nginx]
    end
    
    API -.- WEB
    WEB -.- NGINX
    
    style WEB fill:#f9f,stroke:#333,stroke-dasharray: 5 5
    style NGINX fill:#f9f,stroke:#333,stroke-dasharray: 5 5
```

Note: Dashed components are mentioned in the guidelines but not implemented in the current docker-compose.yml file.