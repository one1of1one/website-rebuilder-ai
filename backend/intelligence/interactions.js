const cheerio = require("cheerio");

const INTERACTION_RULES = [
  {
    type: "dropdown",
    selector:
      "select, [class*='dropdown'], [aria-haspopup='menu'], [aria-expanded][aria-controls]",
    confidence: 91,
  },
  {
    type: "modal",
    selector: "[role='dialog'], [aria-modal='true'], [class*='modal'], [data-modal]",
    confidence: 96,
  },
  {
    type: "accordion",
    selector: "details, [class*='accordion'], [data-accordion], [aria-expanded][aria-controls]",
    confidence: 94,
  },
  {
    type: "tabs",
    selector: "[role='tablist'], [role='tab'], [class*='tabs'], [data-tabs]",
    confidence: 96,
  },
  {
    type: "carousel",
    selector:
      "[class*='carousel'], [class*='slider'], .swiper, .splide, .slick-slider, [aria-roledescription='carousel']",
    confidence: 94,
  },
  {
    type: "mobile-menu",
    selector:
      "[class*='menu-toggle'], [class*='hamburger'], button[aria-controls*='menu'], nav[class*='mobile']",
    confidence: 91,
  },
  {
    type: "form",
    selector: "form",
    confidence: 99,
  },
  {
    type: "search",
    selector:
      "input[type='search'], form[role='search'], [class*='search-box'], [class*='site-search']",
    confidence: 98,
  },
  {
    type: "filter",
    selector:
      "[class*='filter'], [data-filter], select[name*='filter'], form[action*='filter']",
    confidence: 90,
  },
  {
    type: "pagination",
    selector:
      "nav[aria-label*='pagination' i], [class*='pagination'], [rel='next'], [rel='prev']",
    confidence: 96,
  },
];

function selectorFor($, element) {
  const tag = element.tagName || element.name || "element";
  const id = $(element).attr("id");
  if (id) return `${tag}#${id}`;
  const classes = ($(element).attr("class") || "").split(/\s+/).filter(Boolean);
  if (classes.length) return `${tag}.${classes.slice(0, 2).join(".")}`;
  const name = $(element).attr("name");
  if (name) return `${tag}[name="${name}"]`;
  return tag;
}

function componentContext($, element) {
  const container = $(element).closest(
    "[data-component], header, nav, main, section, article, aside, footer",
  );
  if (!container.length) return "Document";
  return (
    container.attr("data-component") ||
    container.attr("aria-label") ||
    container.attr("id") ||
    (container.attr("class") || "").split(/\s+/).filter(Boolean)[0] ||
    (container.get(0)?.tagName || "Document")
  );
}

function detectInteractions(html) {
  const $ = cheerio.load(html || "", { decodeEntities: false });
  const interactions = [];
  INTERACTION_RULES.forEach((rule) => {
    const seen = new Set();
    $(rule.selector).each((_, element) => {
      if (seen.has(element)) return;
      seen.add(element);
      interactions.push({
        id: `interaction-${interactions.length + 1}`,
        type: rule.type,
        selector: selectorFor($, element),
        component: componentContext($, element),
        confidence: rule.confidence,
        trigger:
          $(element).attr("aria-controls") ||
          $(element).attr("data-target") ||
          $(element).attr("href") ||
          null,
      });
    });
  });
  return interactions;
}

function buildInteractionMap(interactions = []) {
  const byComponent = {};
  const counts = {};
  interactions.forEach((interaction) => {
    if (!byComponent[interaction.component]) {
      byComponent[interaction.component] = [];
    }
    byComponent[interaction.component].push(interaction.id);
    counts[interaction.type] = (counts[interaction.type] || 0) + 1;
  });
  return {
    count: interactions.length,
    counts,
    byComponent,
    interactions: interactions.map(({ id, type, component, selector }) => ({
      id,
      type,
      component,
      selector,
    })),
  };
}

module.exports = {
  INTERACTION_RULES,
  buildInteractionMap,
  detectInteractions,
};
