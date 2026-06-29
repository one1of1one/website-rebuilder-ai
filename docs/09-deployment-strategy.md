# Deployment Strategy

## Local development

- Node.js + Express backend
- plain frontend served from the same app
- file-based storage for projects and reports

## Production goals

- predictable build and export flow
- immutable build artifacts
- isolated storage for generated projects
- secure handling of user-generated files

## Deployment center vision

- ZIP export
- Git repository export
- Docker export
- Plesk export
- cPanel export
- FTP package export

## Recommended environments

- local workstation
- containerized app server
- single VM deployment
- managed platform deployment

## Operational rules

- keep public app stable during engine upgrades
- separate temporary build output from persisted project storage
- make exports reproducible from stored artifacts
