# API Design

## Core endpoints

- `POST /api/analyze`
- `POST /api/rebuild`
- `GET /api/projects`
- `GET /api/project/:id`
- `GET /api/report/:id`
- `GET /api/download/:zipName`

## Planned enterprise endpoints

- `POST /api/migrate`
- `POST /api/export`
- `POST /api/chat`

## API principles

- request and response payloads must be versioned implicitly through fields
- endpoints should return structured JSON with stable keys
- errors should be human-readable and machine-parseable
- build endpoints should return project IDs and download links
- report endpoints should return both summary scores and detailed artifacts

## Key payload concepts

- target URL
- project name
- output type
- rebuild mode
- export format
- build options
- provider selection
- file path and content for editor operations

## Compatibility rules

- keep legacy fields when adding new fields
- avoid breaking older clients that read `report`, `project`, or `downloadUrl`
- prefer additive response changes over renaming
