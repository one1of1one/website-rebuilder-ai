const path = require("path");
const cheerio = require("cheerio");
const fs = require("fs-extra");

function removeDuplicateCssBlocks(css) {
  const seen = new Set();
  const blocks = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = pattern.exec(css))) {
    const selector = match[1].trim();
    const declarations = [...new Set(
      match[2]
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean),
    )].join("; ");
    const key = `${selector}{${declarations}}`;
    if (!seen.has(key)) {
      seen.add(key);
      blocks.push(`${selector} { ${declarations}; }`);
    }
  }
  return blocks.join("\n\n");
}

function beautifyCss(css) {
  return String(css || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s*\{\s*/g, " {\n  ")
    .replace(/;\s*/g, ";\n  ")
    .replace(/\s*\}\s*/g, "\n}\n\n")
    .replace(/\n {2}\n}/g, "\n}")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function beautifyJavaScript(js) {
  return String(js || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function beautifyHtml(html) {
  const blockTags =
    "address|article|aside|blockquote|body|div|dl|fieldset|footer|form|h[1-6]|head|header|html|main|nav|ol|p|section|table|ul";
  return String(html || "")
    .replace(/\r\n/g, "\n")
    .replace(new RegExp(`</(${blockTags})>\\s*<`, "gi"), "</$1>\n<")
    .replace(new RegExp(`>\\s*<(${blockTags})(?=\\s|>)`, "gi"), ">\n<$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function rewriteCssClassNames(css, classRenames = {}) {
  let rewritten = String(css || "");
  for (const [original, replacement] of Object.entries(classRenames)) {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    rewritten = rewritten.replace(
      new RegExp(`\\.${escaped}(?![a-zA-Z0-9_-])`, "g"),
      `.${replacement}`,
    );
  }
  return rewritten;
}

function normalizeClassNames($, prefix = "clean-class") {
  const classMap = new Map();
  $("*[class]").each((_, element) => {
    const classes = ($(element).attr("class") || "").split(/\s+/).filter(Boolean);
    const normalized = classes.map((className) => {
      const generated =
        className.length > 24 ||
        /(^|[-_])[a-f0-9]{6,}($|[-_])/i.test(className) ||
        /^(css|sc|jsx)-[a-z0-9]+$/i.test(className);
      if (!generated) return className;
      if (!classMap.has(className)) {
        classMap.set(className, `${prefix}-${classMap.size + 1}`);
      }
      return classMap.get(className);
    });
    $(element).attr("class", [...new Set(normalized)].join(" "));
  });
  return classMap;
}

function cleanHtml(html, options = {}) {
  const $ = cheerio.load(html, { decodeEntities: false });
  const styleBlockCount = $("style").length;
  const styleBlocks = $("style")
    .map((_, element) => $(element).html() || "")
    .get()
    .join("\n");
  const executableScripts = $("script:not([src])").filter((_, element) => {
    const type = ($(element).attr("type") || "").toLowerCase();
    return !type || ["module", "text/javascript", "application/javascript"].includes(type);
  });
  const inlineJs = executableScripts
    .map((_, element) => $(element).html() || "")
    .get()
    .join("\n");
  const inlineScriptCount = executableScripts.length;
  const emptyElementCount = $("p:empty, span:empty, div:empty, section:empty").length;

  const inlineStyleRules = [];
  const inlineStyleClasses = new Map();
  $("[style]").each((_, element) => {
    const declaration = ($(element).attr("style") || "").trim().replace(/;?$/, ";");
    if (!declaration) {
      $(element).removeAttr("style");
      return;
    }
    if (!inlineStyleClasses.has(declaration)) {
      inlineStyleClasses.set(
        declaration,
        `${options.inlineStylePrefix || "inline-style"}-${inlineStyleClasses.size + 1}`,
      );
    }
    const className = inlineStyleClasses.get(declaration);
    const classes = ($(element).attr("class") || "").split(/\s+/).filter(Boolean);
    $(element).attr("class", [...new Set([...classes, className])].join(" "));
    $(element).removeAttr("style");
  });
  inlineStyleClasses.forEach((className, declaration) => {
    inlineStyleRules.push(`.${className} { ${declaration} }`);
  });

  $("style").remove();
  executableScripts.remove();
  $("script[src]").each((_, element) => {
    if (!$(element).attr("defer") && !$(element).attr("async")) {
      $(element).attr("defer", "");
    }
  });
  $("p:empty, span:empty, div:empty, section:empty").remove();

  const classMap =
    options.renameClasses === false
      ? new Map()
      : normalizeClassNames($, options.classNamePrefix);
  const extractedCss = rewriteCssClassNames(
    [styleBlocks, ...inlineStyleRules].filter(Boolean).join("\n"),
    Object.fromEntries(classMap),
  );
  if (options.improveAccessibility !== false) {
    $("img:not([alt])").attr("alt", "");
    $("img").attr("loading", "lazy").attr("decoding", "async");
    $("button:not([type])").attr("type", "button");
    if (!$("html").attr("lang")) $("html").attr("lang", "en");
  }

  return {
    html: beautifyHtml($.html()),
    css: beautifyCss(
      options.removeDuplicateCss === false
        ? extractedCss
        : removeDuplicateCssBlocks(extractedCss),
    ),
    js: beautifyJavaScript(inlineJs),
    classRenames: Object.fromEntries(classMap),
    cleanup: {
      classNamesRenamed: classMap.size,
      inlineStyleBlocksExtracted: styleBlockCount,
      inlineStyleAttributesExtracted: inlineStyleClasses.size,
      inlineScriptsExtracted: inlineScriptCount,
      emptyElementsRemoved: emptyElementCount,
    },
  };
}

function improveSemanticHtml(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  const semanticRules = [
    ['div[class*="header"], div[id*="header"]', "header"],
    ['div[class*="navbar"], div[class*="navigation"]', "nav"],
    ['div[class*="footer"], div[id*="footer"]', "footer"],
    ['div[class*="main-content"], div[id="main"]', "main"],
    ['div[class*="article"], div[class*="post-content"]', "article"],
  ];
  semanticRules.forEach(([selector, tagName]) => {
    $(selector).each((_, element) => {
      element.name = tagName;
      element.tagName = tagName;
    });
  });

  if (!$("main").length) {
    const content = $("body")
      .children()
      .not("header, nav, footer, script, link")
      .toArray();
    if (content.length) {
      const main = $("<main></main>");
      content.forEach((element) => main.append(element));
      const footer = $("body > footer").first();
      if (footer.length) footer.before(main);
      else $("body").append(main);
    }
  }
  $("nav:not([aria-label])").attr("aria-label", "Primary navigation");
  return beautifyHtml($.html());
}

function upgradeHtml(html, { title, sourceUrl } = {}) {
  const $ = cheerio.load(improveSemanticHtml(html), { decodeEntities: false });

  if (!$('meta[name="viewport"]').length) {
    $("head").prepend(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    );
  }
  if (!$("title").text().trim()) {
    $("head").append("<title></title>");
    $("title").last().text(title || "Rebuilt Website");
  }
  if (!$('meta[name="description"]').length) {
    $("head").append('<meta name="description">');
    $('meta[name="description"]')
      .last()
      .attr("content", `${title || "Rebuilt Website"} modernized website`);
  }
  if (sourceUrl && !$('link[rel="canonical"]').length) {
    $("head").append('<link rel="canonical">');
    $('link[rel="canonical"]').last().attr("href", sourceUrl);
  }
  $("img:not([alt])").attr("alt", "");
  $("img").attr("loading", "lazy").attr("decoding", "async");
  $("button:not([type])").attr("type", "button");
  $("a[target='_blank']:not([rel])").attr("rel", "noopener noreferrer");

  return {
    html: beautifyHtml($.html()),
    css: `/* AI Upgrade layout foundations */
html { scroll-behavior: smooth; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; }
nav, .nav, .navbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.grid, [class*="grid"], [class*="cards"], [class*="products"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
img, svg, video { max-width: 100%; height: auto; }
`,
  };
}

async function generateSupportFiles({
  directory,
  publicDirectory = directory,
  sourceUrl,
  readme,
  options = {},
}) {
  if (options.generateReadme !== false && readme) {
    await fs.writeFile(path.join(directory, "README.md"), readme);
  }
  if (options.generateHtaccess === true) {
    await fs.outputFile(
      path.join(publicDirectory, ".htaccess"),
      "Options -Indexes\nRewriteEngine On\nDirectoryIndex index.html index.php\n",
    );
  }
  if (options.generateRobots === true) {
    await fs.outputFile(
      path.join(publicDirectory, "robots.txt"),
      "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n",
    );
  }
  if (options.generateSitemap === true) {
    await fs.outputFile(
      path.join(publicDirectory, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${sourceUrl}</loc></url></urlset>\n`,
    );
  }
}

// Future OpenAI integration point:
// cleaned HTML, extracted styles, scripts, and class mappings can be supplied
// to a model here for semantic refactoring after rule-based validation.

module.exports = {
  beautifyCss,
  beautifyHtml,
  beautifyJavaScript,
  cleanHtml,
  generateSupportFiles,
  improveSemanticHtml,
  normalizeClassNames,
  removeDuplicateCssBlocks,
  rewriteCssClassNames,
  upgradeHtml,
};
