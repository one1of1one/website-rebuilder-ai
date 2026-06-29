# Engine Design

The engine is responsible for analyzing a website and producing a structured
project.

## Engine stages

1. Fetch target URL
2. Crawl sitemap and robots
3. Crawl same-domain routes
4. Detect technologies
5. Analyze DOM and layout
6. Extract components
7. Collect assets
8. Rewrite paths
9. Generate reports
10. Build output project
11. Export ZIP and deployment bundles

## Engine modules

- crawler engine
- technology detector
- DOM analyzer
- layout analyzer
- component extractor
- asset collector
- CSS intelligence
- JS intelligence
- SEO engine
- accessibility engine
- performance engine
- AI refactor engine
- framework migration engine
- project generator
- exporter

## Design principles

- the crawler is responsible for discovery, not transformation
- detectors should only classify, not rewrite
- collectors should download assets, not decide architecture
- builders should generate files, not perform crawling
- reports should be generated from normalized engine output

## Future expansion

- deeper multi-page normalization
- visual diff aware extraction
- better route inference
- more robust CSS and JS deduplication
- provider-backed AI refactoring
