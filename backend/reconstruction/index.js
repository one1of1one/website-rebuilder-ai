const cheerio = require("cheerio");
const { detectComponents } = require("../component-detector");
const { buildAssetComponentMap } = require("../inspector");

const SEMANTIC_SELECTORS = [
  ["header", "header, [role='banner']"],
  ["navigation", "nav, [role='navigation']"],
  ["main", "main, [role='main']"],
  ["section", "section"],
  ["article", "article"],
  ["sidebar", "aside, [role='complementary']"],
  ["form", "form"],
  ["footer", "footer, [role='contentinfo']"],
];

const FRAMEWORK_STRUCTURES = {
  php: {
    entry: "index.php",
    layouts: ["includes/header.php", "includes/footer.php"],
    components: "components/*.php",
    pages: "pages/*.php",
    assets: "assets/",
  },
  laravel: {
    entry: "routes/web.php",
    layouts: ["resources/views/layouts/app.blade.php"],
    components: "resources/views/components/*.blade.php",
    pages: "resources/views/pages/*.blade.php",
    assets: "public/assets/",
  },
  react: {
    entry: "src/main.jsx",
    layouts: ["src/App.jsx"],
    components: "src/components/*.jsx",
    pages: "src/pages/*.jsx",
    assets: "public/assets/",
  },
  nextjs: {
    entry: "app/page.jsx",
    layouts: ["app/layout.jsx"],
    components: "components/*.jsx",
    pages: "app/",
    assets: "public/assets/",
  },
  vue: {
    entry: "src/main.js",
    layouts: ["src/App.vue"],
    components: "src/components/*.vue",
    pages: "src/views/*.vue",
    assets: "public/assets/",
  },
  wordpress: {
    entry: "index.php",
    layouts: ["header.php", "footer.php"],
    components: "template-parts/*.php",
    pages: "front-page.php, page.php, single.php",
    assets: "assets/",
  },
  express: {
    entry: "server.js",
    layouts: [],
    components: "views/",
    pages: "views/",
    assets: "public/",
  },
  aspnet: {
    entry: "Program.cs",
    layouts: ["Views/Shared/"],
    components: "Views/Shared/Components/",
    pages: "Views/",
    assets: "wwwroot/",
  },
};

function slug(value, fallback = "node") {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || fallback
  );
}

function elementLabel($, element) {
  const tag = element.tagName || element.name || "node";
  const id = $(element).attr("id");
  const classes = ($(element).attr("class") || "").split(/\s+/).filter(Boolean);
  if (id) return `${tag}#${id}`;
  if (classes.length) return `${tag}.${classes.slice(0, 2).join(".")}`;
  return tag;
}

function buildDomGraph(html) {
  const $ = cheerio.load(html || "", { decodeEntities: false });
  const nodeIds = new Map();
  const nodes = [];
  $("html, html *").each((index, element) => {
    const id = `dom-${index + 1}`;
    nodeIds.set(element, id);
    const attributes = Object.fromEntries(
      Object.entries(element.attribs || {})
        .filter(([name]) => ["id", "class", "role", "aria-label", "href", "src"].includes(name))
        .slice(0, 8),
    );
    nodes.push({
      id,
      parentId: null,
      tag: element.tagName || element.name || "unknown",
      label: elementLabel($, element),
      attributes,
      textPreview: $(element).clone().children().remove().end().text().replace(/\s+/g, " ").trim().slice(0, 120),
      children: [],
    });
  });
  nodes.forEach((node, index) => {
    const element = $("html, html *").get(index);
    const parentId = nodeIds.get(element?.parent) || null;
    node.parentId = parentId;
    if (parentId) nodes.find((candidate) => candidate.id === parentId)?.children.push(node.id);
  });
  return {
    rootId: nodes[0]?.id || null,
    nodeCount: nodes.length,
    nodes,
  };
}

function buildSemanticSectionMap(html) {
  const $ = cheerio.load(html || "", { decodeEntities: false });
  const sections = [];
  const seen = new Set();
  SEMANTIC_SELECTORS.forEach(([type, selector]) => {
    $(selector).each((index, element) => {
      if (seen.has(element)) return;
      seen.add(element);
      sections.push({
        id: `semantic-${sections.length + 1}`,
        type,
        name: `${type.charAt(0).toUpperCase()}${type.slice(1)}${index ? ` ${index + 1}` : ""}`,
        selector: elementLabel($, element),
        order: $("body *").index(element),
        textPreview: $(element).text().replace(/\s+/g, " ").trim().slice(0, 180),
      });
    });
  });
  sections.sort((left, right) => left.order - right.order);
  return { sections, count: sections.length };
}

function buildComponentGraph(html, components = detectComponents(html)) {
  const nodes = components.map((component, index) => ({
    id: `component-${slug(component.name)}-${index + 1}`,
    name: component.name,
    type: component.type,
    confidence: component.confidence,
    count: component.count || 1,
  }));
  const edges = nodes.slice(1).map((node, index) => ({
    from: nodes[index].id,
    to: node.id,
    relationship: "precedes",
  }));
  return { nodes, edges };
}

function normalizeRoute(value, sourceUrl) {
  try {
    return new URL(value, sourceUrl).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return "/";
  }
}

function buildRoutePageMap(pages = [], sourceUrl) {
  const normalizedPages = pages.map((page, index) => ({
    id: `page-${index + 1}`,
    path: normalizeRoute(page.path || page.url, sourceUrl),
    url: page.url || new URL(page.path || "/", sourceUrl).href,
    title: page.title || `Page ${index + 1}`,
    sourceIndex: index,
  }));
  const knownRoutes = new Set(normalizedPages.map((page) => page.path));
  const links = [];
  pages.forEach((page, pageIndex) => {
    const $ = cheerio.load(page.html || "");
    $("a[href]").each((_, element) => {
      const route = normalizeRoute($(element).attr("href"), page.url || sourceUrl);
      if (knownRoutes.has(route)) {
        links.push({
          from: normalizedPages[pageIndex].path,
          to: route,
        });
      }
    });
  });
  return { pages: normalizedPages, routes: [...knownRoutes], links };
}

function buildFrameworkMap(outputType, routePageMap, componentGraph) {
  const structure = FRAMEWORK_STRUCTURES[outputType] || {
    entry: "index.html",
    layouts: [],
    components: "components/",
    pages: "pages/",
    assets: "assets/",
  };
  return {
    outputType,
    structure,
    pages: routePageMap.pages.map((page) => ({
      sourcePath: page.path,
      target: structure.pages,
    })),
    components: componentGraph.nodes.map((component) => ({
      name: component.name,
      type: component.type,
      target: structure.components,
    })),
  };
}

function reconstructWebsite({
  pages = [],
  assets = {},
  sourceUrl,
  outputType = "static-html",
  components,
}) {
  const primaryHtml = pages[0]?.html || "";
  const detectedComponents = components || detectComponents(primaryHtml);
  const domGraph = buildDomGraph(primaryHtml);
  const semanticMap = buildSemanticSectionMap(primaryHtml);
  const componentGraph = buildComponentGraph(primaryHtml, detectedComponents);
  const routePageMap = buildRoutePageMap(pages, sourceUrl);
  const assetComponentRelationships = buildAssetComponentMap(
    primaryHtml,
    detectedComponents,
    assets,
    sourceUrl,
  );
  const frameworkMap = buildFrameworkMap(
    outputType,
    routePageMap,
    componentGraph,
  );
  return {
    version: 1,
    sourceUrl,
    outputType,
    domGraph,
    semanticMap,
    componentGraph,
    routePageMap,
    assetComponentRelationships,
    frameworkMap,
  };
}

module.exports = {
  FRAMEWORK_STRUCTURES,
  buildComponentGraph,
  buildDomGraph,
  buildFrameworkMap,
  buildRoutePageMap,
  buildSemanticSectionMap,
  reconstructWebsite,
};
