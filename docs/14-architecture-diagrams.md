# 14. Architecture Diagrams

This document provides the canonical architecture visuals for Reforge AI. The
diagrams are Mermaid-based so they can be rendered in GitHub, most markdown
viewers, and internal documentation tools.

## Full system architecture

```mermaid
flowchart TD
    U[User] --> UI[Plain HTML/CSS/JS Frontend]
    UI --> API[Node.js + Express API]

    API --> C[Crawler Engine]
    API --> A[Analyzer Engine]
    API --> D[Technology Detectors]
    API --> CE[Component Extractor]
    API --> AC[Asset Collector]
    API --> SE[SEO Engine]
    API --> AE[Accessibility Engine]
    API --> PE[Performance Engine]
    API --> AI[AI Refactor Engine]
    API --> PG[Project Generator]
    API --> EX[Exporter]
    API --> CH[AI Chat Assistant]
    API --> ED[File Editor]
    API --> PR[Report Generator]

    C --> ST[(storage/cache)]
    A --> ST
    D --> ST
    CE --> ST
    AC --> ST
    SE --> ST
    AE --> ST
    PE --> ST
    AI --> ST
    PG --> PS[(storage/projects)]
    EX --> PX[(storage/exports)]
    PR --> SR[(storage/reports)]

    AI --> P[Multi AI Provider System]
    P --> OAI[OpenAI]
    P --> CLA[Claude]
    P --> GEM[Gemini]
    P --> OLL[Ollama]
    P --> OR[OpenRouter]

    EX --> Z[ZIP / Docker / Plesk / cPanel / FTP / Git]
    PG --> Z
```

## Rebuild pipeline

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend
    participant API as /api/rebuild
    participant C as Crawler
    participant A as Analyzer
    participant D as Detectors
    participant CE as Component Extractor
    participant AC as Asset Collector
    participant AI as AI Refactor Engine
    participant PG as Project Generator
    participant R as Report Generator
    participant X as Exporter

    User->>UI: Enter URL, mode, output type
    UI->>API: POST rebuild request
    API->>C: Crawl sitemap/robots/internal links
    C-->>API: Pages + routes
    API->>A: Analyze HTML, headers, assets
    A-->>API: Page inventory + metadata
    API->>D: Detect technologies
    D-->>API: Stack report
    API->>CE: Detect sections/components
    CE-->>API: Component inventory
    API->>AC: Download and rewrite assets
    AC-->>API: Localized assets + failures
    API->>AI: Apply mode-specific cleanup
    AI-->>API: Refactored source plan
    API->>PG: Generate project structure
    PG-->>API: Project files
    API->>R: Generate report files
    R-->>API: JSON + markdown reports
    API->>X: Build ZIP/export bundle
    X-->>API: Downloadable archive
    API-->>UI: Progress + completion payload
```

## Analyze API flow

```mermaid
flowchart LR
    U[Client] --> RQ[POST /api/analyze]
    RQ --> V{Validate URL}
    V -- invalid --> E[Return validation error]
    V -- valid --> F[Fetch HTML + headers]
    F --> T[Detect technologies]
    F --> C[Detect components]
    F --> RT[Normalize routes]
    F --> AS[Collect asset inventory]
    T --> S[Score engine]
    C --> S
    RT --> S
    AS --> S
    S --> O[Analysis response]
    O --> U
```

## Rebuild API flow

```mermaid
flowchart TD
    U[Client] --> RQ[POST /api/rebuild]
    RQ --> P{Validate body}
    P -- invalid --> X1[Return error]
    P -- valid --> M[Resolve mode + output type]
    M --> C[Crawler]
    C --> A[Analyzer]
    A --> D[Detectors]
    D --> B[Builder / Generator]
    B --> R[Reports]
    B --> E[Exporter]
    R --> S[(storage/reports)]
    E --> Z[(output ZIP)]
    Z --> D1[Download link]
    R --> D2[Project metadata]
    D1 --> U
    D2 --> U
```

## AI provider abstraction

```mermaid
classDiagram
    class AIProvider {
      +name
      +isAvailable()
      +generate(prompt, context)
      +summarize(input)
    }

    class OpenAIProvider
    class ClaudeProvider
    class GeminiProvider
    class OllamaProvider
    class OpenRouterProvider

    AIProvider <|.. OpenAIProvider
    AIProvider <|.. ClaudeProvider
    AIProvider <|.. GeminiProvider
    AIProvider <|.. OllamaProvider
    AIProvider <|.. OpenRouterProvider

    class AIProviderRegistry {
      +listProviders()
      +getActiveProvider()
      +routeTask()
    }

    AIProviderRegistry --> AIProvider
```

## Export pipeline

```mermaid
flowchart LR
    P[Generated Project] --> N[Normalize file tree]
    N --> Z[ZIP Export]
    N --> G[Git Repo Export]
    N --> D[Docker Export]
    N --> PL[Plesk Package]
    N --> CP[cPanel Package]
    N --> F[FTP Package]
    Z --> O[(output/)]
    G --> O
    D --> O
    PL --> O
    CP --> O
    F --> O
```

## Storage layout

```mermaid
flowchart TD
    S[storage/] --> P[projects/]
    S --> C[cache/]
    S --> R[reports/]
    S --> E[exports/]

    P --> P1[project-id/]
    P1 --> PF[files/]
    P1 --> PM[metadata.json]
    P1 --> PR[report.json]

    R --> RR[report archives]
    C --> CH[fetch cache]
    E --> EX[export bundles]
```

## Future SaaS architecture

```mermaid
flowchart LR
    U[Customer] --> FW[Web App]
    FW --> AUTH[Auth / Billing / Team Spaces]
    FW --> API[Public API]
    FW --> DASH[Workspace Dashboard]
    API --> JOBS[Async Job Queue]
    JOBS --> WORKERS[Analysis / Rebuild Workers]
    WORKERS --> DB[(Primary Database)]
    WORKERS --> OBJ[(Object Storage)]
    WORKERS --> V[Vector / Search Index]
    AUTH --> BILL[Billing Provider]
    DASH --> TENANT[Multi-tenant Project Store]
    TENANT --> DB
    OBJ --> DL[Downloads / Exports]
```

