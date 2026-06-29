# Coding Standards

## General rules

- prefer clear, small modules
- keep functions focused
- avoid hidden side effects
- prefer explicit data flow over implicit globals
- preserve backward compatibility in public APIs

## JavaScript style

- use CommonJS until a deliberate migration plan exists
- keep runtime dependencies minimal
- use safe path and URL helpers
- keep comments reserved for non-obvious logic

## Product rules

- do not break localhost development flow
- do not couple UI to engine internals
- do not mix persistent storage with temporary build staging
- do not introduce AI provider calls without abstraction

## Documentation rules

- docs should describe the intended system, not only the current code
- every new major subsystem should have a documented owner and purpose
- keep roadmap and sprint docs aligned with implementation state
