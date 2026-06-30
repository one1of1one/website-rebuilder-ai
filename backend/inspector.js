const cheerio = require("cheerio");

const COMPONENT_SELECTORS = {
  header: "header, [role='banner'], [class*='header'], [id*='header']",
  navbar: "nav, [role='navigation'], [class*='navbar'], [class*='navigation']",
  hero: "[class*='hero'], [id*='hero'], [class*='banner'], [class*='jumbotron']",
  cards: "[class~='card'], [class*='card-'], [class*='cards'], article",
  gallery: "[class*='gallery'], [id*='gallery']",
  faq: "[class*='faq'], [id*='faq'], details",
  "contact-form": "form",
  "product-grid": "[class*='product-grid'], [class*='products-grid'], [class*='product-card']",
  pricing: "[class*='pricing'], [class*='price-card'], [class*='plan-card']",
  testimonials: "[class*='testimonial'], [class*='review-card'], blockquote",
  sidebar: "aside, [role='complementary'], [class*='sidebar'], [id*='sidebar']",
  breadcrumb: "[class*='breadcrumb'], [itemtype*='BreadcrumbList']",
  modal: "[class*='modal'], [role='dialog'], [aria-modal='true']",
  accordion: "details, [class*='accordion']",
  tabs: "[role='tablist'], [class*='tabs']",
  footer: "footer, [role='contentinfo'], [class*='footer'], [id*='footer']",
};

const ASSET_GROUPS = [
  "images",
  "css",
  "js",
  "fonts",
  "videos",
  "icons",
  "svg",
  "audio",
  "documents",
  "data",
  "manifests",
  "externalCdnAssets",
];

function safeSlug(value, fallback = "node") {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || fallback
  );
}

function elementPath($, element) {
  const parts = [];
  let current = element;
  while (current && current.type !== "root") {
    const tag = current.tagName || current.name;
    if (!tag || tag === "html") break;
    const id = $(current).attr("id");
    const classes = ($(current).attr("class") || "").split(/\s+/).filter(Boolean);
    let part = tag;
    if (id) part += `#${id}`;
    else if (classes.length) part += `.${classes.slice(0, 2).join(".")}`;
    parts.unshift(part);
    current = current.parent;
  }
  return parts.join(" > ");
}

function findComponentElement($, component) {
  const selector = COMPONENT_SELECTORS[component.type];
  if (!selector) return null;
  try {
    return $(selector).first().get(0) || null;
  } catch {
    return null;
  }
}

function buildComponentTree(html, componentMap = []) {
  const $ = cheerio.load(html || "", { decodeEntities: false });
  const nodes = componentMap.map((component, index) => {
    const element = findComponentElement($, component);
    return {
      id: `${safeSlug(component.name, "component")}-${index + 1}`,
      name: component.name,
      type: component.type,
      confidence: component.confidence || 0,
      file: component.file || null,
      selector: element ? elementPath($, element) : null,
      tag: element?.tagName || element?.name || null,
      textPreview: element
        ? $(element).text().replace(/\s+/g, " ").trim().slice(0, 160)
        : "",
      children: [],
      _element: element,
    };
  });

  const roots = [];
  nodes.forEach((node) => {
    let parent = null;
    let parentDepth = -1;
    if (node._element) {
      nodes.forEach((candidate) => {
        if (
          candidate === node ||
          !candidate._element ||
          !$(candidate._element).find(node._element).length
        ) {
          return;
        }
        const depth = elementPath($, candidate._element).split(" > ").length;
        if (depth > parentDepth) {
          parent = candidate;
          parentDepth = depth;
        }
      });
    }
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const stripInternal = (node) => {
    const { _element, ...publicNode } = node;
    publicNode.children = node.children.map(stripInternal);
    return publicNode;
  };

  return {
    id: "document",
    name: "Document",
    type: "document",
    file: null,
    selector: "body",
    children: roots.map(stripInternal),
  };
}

function buildDomSummary(html, analyzerDom = {}) {
  const $ = cheerio.load(html || "");
  const tagCounts = {};
  let maxDepth = 0;
  $("*").each((_, element) => {
    const tag = element.tagName || element.name || "unknown";
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    let depth = 0;
    let current = element.parent;
    while (current && current.type !== "root") {
      depth += 1;
      current = current.parent;
    }
    maxDepth = Math.max(maxDepth, depth);
  });

  return {
    totalElements: $("*").length,
    maxDepth,
    textLength: $("body").text().replace(/\s+/g, " ").trim().length,
    landmarks: {
      header: $("header").length,
      nav: $("nav").length,
      main: $("main").length,
      section: $("section").length,
      article: $("article").length,
      aside: $("aside").length,
      footer: $("footer").length,
    },
    content: {
      headings: $("h1, h2, h3, h4, h5, h6").length,
      links: $("a[href]").length,
      images: $("img").length,
      forms: $("form").length,
      interactive: $("button, input, select, textarea, details, [role='button']").length,
    },
    tagCounts: Object.fromEntries(
      Object.entries(tagCounts).sort((left, right) => right[1] - left[1]),
    ),
    analyzer: analyzerDom,
  };
}

function flattenAssets(assets = {}) {
  const records = new Map();
  ASSET_GROUPS.forEach((type) => {
    (assets[type] || []).forEach((url) => {
      if (!records.has(url)) records.set(url, { url, type, components: [] });
    });
  });
  return records;
}

function elementAssetUrls($, element, sourceUrl) {
  if (!element) return [];
  const urls = new Set();
  $(element)
    .find("[src], [href], [srcset]")
    .addBack("[src], [href], [srcset]")
    .each((_, assetElement) => {
      ["src", "href"].forEach((attribute) => {
        const value = $(assetElement).attr(attribute);
        if (!value || /^(data:|blob:|javascript:|#)/i.test(value)) return;
        try {
          urls.add(new URL(value, sourceUrl).href);
        } catch {
          urls.add(value);
        }
      });
      const srcset = $(assetElement).attr("srcset");
      if (srcset) {
        srcset.split(",").forEach((candidate) => {
          const value = candidate.trim().split(/\s+/)[0];
          if (!value) return;
          try {
            urls.add(new URL(value, sourceUrl).href);
          } catch {
            urls.add(value);
          }
        });
      }
    });
  return [...urls];
}

function buildAssetComponentMap(html, componentMap = [], assets = {}, sourceUrl) {
  const $ = cheerio.load(html || "", { decodeEntities: false });
  const assetRecords = flattenAssets(assets);
  const components = componentMap.map((component) => {
    const element = findComponentElement($, component);
    const references = elementAssetUrls($, element, sourceUrl);
    const matched = [];
    references.forEach((reference) => {
      let record = assetRecords.get(reference);
      if (!record) {
        record = [...assetRecords.values()].find(
          (candidate) =>
            candidate.url.endsWith(reference) || reference.endsWith(candidate.url),
        );
      }
      if (!record) return;
      if (!record.components.includes(component.name)) {
        record.components.push(component.name);
      }
      matched.push({ url: record.url, type: record.type });
    });
    return {
      name: component.name,
      type: component.type,
      file: component.file || null,
      assets: matched,
    };
  });
  const assetList = [...assetRecords.values()];

  return {
    components,
    assets: assetList,
    unmappedAssets: assetList
      .filter((asset) => !asset.components.length)
      .map(({ url, type }) => ({ url, type })),
  };
}

function buildInspectorData({
  html,
  componentMap = [],
  assets = {},
  dom = {},
  sourceUrl,
}) {
  const componentTree = buildComponentTree(html, componentMap);
  const domSummary = buildDomSummary(html, dom);
  const assetComponentMap = buildAssetComponentMap(
    html,
    componentMap,
    assets,
    sourceUrl,
  );
  return { componentTree, domSummary, assetComponentMap };
}

module.exports = {
  buildAssetComponentMap,
  buildComponentTree,
  buildDomSummary,
  buildInspectorData,
};
