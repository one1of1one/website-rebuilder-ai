const path = require("path");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const {
  beautifyCss,
  beautifyJavaScript,
  cleanHtml,
  improveSemanticHtml,
  removeDuplicateCssBlocks,
  rewriteCssClassNames,
  upgradeHtml,
} = require("./cleaner");
const {
  addSectionComments,
  buildComponentFiles,
  componentIdentifier,
} = require("./component-builder");
const { writeExportPreset } = require("./export-manager");
const { reconstructWebsite } = require("./reconstruction");
const {
  convertHtmlToBlade,
  convertHtmlToJsx,
  convertHtmlToVueTemplate,
} = require("./conversion");

function slug(value, fallback = "page") {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || fallback
  );
}

function pageFilename(route, extension) {
  const pathname = new URL(route, "https://placeholder.local").pathname;
  if (pathname === "/") return `index.${extension}`;
  return `${slug(pathname)}.${extension}`;
}

function routeFileMap(pages, extension) {
  return new Map(
    pages.map((page) => [page.path, pageFilename(page.path, extension)]),
  );
}

function rewriteInternalLinks(html, pages, extension) {
  const $ = cheerio.load(html, { decodeEntities: false });
  const files = routeFileMap(pages, extension);
  $("a[href]").each((_, element) => {
    const value = $(element).attr("href");
    if (!value) return;
    try {
      const route = new URL(value, "https://placeholder.local").pathname.replace(
        /\/$/,
        "",
      ) || "/";
      const target = files.get(route);
      if (target) $(element).attr("href", target);
    } catch {
      // Preserve malformed and non-HTTP link values.
    }
  });
  return $.html();
}

async function readDirectoryFiles(directory) {
  if (!(await fs.pathExists(directory))) return [];
  const entries = await fs.readdir(directory);
  return Promise.all(
    entries.map((entry) => fs.readFile(path.join(directory, entry), "utf8")),
  );
}

async function moveDirectory(source, destination) {
  if (!(await fs.pathExists(source))) {
    await fs.ensureDir(destination);
    return;
  }
  await fs.ensureDir(destination);
  const entries = await fs.readdir(source);
  for (const entry of entries) {
    await fs.move(path.join(source, entry), path.join(destination, entry), {
      overwrite: true,
    });
  }
  await fs.remove(source);
}

function preparePage(page, mode, options, projectName, sourceUrl, pageIndex = 0) {
  if (mode === "mirror") {
    return { ...page, html: page.html, css: "", js: "" };
  }

  const upgraded =
    mode === "ai-upgrade"
      ? upgradeHtml(page.html, {
          title: page.title || projectName,
          sourceUrl: page.url || sourceUrl,
        })
      : { html: improveSemanticHtml(page.html), css: "" };
  const cleaned = cleanHtml(upgraded.html, {
    ...options,
    classNamePrefix: `clean-class-page-${pageIndex + 1}`,
    inlineStylePrefix: `inline-style-page-${pageIndex + 1}`,
    removeDuplicateCss: true,
    renameClasses: true,
    improveAccessibility: true,
  });
  return {
    ...page,
    html: cleaned.html,
    css: [upgraded.css, cleaned.css].filter(Boolean).join("\n\n"),
    js: cleaned.js,
    classRenames: cleaned.classRenames,
    cleanup: cleaned.cleanup,
  };
}

function combinedClassRenames(pages) {
  return Object.assign({}, ...pages.map((page) => page.classRenames || {}));
}

function cleanupReport({ pages, mode }) {
  const totals = pages.reduce(
    (result, page) => {
      for (const [key, value] of Object.entries(page.cleanup || {})) {
        result[key] = (result[key] || 0) + value;
      }
      return result;
    },
    {},
  );
  const classRenames = combinedClassRenames(pages);

  return `# Cleanup Report

Mode: ${mode}
Pages processed: ${pages.length}

## Applied cleanup

- Generated class names renamed: ${totals.classNamesRenamed || 0}
- Inline style blocks extracted: ${totals.inlineStyleBlocksExtracted || 0}
- Inline style attributes extracted: ${totals.inlineStyleAttributesExtracted || 0}
- Inline scripts extracted: ${totals.inlineScriptsExtracted || 0}
- Empty elements removed: ${totals.emptyElementsRemoved || 0}
- HTML, CSS, and JavaScript formatting normalized
- Semantic landmarks and accessibility-safe defaults applied
- Component section comments added where the output format supports HTML comments

## Class name map

${Object.entries(classRenames).map(([from, to]) => `- \`${from}\` -> \`${to}\``).join("\n") || "- No generated class names required renaming."}
`;
}

function supportFileContents(pages, sourceUrl) {
  const urls = pages.map((page) => page.url || new URL(page.path, sourceUrl).href);
  return {
    robots:
      "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n",
    sitemap: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`,
    htaccess:
      "Options -Indexes\nRewriteEngine On\nDirectoryIndex index.html index.php\n",
  };
}

function projectReadme({
  projectName,
  sourceUrl,
  outputType,
  mode,
  pages,
  components,
  technologies,
  componentMap = [],
}) {
  return `# ${projectName}

Generated by Website Rebuilder AI Pro Engine v1.0.

- Source: ${sourceUrl}
- Output: ${outputType}
- Mode: ${mode}
- Pages generated: ${pages.length}
- Components: ${components.map((component) => component.name).join(", ") || "None"}
- Technologies: ${technologies.join(", ") || "HTML"}

## Development notes

Review external integrations, forms, authentication, and API calls before
production deployment. Downloaded assets are local and paths have been rewritten.

## Editing the project

- Update component files in the \`components/\` folder first.
- Keep shared layout changes in \`includes/\`, \`layouts/\`, or framework root
  layout files.
- If this project came from AI Upgrade mode, verify semantic headings, image
  alt text, and lazy-loading behavior before shipping.
- If this is a framework migration scaffold, consult \`MIGRATION_NOTES.md\` for
  the manual wiring that still remains.

## Component map

${componentMap.map((component) => `- ${component.name} → ${component.file}`).join("\n") || "- None"}
`;
}

function componentsMarkdown({ components = [], outputType, mode }) {
  return `# Components

Mode: ${mode}
Output type: ${outputType}

${components
  .map(
    (component) =>
      `- ${component.name} (${component.type}, ${component.confidence}%) -> ${component.file}`,
  )
  .join("\n") || "- None"}
`;
}

function migrationNotes({ projectName, outputType, technologies, components }) {
  return `# Migration Notes

Project: ${projectName}
Target stack: ${outputType}

What was reconstructed:

- Public HTML structure and visible components
- Assets and routes that were observable from the site
- Detected technologies: ${technologies.join(", ") || "HTML"}
- Detected components: ${components.map((component) => component.name).join(", ") || "None"}

What still needs manual wiring:

- Backend/API endpoints
- Authentication and state management
- Data fetching and environment variables
- Framework-specific routing conventions
- Production deployment configuration
`;
}

function reconstructionMarkdown(reconstruction) {
  return `# Reconstruction Report

- Source: ${reconstruction.sourceUrl}
- Output framework: ${reconstruction.outputType}
- DOM nodes analyzed: ${reconstruction.domGraph.nodeCount}
- Semantic sections: ${reconstruction.semanticMap.count}
- Components classified: ${reconstruction.componentGraph.nodes.length}
- Routes mapped: ${reconstruction.routePageMap.routes.length}
- Assets mapped: ${reconstruction.assetComponentRelationships.assets.length}

## Components

${reconstruction.componentGraph.nodes
  .map(
    (component) =>
      `- ${component.name} (${component.type}, ${component.confidence}% confidence)`,
  )
  .join("\n") || "- No reusable components detected."}

## Routes

${reconstruction.routePageMap.pages
  .map((page) => `- \`${page.path}\` - ${page.title}`)
  .join("\n") || "- No routes discovered."}

## Framework mapping

- Entry: \`${reconstruction.frameworkMap.structure.entry}\`
- Components: \`${reconstruction.frameworkMap.structure.components}\`
- Pages: \`${reconstruction.frameworkMap.structure.pages}\`
- Assets: \`${reconstruction.frameworkMap.structure.assets}\`
`;
}

const FRAMEWORK_GUIDES = {
  php: {
    runtime: "PHP 8.1+",
    install: "No dependency installation is required.",
    start: "php -S localhost:8000",
    components: "components/*.php",
    entry: "index.php",
  },
  laravel: {
    runtime: "PHP 8.2+ and Composer",
    install: "composer install",
    start: "php artisan serve",
    components: "resources/views/components/*.blade.php",
    entry: "resources/views/home.blade.php",
  },
  react: {
    runtime: "Node.js 18+",
    install: "npm install",
    start: "npm run dev",
    components: "src/components/*.jsx",
    entry: "src/pages/Home.jsx",
  },
  nextjs: {
    runtime: "Node.js 18+",
    install: "npm install",
    start: "npm run dev",
    components: "components/*.jsx",
    entry: "app/page.jsx",
  },
  vue: {
    runtime: "Node.js 18+",
    install: "npm install",
    start: "npm run dev",
    components: "src/components/*.vue",
    entry: "src/views/Home.vue",
  },
  wordpress: {
    runtime: "WordPress 6+ and PHP 8.1+",
    install: "Copy this directory to wp-content/themes and activate it.",
    start: "Use the WordPress development server for the installation.",
    components: "template-parts/*.php",
    entry: "page.php",
  },
};

function frameworkReadme({
  projectName,
  sourceUrl,
  outputType,
  mode,
  pages,
  components,
  technologies,
  componentMap = [],
}) {
  const guide = FRAMEWORK_GUIDES[outputType];
  const base = projectReadme({
    projectName,
    sourceUrl,
    outputType,
    mode,
    pages,
    components,
    technologies,
    componentMap,
  });
  if (!guide) return base;
  const frameworkLabel = {
    php: "PHP",
    nextjs: "Next.js",
    wordpress: "WordPress",
  }[outputType] || `${outputType.charAt(0).toUpperCase()}${outputType.slice(1)}`;

  return `${base}
## ${frameworkLabel} structure

- Runtime: ${guide.runtime}
- Entry point: \`${guide.entry}\`
- Generated components: \`${guide.components}\`
- Install: \`${guide.install}\`
- Start: \`${guide.start}\`

The entry point composes the generated component files. Shared downloaded assets
remain under the framework's public asset directory.
`;
}

async function writeSupportFiles(directory, support, includeHtaccess = true) {
  await fs.writeFile(path.join(directory, "robots.txt"), support.robots);
  await fs.writeFile(path.join(directory, "sitemap.xml"), support.sitemap);
  if (includeHtaccess) {
    await fs.writeFile(path.join(directory, ".htaccess"), support.htaccess);
  }
}

async function generateStatic(context) {
  const {
    pages,
    directory,
    mode,
    options,
    projectName,
    sourceUrl,
  } = context;
  const processed = pages.map((page, index) =>
    preparePage(page, mode, options, projectName, sourceUrl, index),
  );
  const primary = processed[0];
  const built = await buildComponentFiles({
    html: primary.html,
    outputType: "static-html",
    directory,
    enabled: mode !== "mirror" && options.splitComponents !== false,
    detectedComponents: context.detectedComponents || [],
    projectName,
    mode,
  });
  const components = built.components;
  const cssFiles = await readDirectoryFiles(path.join(directory, "assets", "css"));
  const jsFiles = await readDirectoryFiles(path.join(directory, "assets", "js"));
  const css = [...cssFiles, ...processed.map((page) => page.css)]
    .filter(Boolean)
    .join("\n\n")
    .split("../fonts/")
    .join("fonts/")
    .split("../images/")
    .join("images/")
    .split("../videos/")
    .join("videos/")
    .split("../icons/")
    .join("icons/")
    .split("../documents/")
    .join("documents/")
    .split("../manifests/")
    .join("manifests/")
    .split("../data/")
    .join("data/")
    .split("../svg/")
    .join("images/");
  const js = [...jsFiles, ...processed.map((page) => page.js)]
    .filter(Boolean)
    .join("\n\n");

  await moveDirectory(
    path.join(directory, "assets", "images"),
    path.join(directory, "images"),
  );
  await moveDirectory(
    path.join(directory, "assets", "svg"),
    path.join(directory, "images"),
  );
  await moveDirectory(
    path.join(directory, "assets", "fonts"),
    path.join(directory, "fonts"),
  );
  await moveDirectory(
    path.join(directory, "assets", "videos"),
    path.join(directory, "videos"),
  );
  await moveDirectory(
    path.join(directory, "assets", "audio"),
    path.join(directory, "audio"),
  );
  await moveDirectory(
    path.join(directory, "assets", "icons"),
    path.join(directory, "icons"),
  );
  await moveDirectory(
    path.join(directory, "assets", "documents"),
    path.join(directory, "documents"),
  );
  await moveDirectory(
    path.join(directory, "assets", "manifests"),
    path.join(directory, "manifests"),
  );
  await moveDirectory(
    path.join(directory, "assets", "data"),
    path.join(directory, "data"),
  );
  await fs.remove(path.join(directory, "assets"));

  for (const page of processed) {
    const $ = cheerio.load(page.html, { decodeEntities: false });
    $('link[rel="stylesheet"][href^="assets/css/"]').remove();
    $('script[src^="assets/js/"]').remove();
    if (!$('link[href="style.css"]').length) {
      $("head").append('<link rel="stylesheet" href="style.css">');
    }
    if (!$('script[src="script.js"]').length) {
      $("body").append('<script src="script.js"></script>');
    }
    let html = $.html()
      .split("assets/images/")
      .join("images/")
      .split("assets/svg/")
      .join("images/")
      .split("assets/fonts/")
      .join("fonts/")
      .split("assets/videos/")
      .join("videos/")
      .split("assets/audio/")
      .join("audio/")
      .split("assets/icons/")
      .join("icons/")
      .split("assets/documents/")
      .join("documents/")
      .split("assets/manifests/")
      .join("manifests/")
      .split("assets/data/")
      .join("data/");
    html = rewriteInternalLinks(html, processed, "html");
    if (mode !== "mirror") html = addSectionComments(html, components);
    await fs.writeFile(
      path.join(directory, pageFilename(page.path, "html")),
      html,
    );
  }

  await fs.writeFile(
    path.join(directory, "style.css"),
    mode === "mirror"
      ? css
      : beautifyCss(
          rewriteCssClassNames(
            removeDuplicateCssBlocks(css),
            combinedClassRenames(processed),
          ),
        ),
  );
  await fs.writeFile(
    path.join(directory, "script.js"),
    beautifyJavaScript(js) || '"use strict";\n',
  );
  return { pages: processed, components, componentMap: built.componentMap, generatedFiles: built.generatedFiles };
}

async function generatePhp(context) {
  const {
    pages,
    directory,
    mode,
    options,
    projectName,
    sourceUrl,
  } = context;
  const processed = pages.map((page, index) =>
    preparePage(page, mode, options, projectName, sourceUrl, index),
  );
  const primary = processed[0];
  const built = await buildComponentFiles({
    html: primary.html,
    outputType: "php",
    directory,
    enabled: mode !== "mirror" && options.splitComponents !== false,
    detectedComponents: context.detectedComponents || [],
    projectName,
    mode,
  });
  const components = built.components;

  for (const page of processed) {
    const $ = cheerio.load(
      rewriteInternalLinks(page.html, processed, "php"),
      { decodeEntities: false },
    );
    const body = $("body").html() || "";
    const pageComponents = components.filter(
      (component) => !["header", "footer"].includes(component.type),
    );
    const componentRequires =
      page === primary && components.length
        ? pageComponents
            .map(
              (component) =>
                `require __DIR__ . '/${component.file.replace(/\\/g, "/")}';`,
            )
            .join("\n")
        : `echo <<<'HTML'\n${body}\nHTML;`;
    const pageSource = `<?php
require __DIR__ . '/includes/header.php';
${componentRequires}
require __DIR__ . '/includes/footer.php';
`;
    await fs.writeFile(
      path.join(directory, pageFilename(page.path, "php")),
      pageSource,
    );
    const reconstructedPageName =
      page.path === "/" ? "home.php" : pageFilename(page.path, "php");
    await fs.outputFile(
      path.join(directory, "pages", reconstructedPageName),
      pageSource.replaceAll("__DIR__ . '/", "dirname(__DIR__) . '/"),
    );
  }

  for (const requiredPage of ["about.php", "contact.php"]) {
    if (!(await fs.pathExists(path.join(directory, requiredPage)))) {
      const title = requiredPage.startsWith("about") ? "About" : "Contact";
      await fs.writeFile(
        path.join(directory, requiredPage),
        `<?php require __DIR__ . '/includes/header.php'; ?>\n<main><h1>${title}</h1><p>Add ${title.toLowerCase()} content here.</p></main>\n<?php require __DIR__ . '/includes/footer.php'; ?>\n`,
      );
    }
  }
  await applyExtractedAssets("php", directory, processed);
  await rewriteGeneratedCss(directory, combinedClassRenames(processed));
  return { pages: processed, components, componentMap: built.componentMap, generatedFiles: built.generatedFiles };
}

async function appendFile(filePath, content) {
  if (!content) return;
  await fs.appendFile(filePath, `\n${content.trim()}\n`);
}

async function replaceInFile(filePath, search, replacement) {
  if (!(await fs.pathExists(filePath))) return;
  const content = await fs.readFile(filePath, "utf8");
  await fs.writeFile(filePath, content.replace(search, replacement));
}

async function applyExtractedAssets(outputType, directory, pages) {
  const classRenames = combinedClassRenames(pages);
  const css = beautifyCss(
    rewriteCssClassNames(
      pages.map((page) => page.css).filter(Boolean).join("\n\n"),
      classRenames,
    ),
  );
  const js = beautifyJavaScript(
    pages.map((page) => page.js).filter(Boolean).join("\n\n"),
  );
  if (!css && !js) return;

  if (outputType === "php") {
    if (css) {
      await fs.outputFile(path.join(directory, "assets", "css", "rebuilt-inline.css"), `${css}\n`);
      await replaceInFile(
        path.join(directory, "includes", "header.php"),
        "</head>",
        '<link rel="stylesheet" href="/assets/css/rebuilt-inline.css"></head>',
      );
    }
    if (js) {
      await fs.outputFile(path.join(directory, "assets", "js", "rebuilt-inline.js"), `${js}\n`);
      await replaceInFile(
        path.join(directory, "includes", "footer.php"),
        "</body>",
        '<script src="/assets/js/rebuilt-inline.js" defer></script></body>',
      );
    }
  } else if (outputType === "laravel") {
    if (css) await fs.outputFile(path.join(directory, "public", "css", "rebuilt-inline.css"), `${css}\n`);
    if (js) await fs.outputFile(path.join(directory, "public", "js", "rebuilt-inline.js"), `${js}\n`);
    await replaceInFile(
      path.join(directory, "resources", "views", "layouts", "app.blade.php"),
      "</head>",
      `${css ? "\n  <link rel=\"stylesheet\" href=\"{{ asset('css/rebuilt-inline.css') }}\">" : ""}\n</head>`,
    );
    if (js) {
      await replaceInFile(
        path.join(directory, "resources", "views", "layouts", "app.blade.php"),
        "</body>",
        "  <script src=\"{{ asset('js/rebuilt-inline.js') }}\" defer></script>\n</body>",
      );
    }
  } else if (outputType === "wordpress") {
    if (css) await appendFile(path.join(directory, "style.css"), css);
    if (js) {
      await fs.writeFile(path.join(directory, "rebuilt-inline.js"), `${js}\n`);
      await appendFile(
        path.join(directory, "functions.php"),
        "\nfunction rebuilt_theme_scripts() {\n    wp_enqueue_script('rebuilt-inline', get_template_directory_uri() . '/rebuilt-inline.js', [], '1.0.0', true);\n}\nadd_action('wp_enqueue_scripts', 'rebuilt_theme_scripts');",
      );
    }
  } else if (outputType === "nextjs") {
    if (css) await appendFile(path.join(directory, "app", "globals.css"), css);
    if (js) {
      await fs.outputFile(path.join(directory, "public", "rebuilt-inline.js"), `${js}\n`);
      await replaceInFile(
        path.join(directory, "app", "layout.jsx"),
        "{children}</body>",
        '{children}<script src="/rebuilt-inline.js" defer /></body>',
      );
    }
  } else if (["react", "vue"].includes(outputType)) {
    if (css) await appendFile(path.join(directory, "src", "styles.css"), css);
    if (js) {
      await fs.outputFile(path.join(directory, "public", "rebuilt-inline.js"), `${js}\n`);
      await appendFile(
        path.join(directory, "index.html"),
        '\n<script src="/rebuilt-inline.js" defer></script>',
      );
    }
  }
}

async function rewriteGeneratedCss(directory, classRenames) {
  if (!(await fs.pathExists(directory)) || !Object.keys(classRenames).length) return;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteGeneratedCss(entryPath, classRenames);
    } else if (entry.name.endsWith(".css")) {
      const css = await fs.readFile(entryPath, "utf8");
      await fs.writeFile(
        entryPath,
        `${beautifyCss(rewriteCssClassNames(css, classRenames))}\n`,
      );
    }
  }
}

async function generateScaffold(context) {
  const {
    outputType,
    pages,
    directory,
    mode,
    options,
    projectName,
    sourceUrl,
  } = context;
  const processed = pages.map((page, index) =>
    preparePage(page, mode, options, projectName, sourceUrl, index),
  );
  const primary = processed[0];
  const built = await buildComponentFiles({
    html: primary.html,
    outputType,
    directory,
    enabled: mode !== "mirror" && options.splitComponents !== false,
    detectedComponents: context.detectedComponents || [],
    projectName,
    mode,
  });
  const components = built.components;

  if (outputType === "laravel") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "public", "assets"),
    );
    const laravelRoutes = processed
      .map((page) => {
        const route = page.path || "/";
        const view = route === "/" ? "home" : slug(route, "page");
        return `Route::view(${JSON.stringify(route)}, 'pages.${view}');`;
      })
      .join("\n");
    await fs.outputFile(
      path.join(directory, "routes", "web.php"),
      `<?php
use Illuminate\\Support\\Facades\\Route;

${laravelRoutes}
`,
    );
    await fs.outputFile(
      path.join(directory, "resources", "views", "layouts", "app.blade.php"),
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${projectName}</title>
</head>
<body>
  @yield('content')
</body>
</html>
`,
    );
    for (const page of processed) {
      const view = page.path === "/" ? "home" : slug(page.path, "page");
      const pageMarkup =
        page === primary
          ? components
              .map(
                (component) =>
                  `  <x-${slug(component.name, "component")} />`,
              )
              .join("\n")
          : convertHtmlToBlade(
              cheerio.load(page.html, { decodeEntities: false })("body").html() || "",
            ).code;
      await fs.outputFile(
        path.join(
          directory,
          "resources",
          "views",
          "pages",
          `${view}.blade.php`,
        ),
        `@extends('layouts.app')

@section('content')
${pageMarkup}
@endsection
`,
      );
    }
    await fs.outputFile(
      path.join(directory, "resources", "views", "home.blade.php"),
      "@include('pages.home')\n",
    );
    await fs.writeJson(
      path.join(directory, "composer.json"),
      {
        name: `generated/${slug(projectName, "rebuilt-site")}`,
        description: "Laravel Blade project generated by Website Rebuilder AI Pro",
        type: "project",
        require: { php: "^8.2", "laravel/framework": "^11.0" },
      },
      { spaces: 2 },
    );
  } else if (outputType === "wordpress") {
    const $ = cheerio.load(primary.html, { decodeEntities: false });
    await fs.writeFile(
      path.join(directory, "style.css"),
      `/*
Theme Name: ${projectName}
Description: Component-based theme generated by Website Rebuilder AI Pro
Version: 1.0.0
Text Domain: ${slug(projectName, "rebuilt-theme")}
*/
`,
    );
    await fs.writeFile(
      path.join(directory, "functions.php"),
      `<?php
function rebuilt_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    register_nav_menus(['primary' => __('Primary Menu', '${slug(projectName, "rebuilt-theme")}')]);
}
add_action('after_setup_theme', 'rebuilt_theme_setup');

function rebuilt_theme_assets() {
    wp_enqueue_style('rebuilt-theme', get_stylesheet_uri(), [], '1.0.0');
}
add_action('wp_enqueue_scripts', 'rebuilt_theme_assets');
`,
    );
    await fs.writeFile(
      path.join(directory, "header.php"),
      `<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
${$("header").first().toString()}
`,
    );
    await fs.writeFile(
      path.join(directory, "footer.php"),
      `${$("footer").first().toString()}
<?php wp_footer(); ?>
</body>
</html>
`,
    );
    const contentComponents = components.filter(
      (component) => !["header", "footer"].includes(component.type),
    );
    await fs.writeFile(
      path.join(directory, "page.php"),
      `<?php get_header(); ?>
<main id="primary">
${contentComponents
  .map((component) => `  <?php get_template_part('${component.file.replace(/\\/g, "/").replace(/\.php$/, "")}'); ?>`)
  .join("\n")}
</main>
<?php get_footer(); ?>
`,
    );
    await fs.copy(
      path.join(directory, "page.php"),
      path.join(directory, "front-page.php"),
    );
    await fs.writeFile(
      path.join(directory, "single.php"),
      "<?php get_header(); ?><main id=\"primary\"><?php while (have_posts()) : the_post(); the_content(); endwhile; ?></main><?php get_footer(); ?>\n",
    );
    await fs.writeFile(
      path.join(directory, "index.php"),
      "<?php get_header(); ?><main id=\"primary\"><?php while (have_posts()) : the_post(); the_content(); endwhile; ?></main><?php get_footer(); ?>\n",
    );
  } else if (outputType === "nextjs") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "public", "assets"),
    );
    const imports = components
      .map((component) => {
        const identifier = componentIdentifier(component.name);
        const componentPath = component.file
          .replace(/\\/g, "/")
          .replace(/\.[^.]+$/, "");
        return `import ${identifier} from "../${componentPath}";`;
      })
      .join("\n");
    await fs.outputFile(
      path.join(directory, "app", "page.jsx"),
      `${imports}

export default function Home() {
  return (
    <main>
${components.map((component) => `      <${componentIdentifier(component.name)} />`).join("\n")}
    </main>
  );
}
`,
    );
    await fs.outputFile(
      path.join(directory, "app", "layout.jsx"),
      `import "./globals.css";

export const metadata = {
  title: ${JSON.stringify(projectName)},
  description: ${JSON.stringify(`${projectName} rebuilt website`)},
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
`,
    );
    await fs.outputFile(
      path.join(directory, "app", "globals.css"),
      "* { box-sizing: border-box; }\nbody { margin: 0; }\nimg, video { max-width: 100%; height: auto; }\n",
    );
    await fs.writeJson(
      path.join(directory, "package.json"),
      {
        name: slug(projectName),
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: { next: "^15.1.3", react: "^19.0.0", "react-dom": "^19.0.0" },
      },
      { spaces: 2 },
    );
  } else if (outputType === "nuxt") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "public", "assets"),
    );
    await fs.outputFile(
      path.join(directory, "app", "app.vue"),
      '<template><NuxtPage /></template>\n',
    );
    await fs.outputFile(
      path.join(directory, "app", "page.vue"),
      `<template><main><h1>${projectName}</h1><p>Replace this Nuxt scaffold with extracted components.</p></main></template>\n`,
    );
    await fs.outputFile(
      path.join(directory, "nuxt.config.ts"),
      "export default defineNuxtConfig({ devtools: { enabled: true } })\n",
    );
    await fs.writeJson(
      path.join(directory, "package.json"),
      {
        name: slug(projectName),
        private: true,
        type: "module",
        scripts: { dev: "nuxt dev", build: "nuxt build", start: "nuxt start" },
        dependencies: { nuxt: "^3.14.159", vue: "^3.5.13" },
      },
      { spaces: 2 },
    );
  } else if (outputType === "express") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "public", "assets"),
    );
    const expressPages = [];
    for (const [index, page] of processed.entries()) {
      const filename = index === 0 ? "index.html" : `${slug(page.path, `page-${index + 1}`)}.html`;
      await fs.outputFile(path.join(directory, "views", filename), page.html);
      expressPages.push({ route: page.path || "/", filename });
    }
    await fs.copy(
      path.join(directory, "views", "index.html"),
      path.join(directory, "public", "index.html"),
    );
    const expressRoutes = expressPages
      .map(
        (page) =>
          `router.get(${JSON.stringify(page.route)}, (_request, response) => response.sendFile(path.join(viewsDirectory, ${JSON.stringify(page.filename)})));`,
      )
      .join("\n");
    await fs.outputFile(
      path.join(directory, "routes", "index.js"),
      `import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = Router();
const directory = path.dirname(fileURLToPath(import.meta.url));
const viewsDirectory = path.join(directory, "..", "views");

${expressRoutes}

export default router;
`,
    );
    await fs.outputFile(
      path.join(directory, "server.js"),
      `import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routes from "./routes/index.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(directory, "public")));
app.use(routes);
app.listen(port, () => console.log(\`Express reconstruction running on port \${port}\`));
`,
    );
    await fs.writeJson(
      path.join(directory, "package.json"),
      {
        name: slug(projectName),
        private: true,
        type: "module",
        scripts: { dev: "node server.js", start: "node server.js" },
        dependencies: { express: "^4.21.2" },
      },
      { spaces: 2 },
    );
  } else if (outputType === "node") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "public", "assets"),
    );
    await fs.outputFile(
      path.join(directory, "public", "index.html"),
      primary.html,
    );
    await fs.outputFile(
      path.join(directory, "server.js"),
      `const http = require('http');\nconst fs = require('fs');\nconst path = require('path');\nconst port = process.env.PORT || 3000;\nconst root = path.join(__dirname, 'public');\nconst server = http.createServer((req, res) => {\n  const filePath = path.join(root, req.url === '/' ? 'index.html' : req.url.replace(/^\\//, ''));\n  fs.readFile(filePath, (err, data) => {\n    if (err) {\n      res.writeHead(200, { 'Content-Type': 'text/html' });\n      res.end('<!doctype html><main><h1>Node scaffold</h1><p>Replace with your generated source.</p></main>');\n      return;\n    }\n    res.end(data);\n  });\n});\nserver.listen(port, () => console.log('Node scaffold running on port ' + port));\n`,
    );
    await fs.writeJson(
      path.join(directory, "package.json"),
      {
        name: slug(projectName),
        private: true,
        scripts: { dev: "node server.js", start: "node server.js" },
      },
      { spaces: 2 },
    );
  } else if (outputType === "react") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "public", "assets"),
    );
    const imports = components
      .map(
        (component) =>
          `import ${componentIdentifier(component.name)} from "../components/${path.basename(component.file).replace(/\.[^.]+$/, "")}";`,
      )
      .join("\n");
    const reactPages = [];
    for (const [index, page] of processed.entries()) {
      const pageName =
        index === 0
          ? "Home"
          : componentIdentifier(page.title || slug(page.path, `Page${index + 1}`));
      const filename = `${pageName}.jsx`;
      const bodyMarkup =
        cheerio.load(page.html, { decodeEntities: false })("body").html() || "";
      const convertedPage = convertHtmlToJsx(bodyMarkup);
      const content =
        index === 0
          ? `${imports}

export default function Home() {
  return (
    <main>
${components.map((component) => `      <${componentIdentifier(component.name)} />`).join("\n")}
    </main>
  );
}
`
          : convertedPage.safe
            ? `export default function ${pageName}() {
  return (
    <main>
      ${convertedPage.code}
    </main>
  );
}
`
            : `// Conversion fallback: ${convertedPage.warnings.join("; ")}
const markup = ${JSON.stringify(convertedPage.fallbackMarkup).replace(/</g, "\\u003c")};

export default function ${pageName}() {
  return <main dangerouslySetInnerHTML={{ __html: markup }} />;
}
`;
      await fs.outputFile(
        path.join(directory, "src", "pages", filename),
        content,
      );
      reactPages.push({ path: page.path || "/", name: pageName, filename });
    }
    const reactPageImports = reactPages
      .map((page) => `import ${page.name} from "./pages/${page.name}";`)
      .join("\n");
    const reactRouteMap = reactPages
      .map((page) => `  ${JSON.stringify(page.path)}: ${page.name},`)
      .join("\n");
    await fs.outputFile(
      path.join(directory, "src", "App.jsx"),
      `${reactPageImports}

const pages = {
${reactRouteMap}
};

export default function App() {
  const Page = pages[window.location.pathname] || Home;
  return <Page />;
}
`,
    );
    await fs.outputFile(
      path.join(directory, "src", "main.jsx"),
      'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\nimport "./styles.css";\n\ncreateRoot(document.getElementById("root")).render(<App />);\n',
    );
    await fs.outputFile(
      path.join(directory, "src", "styles.css"),
      "* { box-sizing: border-box; }\nbody { margin: 0; }\nimg, video { max-width: 100%; height: auto; }\n",
    );
    await fs.writeFile(
      path.join(directory, "index.html"),
      '<!doctype html><div id="root"></div><script type="module" src="/src/main.jsx"></script>',
    );
    await fs.writeJson(
      path.join(directory, "package.json"),
      {
        name: slug(projectName),
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "vite build" },
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
        devDependencies: { "@vitejs/plugin-react": "^4.3.4", vite: "^6.0.5" },
      },
      { spaces: 2 },
    );
    await fs.writeFile(
      path.join(directory, "vite.config.js"),
      'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({ plugins: [react()] });\n',
    );
  } else if (outputType === "vue") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "public", "assets"),
    );
    const imports = components
      .map(
        (component) =>
          `import ${componentIdentifier(component.name)} from "../components/${path.basename(component.file)}";`,
      )
      .join("\n");
    const vuePages = [];
    for (const [index, page] of processed.entries()) {
      const pageName =
        index === 0
          ? "Home"
          : componentIdentifier(page.title || slug(page.path, `Page${index + 1}`));
      const vueBodyMarkup =
        cheerio.load(page.html, { decodeEntities: false })("body").html() || "";
      const convertedVuePage = convertHtmlToVueTemplate(vueBodyMarkup);
      const content =
        index === 0
          ? `<script setup>
${imports}
</script>

<template>
  <main>
${components.map((component) => `    <${componentIdentifier(component.name)} />`).join("\n")}
  </main>
</template>
`
          : convertedVuePage.safe
            ? `<template>
  <main>
    ${convertedVuePage.code}
  </main>
</template>
`
            : `<script setup>
const markup = ${JSON.stringify(convertedVuePage.fallbackMarkup).replace(/</g, "\\u003c")};
</script>

<template>
  <main v-html="markup" />
</template>
`;
      await fs.outputFile(
        path.join(directory, "src", "views", `${pageName}.vue`),
        content,
      );
      vuePages.push({ path: page.path || "/", name: pageName });
    }
    const vuePageImports = vuePages
      .map((page) => `import ${page.name} from "./views/${page.name}.vue";`)
      .join("\n");
    const vueRouteMap = vuePages
      .map((page) => `  ${JSON.stringify(page.path)}: ${page.name},`)
      .join("\n");
    await fs.outputFile(
      path.join(directory, "src", "App.vue"),
      `<script setup>
${vuePageImports}

const pages = {
${vueRouteMap}
};
const Page = pages[window.location.pathname] || Home;
</script>

<template>
  <component :is="Page" />
</template>
`,
    );
    await fs.outputFile(
      path.join(directory, "src", "main.js"),
      'import { createApp } from "vue";\nimport App from "./App.vue";\nimport "./styles.css";\n\ncreateApp(App).mount("#app");\n',
    );
    await fs.outputFile(
      path.join(directory, "src", "styles.css"),
      "* { box-sizing: border-box; }\nbody { margin: 0; }\nimg, video { max-width: 100%; height: auto; }\n",
    );
    await fs.writeFile(
      path.join(directory, "index.html"),
      '<!doctype html><div id="app"></div><script type="module" src="/src/main.js"></script>',
    );
    await fs.writeJson(
      path.join(directory, "package.json"),
      {
        name: slug(projectName),
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "vite build" },
        dependencies: { vue: "^3.5.13" },
        devDependencies: { "@vitejs/plugin-vue": "^5.2.1", vite: "^6.0.5" },
      },
      { spaces: 2 },
    );
    await fs.writeFile(
      path.join(directory, "vite.config.js"),
      'import { defineConfig } from "vite";\nimport vue from "@vitejs/plugin-vue";\n\nexport default defineConfig({ plugins: [vue()] });\n',
    );
  } else if (outputType === "aspnet") {
    await moveDirectory(
      path.join(directory, "assets"),
      path.join(directory, "wwwroot", "assets"),
    );
    const aspPages = [];
    for (const [index, page] of processed.entries()) {
      const name =
        index === 0
          ? "Index"
          : componentIdentifier(page.title || slug(page.path, `Page${index + 1}`));
      const markup =
        index === 0 && components.length
          ? components
              .map(
                (component) =>
                  `<partial name="Components/${path.basename(component.file).replace(/\.cshtml$/, "")}" />`,
              )
              .join("\n")
          : page.html;
      await fs.outputFile(
        path.join(directory, "Views", "Home", `${name}.cshtml`),
        markup,
      );
      aspPages.push(name);
    }
    const aspActions = aspPages
      .map(
        (name) =>
          `    public IActionResult ${name}() => View(${JSON.stringify(name)});`,
      )
      .join("\n");
    await fs.outputFile(
      path.join(directory, "Controllers", "HomeController.cs"),
      `using Microsoft.AspNetCore.Mvc;

public class HomeController : Controller
{
${aspActions}
}
`,
    );
    await fs.writeFile(
      path.join(directory, "Program.cs"),
      'var b=WebApplication.CreateBuilder(args);b.Services.AddControllersWithViews();var a=b.Build();a.UseStaticFiles();a.MapDefaultControllerRoute();a.Run();\n',
    );
    await fs.writeFile(
      path.join(directory, "RebuiltWebsite.csproj"),
      '<Project Sdk="Microsoft.NET.Sdk.Web"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>',
    );
  }
  await applyExtractedAssets(outputType, directory, processed);
  await rewriteGeneratedCss(directory, combinedClassRenames(processed));
  return {
    pages: processed,
    components,
    componentMap: built.componentMap,
    generatedFiles: built.generatedFiles,
  };
}

async function listProjectFiles(directory) {
  const files = [];
  async function visit(current, prefix = "") {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(path.join(current, entry.name), relative);
      else files.push(relative);
    }
  }
  await visit(directory);
  return files.sort();
}

async function generateProjectV1({
  pages,
  outputType,
  stagingDirectory,
  projectName,
  sourceUrl,
  technologies,
  detectedComponents = [],
  assets = {},
  reconstruction,
  mode = "mirror",
  options = {},
  exportFormat = "zip",
}) {
  const reconstructionModel =
    reconstruction ||
    reconstructWebsite({
      pages,
      assets,
      sourceUrl,
      outputType,
    });
  const reconstructedComponents = reconstructionModel.componentGraph.nodes.map(
    ({ name, type, confidence, count }) => ({ name, type, confidence, count }),
  );
  const context = {
    pages,
    outputType,
    directory: stagingDirectory,
    projectName,
    sourceUrl,
    technologies,
    detectedComponents: reconstructedComponents.length
      ? reconstructedComponents
      : detectedComponents,
    mode,
    options,
  };
  const generated =
    outputType === "static-html"
      ? await generateStatic(context)
      : outputType === "php"
        ? await generatePhp(context)
        : await generateScaffold(context);
  const generatedComponentFiles = new Map(
    (generated.componentMap || []).map((component) => [
      component.name,
      component.file,
    ]),
  );
  reconstructionModel.frameworkMap.components =
    reconstructionModel.frameworkMap.components.map((component) => ({
      ...component,
      target: generatedComponentFiles.get(component.name) || component.target,
    }));
  await Promise.all([
    fs.writeFile(
      path.join(stagingDirectory, "RECONSTRUCTION.md"),
      reconstructionMarkdown(reconstructionModel),
    ),
    fs.writeJson(
      path.join(stagingDirectory, "reconstruction.json"),
      reconstructionModel,
      { spaces: 2 },
    ),
    fs.writeJson(
      path.join(stagingDirectory, "component-graph.json"),
      reconstructionModel.componentGraph,
      { spaces: 2 },
    ),
    fs.writeJson(
      path.join(stagingDirectory, "semantic-map.json"),
      reconstructionModel.semanticMap,
      { spaces: 2 },
    ),
    fs.writeJson(
      path.join(stagingDirectory, "framework-map.json"),
      reconstructionModel.frameworkMap,
      { spaces: 2 },
    ),
  ]);
  const support = supportFileContents(generated.pages, sourceUrl);
  const publicRoots = {
    laravel: "public",
    nextjs: "public",
    nuxt: "public",
    react: "public",
    vue: "public",
    aspnet: "wwwroot",
    express: "public",
    node: "public",
  };
  const supportDirectory = path.join(
    stagingDirectory,
    publicRoots[outputType] || "",
  );
  await fs.ensureDir(supportDirectory);
  await writeSupportFiles(
    supportDirectory,
    support,
    !["nextjs", "react", "vue", "aspnet"].includes(outputType),
  );
  await fs.writeFile(
    path.join(stagingDirectory, "COMPONENTS.md"),
    componentsMarkdown({
      components: generated.components,
      outputType,
      mode,
    }),
  );
  if (mode === "framework-migration") {
    await fs.writeFile(
      path.join(stagingDirectory, "MIGRATION_NOTES.md"),
      migrationNotes({
        projectName,
        outputType,
        technologies,
        components: generated.components,
      }),
    );
  }
  if (mode !== "mirror") {
    await fs.writeFile(
      path.join(stagingDirectory, "CLEANUP_REPORT.md"),
      cleanupReport({ pages: generated.pages, mode }),
    );
  }
  await fs.writeFile(
    path.join(stagingDirectory, "README.md"),
    frameworkReadme({
      projectName,
      sourceUrl,
      outputType,
      mode,
      pages: generated.pages,
      components: generated.components,
      technologies,
      componentMap: generated.componentMap || [],
    }),
  );
  await writeExportPreset(stagingDirectory, exportFormat, projectName, outputType);

  return {
    pagesGenerated: generated.pages.length,
    components: generated.components,
    componentMap: generated.componentMap || [],
    generatedFiles: generated.generatedFiles || [],
    reconstruction: reconstructionModel,
    outputStructure: await listProjectFiles(stagingDirectory),
  };
}

module.exports = {
  generateProjectV1,
  listProjectFiles,
  pageFilename,
  rewriteInternalLinks,
};
