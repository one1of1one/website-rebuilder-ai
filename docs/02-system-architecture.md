# System Architecture

Reforge AI uses a layered architecture:

1. API layer
2. Engine layer
3. Storage layer
4. Provider layer
5. UI layer

## Main subsystems

- Core crawler engine
- Technology detector
- DOM analyzer
- Layout analyzer
- Component extractor
- Asset collector
- CSS intelligence
- JS intelligence
- SEO engine
- Accessibility engine
- Performance engine
- AI refactor engine
- Framework migration engine
- Project generator
- Exporter
- AI chat assistant
- File editor
- Plugin system
- Multi AI provider system
- Deployment center

## Data flow

URL input -> crawler -> analysis -> detection -> extraction -> report ->
generator -> exporter -> project storage -> ZIP download

## Design rules

- isolate network calls from transformation logic
- keep file storage independent from analysis
- keep AI provider abstraction behind one interface
- persist reports separately from generated source
- make every build reproducible from stored metadata

## Runtime split

- `backend/` handles HTTP and orchestration
- `engine/` holds reusable analysis and generation logic
- `storage/` stores projects, cache, reports, and exports
- `frontend/` remains plain HTML/CSS/JS
