const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { analyzeHtml } = require("../backend/analyzer");
const { analyzeAssets } = require("../backend/asset-analyzer");
const { buildInspectorData } = require("../backend/inspector");

function countTreeNodes(node) {
  return (node.children || []).reduce(
    (count, child) => count + 1 + countTreeNodes(child),
    0,
  );
}

function main() {
  const sourceUrl = "https://example.com/";
  const html = fs.readFileSync(
    path.join(__dirname, "fixtures", "landing.html"),
    "utf8",
  );
  const analysis = analyzeHtml(html, sourceUrl);
  const componentMap = analysis.components.map((component) => ({
    ...component,
    file: `components/${component.type}.html`,
  }));
  const inspector = buildInspectorData({
    html,
    componentMap,
    assets: analyzeAssets(html, sourceUrl),
    dom: analysis.dom,
    sourceUrl,
  });

  assert.strictEqual(inspector.componentTree.type, "document");
  assert(
    countTreeNodes(inspector.componentTree) === componentMap.length,
    "component tree should include every generated component",
  );
  assert(inspector.domSummary.totalElements > 0, "DOM summary should count elements");
  assert(inspector.domSummary.landmarks.header > 0, "DOM summary should include landmarks");
  assert(
    Array.isArray(inspector.assetComponentMap.components),
    "component asset mappings should be an array",
  );
  assert(
    Array.isArray(inspector.assetComponentMap.assets),
    "reverse asset mappings should be an array",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        componentNodes: countTreeNodes(inspector.componentTree),
        totalElements: inspector.domSummary.totalElements,
        mappedAssets: inspector.assetComponentMap.assets.filter(
          (asset) => asset.components.length,
        ).length,
      },
      null,
      2,
    ),
  );
}

main();
