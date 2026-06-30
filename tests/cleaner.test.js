const assert = require("assert");
const {
  cleanHtml,
  improveSemanticHtml,
  rewriteCssClassNames,
} = require("../backend/cleaner");

function main() {
  const source = `<!doctype html>
<html>
  <head>
    <style>.css-a1b2c3d4 { color: red; }</style>
    <script type="application/ld+json">{"@type":"WebSite"}</script>
  </head>
  <body>
    <div class="site-header"><div class="css-a1b2c3d4" style="display: flex">Header</div></div>
    <div class="main-content"><p>Content</p></div>
    <script>window.rebuilt = true;</script>
  </body>
</html>`;

  const cleaned = cleanHtml(source);
  assert(!cleaned.html.includes("<style"), "style blocks should be extracted");
  assert(!cleaned.html.includes("window.rebuilt"), "executable inline scripts should be extracted");
  assert(cleaned.html.includes("application/ld+json"), "structured-data scripts must remain in HTML");
  assert(!cleaned.html.includes('style="'), "style attributes should be extracted");
  assert(cleaned.html.includes("clean-class-1"), "generated class names should be normalized");
  assert(cleaned.html.includes("inline-style-1"), "extracted inline styles should receive a class");
  assert(cleaned.css.includes(".clean-class-1"), "renamed CSS selectors should match the HTML");
  assert(cleaned.css.includes(".inline-style-1"), "inline style rules should be emitted");
  assert(cleaned.js.includes("window.rebuilt"), "inline JavaScript should be emitted");
  assert.strictEqual(cleaned.cleanup.inlineStyleBlocksExtracted, 1);
  assert.strictEqual(cleaned.cleanup.inlineScriptsExtracted, 1);

  const semantic = improveSemanticHtml(cleaned.html);
  assert(semantic.includes("<header"), "header-like containers should become semantic headers");
  assert(semantic.includes("<main"), "main-like containers should become semantic main elements");

  assert.strictEqual(
    rewriteCssClassNames(".old-name:hover { color: red; }", { "old-name": "new-name" }),
    ".new-name:hover { color: red; }",
  );

  console.log(JSON.stringify({ ok: true, cleanup: cleaned.cleanup }, null, 2));
}

main();
