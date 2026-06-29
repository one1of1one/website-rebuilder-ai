# 15. Decision Log

This document records the main architectural decisions made for Sprint 0. It is
written in ADR style so future contributors can see the reasoning behind the
current product direction.

## ADR-001: Rename the product to Reforge AI

Status: accepted

### Decision

Rename the platform from the earlier working title to Reforge AI.

### Context

The product is not a simple downloader. It is a website reverse engineering and
modernization system. The new name better reflects analysis, reconstruction,
and refactoring.

### Consequences

- Documentation, roadmap, and architecture now use Reforge AI as the product
  name.
- The tagline is stable: Analyze. Reverse Engineer. Rebuild.
- Existing implementation details can keep their historical identifiers until
  they are migrated safely.

## ADR-002: Keep the frontend plain HTML/CSS/JS for now

Status: accepted

### Decision

Do not introduce a frontend framework for the application shell at this stage.

### Context

The goal is to keep the application reliable, small, and easy to run locally
while the core engine is still changing rapidly. A plain frontend avoids
framework build complexity, framework lock-in, and unnecessary state management
overhead.

### Consequences

- The app stays easy to start with a minimal install footprint.
- UI iteration can continue without a build pipeline.
- Generated projects may still target frameworks such as React, Next.js, Vue,
  Nuxt, Laravel, and others.

## ADR-003: Keep the backend on Node.js + Express for MVP

Status: accepted

### Decision

Use Node.js and Express as the backend runtime and HTTP layer for the MVP.

### Context

The engine is I/O heavy, browser-driven, and already built around JavaScript
parsing, crawling, and filesystem operations. Node.js is the lowest-risk option
for a modular rule-based engine that can be expanded later.

### Consequences

- The codebase stays consistent across the API, crawler, analyzer, and exporter
  layers.
- The team can ship the core engine without introducing a second runtime.
- Future services can still be extracted into workers or separate processes.

## ADR-004: Require an AI provider abstraction

Status: accepted

### Decision

Introduce a provider abstraction for OpenAI, Claude, Gemini, Ollama, and
OpenRouter.

### Context

The product must support multiple AI backends over time. Hard-coding one vendor
would increase migration risk and make experimentation expensive.

### Consequences

- Prompt handling and task routing remain vendor-neutral.
- Rule-based behavior can be used today while provider integrations remain
  optional.
- Provider-specific capabilities can be added without changing the engine API.

## ADR-005: Cap crawling to a bounded page count

Status: accepted

### Decision

Limit crawl depth and page count for the current engine, with a default cap of
25 pages.

### Context

The application is intended to analyze and reconstruct public websites, not to
mirror arbitrarily large sites in one synchronous request. Unbounded crawling
would increase latency, memory pressure, and failure rates.

### Consequences

- Builds stay deterministic and more predictable.
- The user gets faster feedback and smaller bundles.
- Large sites remain supported in a partial, representative form rather than as
  a full recursive scrape.

## ADR-006: Do not claim server-side source extraction from public websites

Status: accepted

### Decision

The product must not imply that it can extract server-side source code from a
public website.

### Context

Public websites expose rendered HTML, client-side assets, and observable
network behavior, but not the original private server code. Attempting to
recover source code that was never shipped to the browser is technically
incorrect.

### Consequences

- Product language stays accurate and trustworthy.
- UI and documentation must distinguish between observable output and hidden
  server-side implementation.
- The engine focuses on reconstruction and modernization from public signals.

## ADR-007: Treat project generation as reconstruction, not original code recovery

Status: accepted

### Decision

Generated output is a reconstructed developer-friendly project derived from
public signals, not a byte-for-byte recovery of the original codebase.

### Context

The engine can infer layout, structure, assets, dependencies, and framework
signatures. It can reorganize and improve what it observes, but it cannot
recreate unavailable private repository history.

### Consequences

- Output is intentionally clean and opinionated.
- The generator can split components, normalize assets, and add scaffolding.
- The product description stays aligned with what the engine can actually do.

## ADR-008: Defer enterprise SaaS features

Status: accepted

### Decision

Defer enterprise features such as multi-tenant billing, teams, permissions,
queues, background workers, and deployment orchestration.

### Context

Those features are valid product directions, but they add platform complexity
before the core reverse-engineering engine is stable.

### Consequences

- Sprint 0 stays focused on architecture and planning.
- Sprint 1 can focus on stable crawling, analysis, and project generation.
- Enterprise requirements can be introduced with a cleaner boundary later.

## ADR-009: Use rule-based logic first, add AI later

Status: accepted

### Decision

Implement the current engine using deterministic heuristics and reserve the AI
provider layer for later upgrades.

### Context

The first useful version of the product is a reliable engine that works without
external dependencies. AI can improve quality, but the baseline must be
predictable and testable.

### Consequences

- Core features work without API keys.
- Behaviors are easier to debug and validate.
- Future model integrations can be layered onto a stable foundation.

