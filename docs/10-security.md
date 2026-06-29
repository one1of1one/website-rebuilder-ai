# Security

Reforge AI must treat every URL as untrusted input.

## Security priorities

- path traversal prevention
- safe URL parsing and normalization
- same-domain crawl restrictions
- safe file read/write access
- download filename validation
- report and export integrity

## Threat model

- malicious URLs
- crafted file paths
- oversized pages or assets
- SSRF-style outbound requests
- untrusted plugin code
- unsafe HTML or JS in stored projects

## Defensive rules

- sanitize all request inputs
- cap crawl size and page counts
- cap memory and file sizes where practical
- never trust returned HTML, JSON, or filenames
- keep provider and plugin abstractions behind validation layers

## Data handling

- store only what is needed for the project
- separate temporary cache from persistent project files
- avoid leaking credentials, cookies, or tokens into reports
