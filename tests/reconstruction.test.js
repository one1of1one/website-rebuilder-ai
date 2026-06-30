const assert = require("assert");
const {
  FRAMEWORK_STRUCTURES,
  buildComponentGraph,
  buildDomGraph,
  buildFrameworkMap,
  buildRoutePageMap,
  buildSemanticSectionMap,
  reconstructWebsite,
} = require("../backend/reconstruction");
const { detectComponents } = require("../backend/component-detector");

function main() {
  const sourceUrl = "https://example.com/";
  const home = `<!doctype html>
<html>
  <body>
    <header><nav><a href="/pricing">Pricing</a></nav></header>
    <main>
      <section class="hero"><h1>Home</h1></section>
      <section class="feature-grid"><article class="feature-card">Feature</article></section>
      <section class="dashboard"><div class="metric-card">42</div><table><tr><td>A</td></tr></table></section>
      <div class="modal" role="dialog">Modal</div>
    </main>
    <footer>Footer</footer>
  </body>
</html>`;
  const pricing = "<!doctype html><html><body><main><section class=\"pricing\">Pricing</section></main></body></html>";
  const pages = [
    { path: "/", url: sourceUrl, title: "Home", html: home },
    {
      path: "/pricing",
      url: `${sourceUrl}pricing`,
      title: "Pricing",
      html: pricing,
    },
  ];

  const components = detectComponents(home);
  const componentTypes = new Set(components.map((component) => component.type));
  for (const type of [
    "navbar",
    "hero",
    "feature-grid",
    "dashboard-cards",
    "tables",
    "modal",
    "footer",
  ]) {
    assert(componentTypes.has(type), `expected ${type} classification`);
  }

  const domGraph = buildDomGraph(home);
  assert(domGraph.nodeCount > 10, "DOM graph should contain parsed elements");
  assert(
    domGraph.nodes.some((node) => node.parentId && node.children.length),
    "DOM graph should retain parent/child relationships",
  );

  const semanticMap = buildSemanticSectionMap(home);
  assert(
    semanticMap.sections.some((section) => section.type === "main"),
    "semantic map should identify main content",
  );

  const componentGraph = buildComponentGraph(home, components);
  assert.strictEqual(componentGraph.nodes.length, components.length);
  assert.strictEqual(
    componentGraph.edges.length,
    Math.max(0, components.length - 1),
  );

  const routePageMap = buildRoutePageMap(pages, sourceUrl);
  assert.deepStrictEqual(routePageMap.routes, ["/", "/pricing"]);
  assert(
    routePageMap.links.some((link) => link.from === "/" && link.to === "/pricing"),
    "route map should connect internal page links",
  );

  const frameworkMap = buildFrameworkMap(
    "laravel",
    routePageMap,
    componentGraph,
  );
  assert.strictEqual(
    frameworkMap.structure.components,
    FRAMEWORK_STRUCTURES.laravel.components,
  );
  assert.strictEqual(frameworkMap.pages.length, 2);

  const reconstruction = reconstructWebsite({
    pages,
    assets: {
      images: ["https://example.com/hero.jpg"],
      counts: {},
    },
    sourceUrl,
    outputType: "react",
  });
  assert.strictEqual(reconstruction.outputType, "react");
  assert(reconstruction.domGraph.nodeCount > 0);
  assert(reconstruction.frameworkMap.components.length > 0);
  assert(Array.isArray(reconstruction.assetComponentRelationships.assets));

  console.log(
    JSON.stringify(
      {
        ok: true,
        domNodes: reconstruction.domGraph.nodeCount,
        semanticSections: reconstruction.semanticMap.count,
        components: reconstruction.componentGraph.nodes.length,
        routes: reconstruction.routePageMap.routes.length,
      },
      null,
      2,
    ),
  );
}

main();
