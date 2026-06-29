# Plugin System

Reforge AI should support plugins for analysis, export, provider, and deployment
extensions.

## Plugin types

- crawler plugins
- detector plugins
- collector plugins
- builder plugins
- exporter plugins
- report plugins
- AI provider plugins
- deployment plugins

## Plugin goals

- extend the platform without modifying core routes
- allow enterprise-specific workflows
- keep plugins isolated and optional
- preserve safe fallback behavior when plugins are absent

## Plugin contract

A plugin should define:

- id
- name
- version
- type
- hooks
- permissions
- entrypoints

## Hook examples

- before crawl
- after crawl
- after analysis
- before report
- before export
- after export
- before chat response

## Governance

- plugins should be reviewed for security
- plugins should not bypass path safety checks
- plugins should not weaken export or report integrity
