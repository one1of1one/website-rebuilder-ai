const cheerio = require("cheerio");

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const BOOLEAN_ATTRIBUTES = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "loop",
  "multiple",
  "muted",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
]);

const JSX_ATTRIBUTE_NAMES = {
  class: "className",
  for: "htmlFor",
  charset: "charSet",
  "http-equiv": "httpEquiv",
  "accept-charset": "acceptCharset",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  colspan: "colSpan",
  crossorigin: "crossOrigin",
  datetime: "dateTime",
  enctype: "encType",
  formaction: "formAction",
  formmethod: "formMethod",
  formnovalidate: "formNoValidate",
  frameborder: "frameBorder",
  maxlength: "maxLength",
  minlength: "minLength",
  novalidate: "noValidate",
  playsinline: "playsInline",
  readonly: "readOnly",
  rowspan: "rowSpan",
  srcset: "srcSet",
  tabindex: "tabIndex",
  usemap: "useMap",
  "xlink:href": "xlinkHref",
};

function parseFragment(html) {
  return cheerio.load(String(html || ""), {}, false);
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeJsxText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;");
}

function splitCssDeclarations(style) {
  const declarations = [];
  let current = "";
  let quote = null;
  let parentheses = 0;
  for (const character of String(style || "")) {
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      current += character;
    } else if (character === "(") {
      parentheses += 1;
      current += character;
    } else if (character === ")") {
      parentheses = Math.max(0, parentheses - 1);
      current += character;
    } else if (character === ";" && parentheses === 0) {
      if (current.trim()) declarations.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) declarations.push(current.trim());
  return declarations;
}

function cssPropertyToJs(property) {
  const normalized = property.trim();
  if (normalized.startsWith("--")) return normalized;
  return normalized
    .replace(/^-ms-/, "ms-")
    .replace(/^-webkit-/, "Webkit-")
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertStyleToJsx(style) {
  const entries = [];
  for (const declaration of splitCssDeclarations(style)) {
    const separator = declaration.indexOf(":");
    if (separator <= 0) {
      return { safe: false, code: null, warning: "Unparseable inline style declaration" };
    }
    const property = declaration.slice(0, separator).trim();
    const value = declaration.slice(separator + 1).trim();
    if (!property || !value || /expression\s*\(|[{}]/i.test(value)) {
      return { safe: false, code: null, warning: "Unsafe inline style value" };
    }
    const jsProperty = cssPropertyToJs(property);
    const key = /^[a-zA-Z_$][\w$]*$/.test(jsProperty)
      ? jsProperty
      : JSON.stringify(jsProperty);
    entries.push(`${key}: ${JSON.stringify(value)}`);
  }
  return { safe: true, code: `{{ ${entries.join(", ")} }}`, warning: null };
}

function inspectComplexMarkup($, target) {
  const warnings = [];
  if ($("script, style").length) {
    warnings.push(`${target} conversion requires fallback for script/style elements`);
  }
  if ($("template").length) {
    warnings.push(`${target} conversion requires fallback for template elements`);
  }
  if (target === "jsx") {
    $("*").each((_, element) => {
      if (
        Object.keys(element.attribs || {}).some((name) =>
          /^on[a-z]+$/i.test(name),
        )
      ) {
        warnings.push("Inline event handlers require fallback to preserve behavior");
      }
    });
  }
  const source = $.root().html() || "";
  if (/({[{%]|%}|}}|<\?)/.test(source)) {
    warnings.push(`${target} template syntax requires fallback`);
  }
  return [...new Set(warnings)];
}

function serializeJsxAttributes(attributes = {}) {
  const output = [];
  const warnings = [];
  for (const [rawName, value] of Object.entries(attributes)) {
    const lowerName = rawName.toLowerCase();
    const name = JSX_ATTRIBUTE_NAMES[lowerName] || rawName;
    if (lowerName === "style") {
      const style = convertStyleToJsx(value);
      if (!style.safe) warnings.push(style.warning);
      else output.push(`style=${style.code}`);
    } else if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
      output.push(`${name}={true}`);
    } else {
      output.push(`${name}="${escapeAttribute(value)}"`);
    }
  }
  return { code: output.length ? ` ${output.join(" ")}` : "", warnings };
}

function serializeJsxNode(node, warnings) {
  if (node.type === "text") return escapeJsxText(node.data || "");
  if (node.type === "comment") {
    return `{/* ${String(node.data || "").replace(/\*\//g, "* /").trim()} */}`;
  }
  if (!["tag", "script", "style"].includes(node.type)) return "";
  const tag = node.tagName || node.name;
  const attributes = serializeJsxAttributes(node.attribs);
  warnings.push(...attributes.warnings);
  if (VOID_ELEMENTS.has(tag)) return `<${tag}${attributes.code} />`;
  const children = (node.children || [])
    .map((child) => serializeJsxNode(child, warnings))
    .join("");
  return `<${tag}${attributes.code}>${children}</${tag}>`;
}

function serializeHtmlNode(node) {
  if (node.type === "text") return node.data || "";
  if (node.type === "comment") return `<!--${node.data || ""}-->`;
  if (!["tag", "script", "style"].includes(node.type)) return "";
  const tag = node.tagName || node.name;
  const attributes = Object.entries(node.attribs || {})
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
  if (VOID_ELEMENTS.has(tag)) return `<${tag}${attributes} />`;
  const children = (node.children || []).map(serializeHtmlNode).join("");
  return `<${tag}${attributes}>${children}</${tag}>`;
}

function result(code, warnings, fallbackMarkup) {
  return {
    code,
    safe: warnings.length === 0,
    warnings,
    fallbackMarkup,
  };
}

function convertHtmlToJsx(html) {
  const $ = parseFragment(html);
  const warnings = inspectComplexMarkup($, "jsx");
  const code = $.root()
    .contents()
    .toArray()
    .map((node) => serializeJsxNode(node, warnings))
    .join("");
  return result(code, [...new Set(warnings.filter(Boolean))], String(html || ""));
}

function convertHtmlToVueTemplate(html) {
  const $ = parseFragment(html);
  const warnings = inspectComplexMarkup($, "vue");
  const code = $.root()
    .contents()
    .toArray()
    .map(serializeHtmlNode)
    .join("");
  return result(code, warnings, String(html || ""));
}

function convertHtmlToBlade(html) {
  const $ = parseFragment(html);
  const warnings = inspectComplexMarkup($, "blade");
  const serialized = $.root()
    .contents()
    .toArray()
    .map(serializeHtmlNode)
    .join("");
  const code = warnings.length
    ? `@verbatim\n${serialized}\n@endverbatim`
    : serialized;
  return result(code, warnings, String(html || ""));
}

module.exports = {
  convertHtmlToBlade,
  convertHtmlToJsx,
  convertHtmlToVueTemplate,
  convertStyleToJsx,
};
