# Folder Structure

## Target structure

```text
backend/
  api/
  crawler/
  analyzer/
  detectors/
  collectors/
  builders/
  exporters/
  reports/
  utils/
engine/
  component-extractor/
  seo/
  accessibility/
  optimizer/
  project-generator/
storage/
  projects/
  cache/
  reports/
  exports/
frontend/
docs/
```

## Responsibilities

- `backend/api/` exposes routes and request handlers
- `backend/crawler/` performs URL discovery and page collection
- `backend/analyzer/` detects stack and page-level signals
- `backend/detectors/` groups detection helpers
- `backend/collectors/` downloads and rewrites assets
- `backend/builders/` creates output project files
- `backend/exporters/` creates ZIP and deployment bundles
- `backend/reports/` writes report artifacts
- `backend/utils/` contains shared safe helpers
- `engine/` exposes higher-level engine modules
- `storage/` contains persistent artifacts and editor state

## Notes

- the folder plan supports gradual modularization
- thin compatibility wrappers are acceptable during migration
- persistent storage should not be mixed with temporary build staging
