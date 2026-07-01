const cheerio = require("cheerio");

const PAGE_TYPES = [
  "landing",
  "ecommerce",
  "blog",
  "dashboard",
  "portfolio",
  "documentation",
  "corporate",
  "auth",
  "checkout",
  "product-detail",
];

const COMPONENT_NAMES = {
  header: "Site Header",
  navbar: "Navbar",
  hero: "Hero",
  "feature-grid": "Feature Grid",
  pricing: "Pricing",
  faq: "FAQ",
  footer: "Footer",
  "contact-form": "Contact Form",
  "product-grid": "Product Grid",
  "blog-cards": "Blog Cards",
  testimonials: "Testimonials",
  sidebar: "Sidebar",
  modal: "Modal",
  accordion: "Accordion",
  tabs: "Tabs",
  "dashboard-cards": "Dashboard Cards",
  tables: "Tables",
  gallery: "Gallery",
  breadcrumb: "Breadcrumb",
  slider: "Carousel",
};

function includesAny(source, terms) {
  return terms.some((term) => source.includes(term));
}

function addScore(scores, type, value, condition, evidence, label) {
  if (!condition) return;
  scores[type] += value;
  evidence[type].push(label);
}

function rankedResult(scores, evidence, key) {
  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const [winner, winnerScore] = ranked[0];
  const runnerUpScore = ranked[1]?.[1] || 0;
  return {
    [key]: winner,
    confidence: Math.min(
      99,
      Math.max(50, Math.round(50 + winnerScore / 2 + (winnerScore - runnerUpScore) / 3)),
    ),
    scores: Object.fromEntries(
      ranked.map(([name, score]) => [name, Math.min(100, score)]),
    ),
    evidence: evidence[winner],
  };
}

function classifyPageType(html, url = "") {
  const $ = cheerio.load(html || "");
  const source = `${url} ${$("body").text()} ${html}`.toLowerCase();
  const scores = Object.fromEntries(PAGE_TYPES.map((type) => [type, 0]));
  const evidence = Object.fromEntries(PAGE_TYPES.map((type) => [type, []]));

  addScore(scores, "auth", 70, $("input[type='password']").length > 0, evidence, "password field");
  addScore(scores, "auth", 35, includesAny(source, ["sign in", "log in", "forgot password"]), evidence, "authentication language");
  addScore(scores, "checkout", 65, includesAny(source, ["checkout", "payment method", "billing address"]), evidence, "checkout language");
  addScore(scores, "checkout", 30, $("[class*='order-summary'], [class*='payment']").length > 0, evidence, "payment or order summary");
  addScore(scores, "product-detail", 55, $("[itemtype*='Product'], [class*='product-detail']").length > 0, evidence, "product detail schema");
  addScore(scores, "product-detail", 35, includesAny(source, ["add to cart", "buy now"]) && $("h1").length === 1, evidence, "single product purchase action");
  addScore(scores, "dashboard", 50, $("[class*='dashboard'], [class*='metrics'], [class*='kpi']").length > 0, evidence, "dashboard metrics");
  addScore(scores, "dashboard", 25, $("aside").length > 0 && $("table, canvas, svg").length > 0, evidence, "sidebar with data visualization");
  addScore(scores, "ecommerce", 50, $("[class*='product-grid'], .products, [class*='product-card']").length > 0, evidence, "product collection");
  addScore(scores, "ecommerce", 30, includesAny(source, ["shopping cart", "add to cart", "shop now"]), evidence, "commerce actions");
  addScore(scores, "blog", 45, $("article").length > 0, evidence, "article content");
  addScore(scores, "blog", 30, $("time, [class*='author'], [class*='post-']").length > 0, evidence, "publishing metadata");
  addScore(scores, "portfolio", 50, $("[class*='portfolio'], [class*='project-grid'], [class*='case-stud']").length > 0, evidence, "portfolio projects");
  addScore(scores, "portfolio", 20, includesAny(source, ["my work", "selected work", "case studies"]), evidence, "portfolio language");
  addScore(scores, "documentation", 50, $("pre, code").length >= 2, evidence, "code examples");
  addScore(scores, "documentation", 35, $("[class*='docs'], [class*='toc'], nav[aria-label*='documentation' i]").length > 0, evidence, "documentation navigation");
  addScore(scores, "landing", 40, $("[class*='hero'], [id*='hero']").length > 0, evidence, "hero section");
  addScore(scores, "landing", 25, $("main h1").length === 1 && $("form, [class*='cta'], button").length > 0, evidence, "single call to action");
  addScore(scores, "corporate", 30, includesAny(source, ["about us", "our services", "our team", "company"]), evidence, "company information");
  addScore(scores, "corporate", 20, $("header").length > 0 && $("footer").length > 0, evidence, "corporate page structure");

  if (!Object.values(scores).some(Boolean)) {
    scores.corporate = 20;
    evidence.corporate.push("default informational structure");
  }
  return rankedResult(scores, evidence, "type");
}

function classifyBusinessType(html, pageType = "corporate") {
  const $ = cheerio.load(html || "");
  const source = `${$("body").text()} ${html}`.toLowerCase();
  const intents = [
    "lead generation",
    "product sales",
    "content publishing",
    "SaaS",
    "ecommerce",
    "service business",
    "admin system",
  ];
  const scores = Object.fromEntries(intents.map((intent) => [intent, 0]));
  const evidence = Object.fromEntries(intents.map((intent) => [intent, []]));

  addScore(scores, "lead generation", 45, $("form input[type='email'], form textarea").length > 0, evidence, "lead capture form");
  addScore(scores, "lead generation", 25, includesAny(source, ["get started", "request a quote", "book a demo", "contact us"]), evidence, "conversion call to action");
  addScore(scores, "product sales", 55, pageType === "product-detail", evidence, "product detail page");
  addScore(scores, "product sales", 25, includesAny(source, ["buy now", "add to cart", "pricing"]), evidence, "purchase language");
  addScore(scores, "content publishing", 60, pageType === "blog", evidence, "blog page");
  addScore(scores, "content publishing", 20, $("article, time").length > 0, evidence, "published content");
  addScore(scores, "SaaS", 40, includesAny(source, ["software", "platform", "subscription", "free trial"]), evidence, "software product language");
  addScore(scores, "SaaS", 30, $("[class*='pricing'], [class*='feature']").length > 0, evidence, "features and pricing");
  addScore(scores, "ecommerce", 70, ["ecommerce", "checkout"].includes(pageType), evidence, "commerce page");
  addScore(scores, "ecommerce", 25, $("[class*='product'], [class*='cart']").length > 1, evidence, "catalog or cart");
  addScore(scores, "service business", 45, includesAny(source, ["our services", "consulting", "agency", "appointment"]), evidence, "service language");
  addScore(scores, "service business", 20, pageType === "corporate", evidence, "company website");
  addScore(scores, "admin system", 70, pageType === "dashboard", evidence, "dashboard page");
  addScore(scores, "admin system", 20, $("table, [class*='admin']").length > 0, evidence, "administrative data");

  if (!Object.values(scores).some(Boolean)) {
    scores["service business"] = 20;
    evidence["service business"].push("default business website");
  }
  return rankedResult(scores, evidence, "intent");
}

function sectionPurpose(type, source) {
  if (type === "header" || type === "navigation") return ["navigation", "Primary Navigation", 98];
  if (type === "footer") return ["site-information", "Site Footer", 98];
  if (type === "form" && includesAny(source, ["login", "sign in", "password"])) return ["authentication", "Authentication Form", 94];
  if (type === "form") return ["conversion", "Contact Form", 88];
  if (includesAny(source, ["frequently asked", "faq", "what is"])) return ["faq", "FAQ", 92];
  if (includesAny(source, ["pricing", "per month", "choose plan"])) return ["pricing", "Pricing", 92];
  if (includesAny(source, ["testimonial", "what our customers", "reviews"])) return ["social-proof", "Testimonials", 88];
  if (includesAny(source, ["add to cart", "product", "shop"])) return ["commerce", "Product Collection", 86];
  if (includesAny(source, ["feature", "benefit", "why choose"])) return ["features", "Feature Grid", 84];
  if (type === "main") return ["primary-content", "Main Content", 82];
  if (type === "article") return ["content", "Article Content", 88];
  if (type === "sidebar") return ["secondary-navigation", "Sidebar", 90];
  return ["content", "Content Section", 65];
}

function classifySectionPurposes(html) {
  const $ = cheerio.load(html || "");
  const selectors = [
    ["header", "header"],
    ["navigation", "nav"],
    ["main", "main"],
    ["section", "section"],
    ["article", "article"],
    ["sidebar", "aside"],
    ["form", "form"],
    ["footer", "footer"],
  ];
  const sections = [];
  const seen = new Set();
  selectors.forEach(([type, selector]) => {
    $(selector).each((_, element) => {
      if (seen.has(element)) return;
      seen.add(element);
      const text = $(element).text().replace(/\s+/g, " ").trim();
      const [purpose, name, confidence] = sectionPurpose(
        type,
        `${text} ${$(element).attr("class") || ""}`.toLowerCase(),
      );
      sections.push({
        id: `purpose-${sections.length + 1}`,
        type,
        purpose,
        name,
        confidence,
        textPreview: text.slice(0, 160),
      });
    });
  });
  return sections;
}

function nameComponents(components = [], pageType = "corporate") {
  const used = new Map();
  const hasSpecializedCards = components.some((component) =>
    ["feature-grid", "dashboard-cards", "product-grid", "blog-cards"].includes(
      component.type,
    ),
  );
  return components
    .filter((component) => component.type !== "cards" || !hasSpecializedCards)
    .map((component) => {
    let name = COMPONENT_NAMES[component.type] || component.name || "Content Section";
    if (component.type === "cards") {
      name = {
        dashboard: "Dashboard Cards",
        blog: "Blog Cards",
        ecommerce: "Product Grid",
        landing: "Feature Grid",
      }[pageType] || "Content Cards";
    }
    const count = (used.get(name) || 0) + 1;
    used.set(name, count);
    return {
      ...component,
      originalName: component.name,
      name: count === 1 ? name : `${name} ${count}`,
      semanticConfidence: Math.min(
        99,
        Math.round((component.confidence || 70) * 0.7 + 25),
      ),
    };
    });
}

function scoreSemanticConfidence({
  html,
  pageClassification,
  sections,
  components,
}) {
  const $ = cheerio.load(html || "");
  const semanticTags = $("header, nav, main, section, article, aside, footer").length;
  const structuralElements = $("body > *, main > *").length || 1;
  const semanticCoverage = Math.min(100, Math.round((semanticTags / structuralElements) * 100));
  const sectionConfidence = sections.length
    ? Math.round(
        sections.reduce((sum, section) => sum + section.confidence, 0) /
          sections.length,
      )
    : 0;
  const componentConfidence = components.length
    ? Math.round(
        components.reduce(
          (sum, component) => sum + (component.semanticConfidence || component.confidence || 0),
          0,
        ) / components.length,
      )
    : 0;
  return {
    score: Math.round(
      semanticCoverage * 0.3 +
        sectionConfidence * 0.25 +
        componentConfidence * 0.25 +
        pageClassification.confidence * 0.2,
    ),
    semanticCoverage,
    sectionConfidence,
    componentConfidence,
    pageTypeConfidence: pageClassification.confidence,
  };
}

module.exports = {
  PAGE_TYPES,
  classifyBusinessType,
  classifyPageType,
  classifySectionPurposes,
  nameComponents,
  scoreSemanticConfidence,
};
