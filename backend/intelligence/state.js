const cheerio = require("cheerio");

function addState(states, state) {
  if (states.some((candidate) => candidate.key === state.key)) return;
  states.push(state);
}

function inferStateNeeds(html, interactions = []) {
  const $ = cheerio.load(html || "");
  const source = `${$("body").text()} ${html}`.toLowerCase();
  const interactionTypes = new Set(
    interactions.map((interaction) => interaction.type),
  );
  const states = [];

  if ($("form").length) {
    addState(states, {
      key: "formData",
      need: "forms",
      initialValue: "{}",
      confidence: 98,
      evidence: `${$("form").length} form(s) detected`,
    });
  }
  if ($("input[type='password']").length || /\b(log in|sign in)\b/.test(source)) {
    addState(states, {
      key: "authCredentials",
      need: "login",
      initialValue: '{ email: "", password: "" }',
      confidence: 96,
      evidence: "authentication fields or language detected",
    });
  }
  if (interactionTypes.has("search")) {
    addState(states, {
      key: "searchQuery",
      need: "search",
      initialValue: '""',
      confidence: 98,
      evidence: "search interaction detected",
    });
  }
  if (interactionTypes.has("filter")) {
    addState(states, {
      key: "activeFilters",
      need: "filters",
      initialValue: "{}",
      confidence: 93,
      evidence: "filter controls detected",
    });
  }
  if (interactionTypes.has("tabs")) {
    addState(states, {
      key: "activeTab",
      need: "tabs",
      initialValue: '""',
      confidence: 97,
      evidence: "tab controls detected",
    });
  }
  if (interactionTypes.has("modal")) {
    addState(states, {
      key: "isModalOpen",
      need: "modal open/close",
      initialValue: "false",
      confidence: 97,
      evidence: "modal dialog detected",
    });
  }
  if (
    $("[class*='cart'], [id*='cart']").length ||
    /\b(add to cart|shopping cart|basket)\b/.test(source)
  ) {
    addState(states, {
      key: "cartItems",
      need: "cart",
      initialValue: "[]",
      confidence: 94,
      evidence: "cart controls or language detected",
    });
  }
  if (/\b(checkout|payment method|billing address)\b/.test(source)) {
    addState(states, {
      key: "checkoutStep",
      need: "checkout",
      initialValue: "1",
      confidence: 96,
      evidence: "checkout flow detected",
    });
  }
  if (interactionTypes.has("pagination")) {
    addState(states, {
      key: "currentPage",
      need: "pagination",
      initialValue: "1",
      confidence: 97,
      evidence: "pagination controls detected",
    });
  }

  return {
    states,
    frameworkHints: {
      react: states.map(
        (state) =>
          `const [${state.key}, set${state.key.charAt(0).toUpperCase()}${state.key.slice(1)}] = useState(${state.initialValue});`,
      ),
      vue: states.map(
        (state) => `const ${state.key} = ref(${state.initialValue});`,
      ),
      laravel: [
        ...(states.some((state) => state.need === "forms")
          ? [
              "Validate request data in a FormRequest or controller.",
              "Add @csrf to generated forms and redirect with validation errors.",
            ]
          : []),
        ...(states.some((state) => state.need === "login")
          ? ["Use Laravel authentication middleware for protected routes."]
          : []),
      ],
      php: [
        ...(states.some((state) => state.need === "forms")
          ? [
              "Read submitted values from $_POST after checking REQUEST_METHOD.",
              "Validate and escape all submitted values before persistence or output.",
            ]
          : []),
        ...(states.some((state) => state.need === "login")
          ? ["Use sessions and password_verify() for authentication."]
          : []),
      ],
    },
  };
}

function stateInferenceMarkdown(stateMap) {
  return `# State Inference

Likely state requirements: ${stateMap.states.length}

## State model

${stateMap.states
  .map(
    (state) =>
      `- \`${state.key}\` — ${state.need} (${state.confidence}%): ${state.evidence}`,
  )
  .join("\n") || "- No client or server state requirements inferred."}

## React useState hints

${stateMap.frameworkHints.react.map((hint) => `- \`${hint}\``).join("\n") || "- No local React state inferred."}

## Vue ref hints

${stateMap.frameworkHints.vue.map((hint) => `- \`${hint}\``).join("\n") || "- No local Vue state inferred."}

## Laravel handling notes

${stateMap.frameworkHints.laravel.map((hint) => `- ${hint}`).join("\n") || "- No Laravel state handling required."}

## PHP handling notes

${stateMap.frameworkHints.php.map((hint) => `- ${hint}`).join("\n") || "- No PHP state handling required."}
`;
}

module.exports = {
  inferStateNeeds,
  stateInferenceMarkdown,
};
