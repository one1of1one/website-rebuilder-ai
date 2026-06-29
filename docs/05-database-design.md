# Database Design

Reforge AI should start with file-based persistence and evolve toward SQLite
without changing the domain model.

## Logical entities

- Project
- ProjectReport
- ProjectFile
- BuildJob
- ExportArtifact
- AIConversation
- ProviderConfig
- Plugin

## Recommended SQLite tables

### projects

- id
- name
- source_url
- output_type
- rebuild_mode
- export_format
- status
- created_at
- updated_at

### reports

- id
- project_id
- report_json
- seo_score
- accessibility_score
- performance_score
- maintainability_score
- code_quality_score
- architecture_score
- created_at

### project_files

- id
- project_id
- path
- content
- checksum
- updated_at

### build_jobs

- id
- project_id
- status
- stage
- progress
- error_message
- created_at
- completed_at

### ai_messages

- id
- project_id
- provider
- role
- message
- created_at

## Storage strategy

- keep filesystem storage as the first production target
- introduce SQLite as an optional persistence layer
- preserve file copies for export compatibility
- separate reports from editable project files
