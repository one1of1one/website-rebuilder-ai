# Reforge AI

Analyze. Reverse Engineer. Rebuild.

Reforge AI is an AI website reverse engineering and modernization platform.
It analyzes a public website, crawls its structure, detects its stack, extracts
assets and components, and rebuilds the result into a clean developer-friendly
project.

The current application uses a plain HTML/CSS/JavaScript frontend and a
Node.js + Express backend. Frameworks such as Next.js and React are generated
outputs only; they are not used to run this application.

## Features

- Modern dark project builder and generated-project dashboard
- Target URL and custom project name
- Static HTML, PHP, Laravel, WordPress Theme, Next.js, Nuxt, React, Vue,
  Express, Node, and ASP.NET output formats
- Asset controls for images, video, fonts, icons, documents, manifests, and
  CSS path rewriting
- Optional optimization and code-generation settings stored with each project
- Common technology detection using HTML, response headers, and asset URLs
- Live URL analysis before generation
- Dynamic output-structure preview and eight-stage engine progress display
- Persistent project metadata and reusable ZIP download links
- Persistent per-project website reports with downloadable ZIP integration
- Export presets for ZIP, Git Repository, Docker, Plesk, cPanel, and FTP
- Storage-backed editable projects in `storage/projects/`
- Project editor and rule-based AI chat panel
- Mirror Mode for direct HTML/CSS/JavaScript and asset mirroring
- Rule-based AI Rebuild Mode for semantic section detection, component
  extraction, class cleanup, CSS deduplication, and developer-friendly output
- Framework Migration Mode for scaffold-first framework conversion
- Sitemap, robots.txt, and same-domain link crawling for up to 25 pages
- Confidence-scored component detection and categorized asset exploration
- Project inspection with source size, file count, pages, components, assets,
  and ZIP size

## Documentation map

Sprint 0 architecture and planning documents live in `docs/` and now include:

- `docs/00-product-vision.md`
- `docs/01-roadmap.md`
- `docs/02-system-architecture.md`
- `docs/03-folder-structure.md`
- `docs/04-api-design.md`
- `docs/05-database-design.md`
- `docs/06-engine-design.md`
- `docs/07-ai-engine.md`
- `docs/08-plugin-system.md`
- `docs/09-deployment-strategy.md`
- `docs/10-security.md`
- `docs/11-testing-strategy.md`
- `docs/12-coding-standards.md`
- `docs/13-sprint-plan.md`
- `docs/14-architecture-diagrams.md`
- `docs/15-decision-log.md`

AI Rebuild Mode does not require an external AI service. It currently uses
deterministic rules and includes a documented integration point in
`backend/rebuilder.js` for a future OpenAI or Codex code-generation stage.

## Rebuild modes

### Mirror Mode

When AI Rebuild Mode is off, the existing pipeline is unchanged:

- Download the returned HTML and reachable CSS, JavaScript, images, video, and
  fonts according to selected options
- Rewrite downloaded asset paths
- Wrap the mirrored page in the selected output scaffold
- Create a ZIP

### AI Rebuild Mode

When enabled, the pipeline additionally:

- Detects headers, navigation, hero areas, cards, forms, FAQ blocks, content
  sections, and footers
- Normalizes generated class names and removes inline implementation noise
- Deduplicates downloaded CSS rules for static HTML output
- Splits semantic sections into output-specific components
- Generates a readable README with detected technologies and components
- Uses developer-oriented structures for all eight output types
- Supports component splitting, CSS deduplication, class renaming,
  accessibility improvements, README files, `.htaccess`, `sitemap.xml`, and
  `robots.txt`

### AI Upgrade

AI Upgrade runs the component rebuild pipeline and additionally:

- Converts recognizable wrapper elements to semantic HTML5
- Adds modern responsive flex/grid layout foundations
- Extracts inline CSS and JavaScript
- Removes duplicate CSS rules
- Improves SEO metadata and accessibility attributes
- Generates README, Apache/Plesk `.htaccess`, `robots.txt`, and `sitemap.xml`

### Framework Migration

Framework Migration reuses the analysis engine but biases the generator toward
the selected target stack. It is intended for conversions such as HTML to
Laravel, HTML to Next.js, PHP to Laravel, WordPress to Next.js, Bootstrap to
React, Vue to Next.js, React to Laravel Blade, and similar migration paths.

## Technology analysis

Select **Analyze URL** after entering a target to inspect the site before
building. Detection covers HTML, CSS, JavaScript, PHP hints, Laravel, Blade,
Livewire, WordPress, Elementor, WooCommerce, React, Next.js, Vue, Nuxt,
Angular, Bootstrap, Tailwind, jQuery, Alpine.js, Swiper, AOS, GSAP,
FontAwesome, Google Fonts, Cloudflare, Vite, Axios, Shopify, Webflow, Google
Analytics, Meta Pixel, Tag Manager, CDNs, video providers, maps, payment
providers, layout types, component families, SEO signals, accessibility gaps,
and performance signals.

Every completed build receives a persisted website report containing page and
asset counts, detected technologies, confidence-scored components, internal
routes, responsive status, SEO/accessibility/performance scores, estimated
similarity, project size, and file count.

## Analysis engine

The rule-based engine is split into focused backend modules:

- `analyzer.js` performs DOM, layout, SEO, accessibility, and performance
  analysis alongside technology detection.
- `component-detector.js` detects Header, Navbar, Hero, Slider, Cards, Gallery,
  FAQ, Contact Form, Footer, Testimonials, Blog Cards, Product Grid, Pricing,
  Breadcrumb, Sidebar, Modal, Accordion, and Tabs sections with confidence
  scores.
- `crawler.js` tries `robots.txt` and sitemap files, then crawls normalized
  same-domain links up to the 25-page limit.
- `route-detector.js` provides URL and route normalization primitives.
- `asset-analyzer.js` inventories images, CSS, JavaScript, fonts, videos,
  icons, SVG, audio, PDFs, manifests, JSON files, and external CDN assets.
- `asset-collector.js` downloads assets into organized folders, rewrites HTML
  and CSS paths, and records failed downloads.
- `component-builder.js` creates reusable PHP/framework component files and
  static section comments, component maps, and output-specific placeholders.
- `project-generator.js` produces multi-page Static/PHP projects and clean
  framework scaffold outputs with `COMPONENTS.md`, `README.md`, and
  `MIGRATION_NOTES.md` where applicable.
- `engine/index.js` provides a single modular backend entrypoint.
- `export-manager.js` adds export-preset files such as Docker and Git helper
  artifacts.
- `ai/` contains the provider abstraction and rule-based chat actions.
- `reporter.js` produces analysis scores, website reports, and generated-project
  statistics.
- `cleaner.js` performs rule-based HTML/CSS/JavaScript cleanup and creates
  optional support files.
- `docs/14-architecture-diagrams.md` captures Mermaid diagrams for the full
  engine flow, storage layout, and future SaaS shape.
- `docs/15-decision-log.md` records the architectural decisions that keep the
  product scope accurate and stable.

These modules include a documented extension point for future OpenAI-assisted
semantic refactoring. No external AI API is required by the current engine.

## Requirements

- Node.js 18 or newer
- npm

## Installation

```bash
npm install
```

## Run

Development mode with file watching:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

The default address is <http://localhost:4000>. To use another port in
PowerShell:

```powershell
$env:PORT = "4000"
npm run dev
```

## Test and verification

The repository now includes a fast analyzer unit test suite and an endpoint
verification script that exercises the core API surface against a running local
server:

```bash
npm test
npm run verify:endpoints
```

`npm test` runs the analyzer and generator fixture tests. `npm run
verify:endpoints` and `npm run test:api` run the API verification check.

By default the script targets `http://localhost:3000`. Set `PORT` or `BASE_URL`
if you are running the server elsewhere.

## Usage

1. Enter a public HTTP or HTTPS target URL.
2. Enter a project name.
3. Choose one of the eight output formats.
4. Select asset and build options.
5. Choose **Mirror Website**, **AI Rebuild Project**, **Framework Migration**,
   or **AI Upgrade**.
6. Select **Rebuild Website**.
7. Review the final website report and download the generated ZIP.

Completed builds appear in **Generated Projects** and remain available after a
server restart as long as their ZIP files remain in `output/`.

The standardized storage layout now uses:

- `storage/projects/` for persisted project folders and the project index
- `storage/reports/` for report JSON files
- `storage/cache/` for temporary export/rebuild workspaces
- `storage/exports/` for export copies

## API

### `POST /api/rebuild`

Example request:

```json
{
  "url": "https://example.com",
  "projectName": "Example Project",
  "outputType": "static-html",
  "rebuildMode": "ai-upgrade",
  "aiRebuildMode": true,
  "options": {
    "downloadImages": true,
    "downloadVideos": true,
    "downloadFonts": true,
    "rewriteCss": true,
    "optimizeImages": false,
    "mobileResponsive": true,
    "seoOptimize": true,
    "generateComponents": false,
    "aiCleanCode": false,
    "splitComponents": true,
    "removeDuplicateCss": true,
    "renameClasses": true,
    "improveAccessibility": true,
    "generateReadme": true,
    "generateHtaccess": false,
    "generateSitemap": false,
    "generateRobots": false
  }
}
```

Valid output types are `static-html`, `php`, `laravel`, `wordpress`, `nextjs`,
`nuxt`, `react`, `vue`, `express`, `node`, and `aspnet`.

`aiRebuildMode` is optional and defaults to `false`, preserving Mirror Mode.
`rebuildMode` accepts `mirror`, `ai-rebuild`, `framework-migration`, or
`ai-upgrade`. The legacy `aiRebuildMode` boolean remains supported.

`exportFormat` accepts `zip`, `git`, `docker`, `plesk`, `cpanel`, or `ftp`.
The selected preset is stored with the project record and influences the
generated bundle contents.

### `POST /api/analyze`

Accepts `{ "url": "https://example.com" }` and returns detected technologies,
confidence-scored components, normalized routes, categorized assets, scores, and
a complete website report without generating a project.

### `GET /api/projects`

Returns up to 100 recently generated project records, newest first.

### `GET /api/download/:zipName`

Downloads a generated project ZIP.

### `GET /api/report/:projectId`

Returns the persisted JSON website report for a generated project.

### `GET /api/project/:projectId/inspector`

Returns generated project size, file count, pages generated, components
generated, assets downloaded, and ZIP size.

### `GET /api/project/:projectId`

Returns project metadata, the stored report, and the current file list from the
editable project storage.

### `GET /api/project/:projectId/files`

Returns the editable file list for the project.

### `GET /api/project/:projectId/file`

Accepts `?path=...` and returns the file contents.

### `POST /api/project/:projectId/file`

Accepts `{ "path": "file.txt", "content": "..." }` and saves the file.

### `POST /api/migrate`

Shortcut for framework-migration rebuilds.

### `POST /api/export`

Accepts `{ "projectId": "...", "exportFormat": "docker" }` and creates a new
export archive from the stored project.

### `POST /api/chat`

Accepts `{ "projectId": "...", "message": "..." }` and returns a rule-based
change suggestion. Provider placeholders are present for future OpenAI, Claude,
Gemini, Ollama, and OpenRouter integration.

## Storage

- ZIP files: `output/`
- Project metadata: `backend/output/projects.json`
- Project reports: `backend/output/reports/<projectId>.json`
- Editable project storage: `storage/projects/<projectId>/`
- Report mirrors: `storage/reports/<projectId>.json`
- Temporary cache: `storage/cache/`
- Export mirrors: `storage/exports/`

Every new project ZIP also includes `report.json`, `REPORT.md`, and the legacy
`website-report.json` compatibility file.

Temporary generation directories are removed after each ZIP is created.

## Project structure

```text
frontend/
  index.html
  style.css
  app.js
backend/
  api/
    index.js
    routes.js
  analyzer/
    index.js
  ai/
    index.js
    chat.js
    providers.js
  builders/
    index.js
  collectors/
    index.js
  crawler/
    index.js
  detectors/
    index.js
  exporters/
    index.js
  migrations/
    index.js
  reports/
    generator.js
    index.js
  utils/
    index.js
  engine/
    index.js
  server.js
  analyzer.js
  asset-analyzer.js
  asset-collector.js
  cleaner.js
  component-builder.js
  component-detector.js
  crawler.js
  downloader.js
  export-manager.js
  project-generator.js
  rebuilder.js
  reporter.js
  route-detector.js
  generators/
    static-html.js
    php.js
    nextjs.js
    scaffolds.js
  output/
    projects.json
    reports/
  zipper.js
output/
package.json
README.md
```

## Limitations and responsible use

- Only rebuild websites you own or have permission to copy.
- The server captures returned HTML; content created later by browser JavaScript
  may not be included.
- Authentication, APIs, databases, form handlers, and original server-side
  behavior are not reproduced.
- Remote servers may reject asset requests. Unavailable assets retain their
  original URL.
- Optimize Images is recorded as a project preference for a future image-codec
  stage. AI Rebuild Mode provides rule-based components and code cleanup without
  calling an external AI service.
