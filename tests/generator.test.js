const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { analyzeHtml } = require("../backend/analyzer");
const { generateProjectV1 } = require("../backend/project-generator");

function loadFixture(name) {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

async function runGeneration({
  html,
  outputType,
  mode,
  projectName,
  sourceUrl,
  expectedFiles = [],
  contentChecks = {},
  absentContentChecks = {},
}) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "rebuilder-gen-"));
  try {
    const analysis = analyzeHtml(html, sourceUrl);
    const result = await generateProjectV1({
      pages: [
        {
          path: "/",
          url: sourceUrl,
          title: "Home",
          html,
        },
      ],
      outputType,
      stagingDirectory: tempRoot,
      projectName,
      sourceUrl,
      technologies: analysis.technologies,
      detectedComponents: analysis.components,
      mode,
      options: {
        splitComponents: true,
        removeDuplicateCss: true,
        renameClasses: true,
        improveAccessibility: true,
        generateReadme: true,
        generateHtaccess: true,
        generateSitemap: true,
        generateRobots: true,
      },
      exportFormat: "zip",
    });

    for (const file of expectedFiles) {
      assert(
        await fs.pathExists(path.join(tempRoot, file)),
        `${outputType}/${mode}: expected ${file}`,
      );
    }
    for (const reportFile of [
      "RECONSTRUCTION.md",
      "reconstruction.json",
      "component-graph.json",
      "semantic-map.json",
      "framework-map.json",
    ]) {
      assert(
        await fs.pathExists(path.join(tempRoot, reportFile)),
        `${outputType}/${mode}: expected ${reportFile}`,
      );
    }
    for (const [file, expectedContent] of Object.entries(contentChecks)) {
      const content = await fs.readFile(path.join(tempRoot, file), "utf8");
      assert(
        content.includes(expectedContent),
        `${outputType}/${mode}: ${file} did not contain ${expectedContent}`,
      );
    }
    for (const [file, unexpectedContent] of Object.entries(absentContentChecks)) {
      const content = await fs.readFile(path.join(tempRoot, file), "utf8");
      assert(
        !content.includes(unexpectedContent),
        `${outputType}/${mode}: ${file} unexpectedly contained ${unexpectedContent}`,
      );
    }
    assert(result.outputStructure.length > 0, `${outputType}/${mode}: outputStructure empty`);
    assert(result.componentMap.length > 0, `${outputType}/${mode}: componentMap empty`);
    assert(result.generatedFiles.length > 0, `${outputType}/${mode}: generatedFiles empty`);
    assert(result.reconstruction.domGraph.nodeCount > 0, `${outputType}/${mode}: DOM graph empty`);
    assert(result.reconstruction.componentGraph.nodes.length > 0, `${outputType}/${mode}: component graph empty`);
    return { tempRoot, result };
  } finally {
    await fs.remove(tempRoot);
  }
}

async function main() {
  const html = loadFixture("landing.html");
  const staticRun = await runGeneration({
    html,
    outputType: "static-html",
    mode: "ai-rebuild",
    projectName: "Static Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "index.html",
      "style.css",
      "script.js",
      "COMPONENTS.md",
      "CLEANUP_REPORT.md",
      "README.md",
    ],
    contentChecks: {
      "index.html": "<!-- Navbar component -->",
      "CLEANUP_REPORT.md": "Inline scripts extracted:",
    },
  });

  const phpRun = await runGeneration({
    html,
    outputType: "php",
    mode: "ai-rebuild",
    projectName: "PHP Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "index.php",
      "includes/header.php",
      "includes/footer.php",
      "components/navbar.php",
      "pages/home.php",
      "COMPONENTS.md",
    ],
    contentChecks: {
      "index.php": "components/navbar.php",
      "README.md": "PHP structure",
    },
  });

  const laravelRun = await runGeneration({
    html,
    outputType: "laravel",
    mode: "framework-migration",
    projectName: "Laravel Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "composer.json",
      "resources/views/layouts/app.blade.php",
      "resources/views/home.blade.php",
      "resources/views/pages/home.blade.php",
      "resources/views/components/navbar.blade.php",
    ],
    contentChecks: {
      "resources/views/pages/home.blade.php": "<x-navbar />",
      "README.md": "Laravel structure",
    },
    absentContentChecks: {
      "resources/views/components/navbar.blade.php": "dangerouslySetInnerHTML",
    },
  });

  const migrationRun = await runGeneration({
    html,
    outputType: "nextjs",
    mode: "framework-migration",
    projectName: "Next Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "app/page.jsx",
      "app/layout.jsx",
      "README.md",
      "COMPONENTS.md",
      "MIGRATION_NOTES.md",
      "components/navbar.jsx",
    ],
    contentChecks: {
      "app/page.jsx": "<Navbar />",
      "README.md": "Next.js structure",
    },
    absentContentChecks: {
      "components/navbar.jsx": "dangerouslySetInnerHTML",
    },
  });

  const reactRun = await runGeneration({
    html,
    outputType: "react",
    mode: "framework-migration",
    projectName: "React Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "src/pages/Home.jsx",
      "src/components/navbar.jsx",
      "vite.config.js",
      "README.md",
    ],
    contentChecks: {
      "src/pages/Home.jsx": "<Navbar />",
      "README.md": "React structure",
    },
    absentContentChecks: {
      "src/components/navbar.jsx": "dangerouslySetInnerHTML",
    },
  });

  const vueRun = await runGeneration({
    html,
    outputType: "vue",
    mode: "framework-migration",
    projectName: "Vue Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "src/views/Home.vue",
      "src/components/navbar.vue",
      "vite.config.js",
      "README.md",
    ],
    contentChecks: {
      "src/views/Home.vue": "<Navbar />",
      "README.md": "Vue structure",
    },
    absentContentChecks: {
      "src/components/navbar.vue": "v-html",
    },
  });

  const wordpressRun = await runGeneration({
    html,
    outputType: "wordpress",
    mode: "framework-migration",
    projectName: "WordPress Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "index.php",
      "page.php",
      "functions.php",
      "template-parts/navbar.php",
      "front-page.php",
      "README.md",
    ],
    contentChecks: {
      "page.php": "template-parts/navbar",
      "README.md": "WordPress structure",
    },
  });

  const expressRun = await runGeneration({
    html,
    outputType: "express",
    mode: "ai-rebuild",
    projectName: "Express Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "views/index.html",
      "routes/index.js",
      "public/index.html",
      "server.js",
    ],
    contentChecks: {
      "server.js": 'import routes from "./routes/index.js"',
      "framework-map.json": '"outputType": "express"',
    },
  });

  const aspnetRun = await runGeneration({
    html,
    outputType: "aspnet",
    mode: "ai-rebuild",
    projectName: "ASP.NET Fixture",
    sourceUrl: "https://example.com/",
    expectedFiles: [
      "Controllers/HomeController.cs",
      "Views/Home/Index.cshtml",
      "Views/Shared/Components/navbar.cshtml",
      "Program.cs",
    ],
    contentChecks: {
      "Views/Home/Index.cshtml": '<partial name="Components/navbar"',
      "framework-map.json": '"outputType": "aspnet"',
    },
  });

  assert(
    staticRun.result.componentMap.some((component) => component.file.includes("navbar")),
    "static: navbar component not mapped",
  );
  assert(
    phpRun.result.componentMap.some((component) => component.file.includes("footer")),
    "php: footer component not mapped",
  );
  assert(
    migrationRun.result.outputStructure.some((file) => file === "MIGRATION_NOTES.md"),
    "migration: notes file missing",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        cases: {
          staticHtml: staticRun.result.outputStructure.slice(0, 8),
          php: phpRun.result.outputStructure.slice(0, 8),
          laravel: laravelRun.result.outputStructure.slice(0, 8),
          nextjs: migrationRun.result.outputStructure.slice(0, 8),
          react: reactRun.result.outputStructure.slice(0, 8),
          vue: vueRun.result.outputStructure.slice(0, 8),
          wordpress: wordpressRun.result.outputStructure.slice(0, 8),
          express: expressRun.result.outputStructure.slice(0, 8),
          aspnet: aspnetRun.result.outputStructure.slice(0, 8),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
