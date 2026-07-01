const { detectComponents } = require("../component-detector");
const {
  classifyBusinessType,
  classifyPageType,
  classifySectionPurposes,
  nameComponents,
  scoreSemanticConfidence,
} = require("./classifiers");
const { buildInteractionMap, detectInteractions } = require("./interactions");
const { buildRoutingIntelligence, routingMarkdown } = require("./routing");
const { inferStateNeeds, stateInferenceMarkdown } = require("./state");

function intelligenceMarkdown(intelligence) {
  return `# Semantic Intelligence

## Classification

- Page type: ${intelligence.page.type} (${intelligence.page.confidence}% confidence)
- Business intent: ${intelligence.business.intent} (${intelligence.business.confidence}% confidence)
- Semantic confidence: ${intelligence.semanticConfidence.score}/100

## Section purposes

${intelligence.sections
  .map(
    (section) =>
      `- ${section.name}: ${section.purpose} (${section.confidence}%)`,
  )
  .join("\n") || "- No semantic sections classified."}

## Components

${intelligence.components
  .map(
    (component) =>
      `- ${component.name} (${component.type}, ${component.semanticConfidence}% semantic confidence)`,
  )
  .join("\n") || "- No reusable components classified."}

## Interactions and state

- Interactions detected: ${intelligence.interactions.length}
- State requirements inferred: ${intelligence.state.states.length}
- Routes inferred: ${intelligence.routing.routeCount}

See \`interactions.json\`, \`state-map.json\`, and
\`route-intelligence.json\` for implementation-level guidance.
`;
}

function analyzeIntelligence({
  pages = [],
  sourceUrl,
  outputType = "static-html",
  components,
}) {
  const primaryHtml = pages[0]?.html || "";
  const page = classifyPageType(primaryHtml, pages[0]?.url || sourceUrl);
  const business = classifyBusinessType(primaryHtml, page.type);
  const sections = classifySectionPurposes(primaryHtml);
  const namedComponents = nameComponents(
    components || detectComponents(primaryHtml),
    page.type,
  );
  const semanticConfidence = scoreSemanticConfidence({
    html: primaryHtml,
    pageClassification: page,
    sections,
    components: namedComponents,
  });
  const interactions = pages.flatMap((candidate, pageIndex) =>
    detectInteractions(candidate.html).map((interaction) => ({
      ...interaction,
      id: `page-${pageIndex + 1}-${interaction.id}`,
      page: candidate.path || "/",
    })),
  );
  const interactionMap = buildInteractionMap(interactions);
  const state = inferStateNeeds(primaryHtml, interactions);
  const routing = buildRoutingIntelligence(pages, sourceUrl);

  return {
    version: 1,
    outputType,
    page,
    business,
    sections,
    components: namedComponents,
    semanticConfidence,
    interactions,
    interactionMap,
    state,
    routing,
  };
}

module.exports = {
  analyzeIntelligence,
  intelligenceMarkdown,
  routingMarkdown,
  stateInferenceMarkdown,
};
