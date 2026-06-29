# AI Engine

Reforge AI uses a provider abstraction so AI behavior can be upgraded later
without changing the product surface.

## Providers

- OpenAI
- Claude
- Gemini
- Ollama
- OpenRouter

## Current mode

- rule-based placeholder actions
- deterministic transformations
- safe offline operation

## AI responsibilities

- refactor code structure
- suggest component boundaries
- improve HTML semantics
- improve accessibility
- improve SEO metadata
- rewrite messy CSS and JS
- propose framework migration mappings
- answer post-rebuild change requests

## Provider contract

Each provider should support:

- prompt input
- context input
- structured output
- traceable response metadata
- graceful fallback to rule-based behavior

## Integration rules

- do not hard-code provider logic into route handlers
- keep provider selection configurable
- preserve rule-based fallback for offline operation
- keep provider outputs deterministic enough for testing
