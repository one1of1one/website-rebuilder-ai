const assert = require("assert");
const {
  analyzeIntelligence,
} = require("../backend/intelligence");
const {
  classifyBusinessType,
  classifyPageType,
} = require("../backend/intelligence/classifiers");
const {
  buildInteractionMap,
  detectInteractions,
} = require("../backend/intelligence/interactions");
const {
  buildRoutingIntelligence,
} = require("../backend/intelligence/routing");
const { inferStateNeeds } = require("../backend/intelligence/state");

function expectPageType(type, html, url = "https://example.com/") {
  const result = classifyPageType(html, url);
  assert.strictEqual(
    result.type,
    type,
    `expected ${type}, received ${result.type}: ${JSON.stringify(result.scores)}`,
  );
  assert(result.confidence >= 50);
}

function expectBusinessIntent(intent, html, pageType) {
  const result = classifyBusinessType(html, pageType);
  assert.strictEqual(
    result.intent,
    intent,
    `expected ${intent}, received ${result.intent}: ${JSON.stringify(result.scores)}`,
  );
}

function main() {
  expectPageType(
    "landing",
    "<main><section class='hero'><h1>Launch</h1><button>Get started</button></section></main>",
  );
  expectPageType(
    "ecommerce",
    "<main><section class='product-grid'><div class='product-card'>A</div><div class='product-card'>B</div></section><button>Add to cart</button></main>",
  );
  expectPageType(
    "blog",
    "<main><article><h1>Post</h1><time>Today</time><p>Story</p></article></main>",
  );
  expectPageType(
    "dashboard",
    "<main class='dashboard'><aside>Menu</aside><section class='metrics'><table><tr><td>1</td></tr></table></section></main>",
  );
  expectPageType(
    "portfolio",
    "<main><section class='portfolio project-grid'><h1>Selected work</h1></section></main>",
  );
  expectPageType(
    "documentation",
    "<main class='docs'><nav class='toc'>Docs</nav><pre><code>a</code></pre><pre><code>b</code></pre></main>",
  );
  expectPageType(
    "corporate",
    "<header></header><main><h1>About Us</h1><section>Our services and our team</section></main><footer></footer>",
  );
  expectPageType(
    "auth",
    "<main><form><h1>Sign in</h1><input type='email'><input type='password'></form></main>",
  );
  expectPageType(
    "checkout",
    "<main class='checkout'><h1>Checkout</h1><section class='order-summary'>Payment method and billing address</section></main>",
  );
  expectPageType(
    "product-detail",
    "<main><article itemtype='https://schema.org/Product'><h1>Camera</h1><p>$99</p><button>Add to cart</button></article></main>",
  );

  expectBusinessIntent(
    "lead generation",
    "<form><input type='email'><textarea></textarea><button>Request a quote</button></form>",
    "landing",
  );
  expectBusinessIntent(
    "product sales",
    "<main><h1>Product</h1><button>Add to cart</button></main>",
    "product-detail",
  );
  expectBusinessIntent(
    "content publishing",
    "<article><time>Today</time>Story</article>",
    "blog",
  );
  expectBusinessIntent(
    "SaaS",
    "<main><section class='features'>Software platform</section><section class='pricing'>Subscription</section></main>",
    "landing",
  );
  expectBusinessIntent(
    "ecommerce",
    "<main><div class='product-card'>A</div><div class='product-card'>B</div></main>",
    "ecommerce",
  );
  expectBusinessIntent(
    "service business",
    "<main><h1>Our services</h1><p>Consulting agency</p></main>",
    "corporate",
  );
  expectBusinessIntent(
    "admin system",
    "<main class='dashboard'><table></table></main>",
    "dashboard",
  );

  const interactionHtml = `
    <button class="menu-toggle" aria-controls="mobile-menu">Menu</button>
    <button aria-haspopup="menu">Account</button>
    <div role="dialog" aria-modal="true">Modal</div>
    <details><summary>Question</summary></details>
    <div role="tablist"><button role="tab">Tab</button></div>
    <div class="carousel"></div>
    <form role="search"><input type="search"><select name="filter-category"></select></form>
    <nav aria-label="Pagination"><a rel="next">Next</a></nav>`;
  const interactions = detectInteractions(interactionHtml);
  const interactionTypes = new Set(
    interactions.map((interaction) => interaction.type),
  );
  for (const type of [
    "dropdown",
    "modal",
    "accordion",
    "tabs",
    "carousel",
    "mobile-menu",
    "form",
    "search",
    "filter",
    "pagination",
  ]) {
    assert(interactionTypes.has(type), `expected ${type} interaction`);
  }
  assert.strictEqual(buildInteractionMap(interactions).count, interactions.length);

  const stateHtml = `${interactionHtml}
    <form><input type="password"></form>
    <button>Add to cart</button>
    <section>Checkout payment method</section>`;
  const state = inferStateNeeds(stateHtml, interactions);
  const stateNeeds = new Set(state.states.map((candidate) => candidate.need));
  for (const need of [
    "forms",
    "login",
    "search",
    "filters",
    "tabs",
    "modal open/close",
    "cart",
    "checkout",
    "pagination",
  ]) {
    assert(stateNeeds.has(need), `expected ${need} state inference`);
  }
  assert(state.frameworkHints.react.some((hint) => hint.includes("useState")));
  assert(state.frameworkHints.vue.some((hint) => hint.includes("ref(")));
  assert(state.frameworkHints.laravel.length > 0);
  assert(state.frameworkHints.php.length > 0);

  const pages = [
    {
      path: "/",
      url: "https://example.com/",
      html: '<a href="/products/123">Product</a>',
    },
  ];
  const routing = buildRoutingIntelligence(pages, "https://example.com/");
  const productRoute = routing.routes.find(
    (route) => route.path === "/products/123",
  );
  assert(productRoute.dynamic);
  assert.strictEqual(productRoute.react.path, "/products/:id");
  assert.strictEqual(productRoute.nextjs.target, "app/products/[id]/page.jsx");
  assert.strictEqual(productRoute.laravel.path, "/products/{id}");
  assert.strictEqual(productRoute.express.path, "/products/:id");
  assert.strictEqual(productRoute.vue.path, "/products/:id");

  const intelligence = analyzeIntelligence({
    pages: [
      {
        path: "/",
        url: "https://example.com/",
        html: "<main><section class='hero'><h1>Start</h1><form><input type='email'></form></section></main>",
      },
    ],
    sourceUrl: "https://example.com/",
    outputType: "react",
  });
  assert.strictEqual(intelligence.page.type, "landing");
  assert(intelligence.semanticConfidence.score > 0);
  assert(intelligence.components.length > 0);

  console.log(
    JSON.stringify(
      {
        ok: true,
        pageTypes: 10,
        businessIntents: 7,
        interactions: interactions.length,
        states: state.states.length,
        routes: routing.routeCount,
      },
      null,
      2,
    ),
  );
}

main();
