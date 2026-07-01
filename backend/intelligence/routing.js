const cheerio = require("cheerio");

function normalizePath(value, sourceUrl) {
  try {
    return new URL(value, sourceUrl).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
}

function parameterize(pathname, syntax) {
  let parameterIndex = 0;
  return pathname
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      const isParameter =
        /^\d+$/.test(segment) ||
        /^[a-f0-9]{8}-[a-f0-9-]{20,}$/i.test(segment) ||
        /^[a-f0-9]{16,}$/i.test(segment);
      if (!isParameter) return segment;
      parameterIndex += 1;
      const name = parameterIndex === 1 ? "id" : `id${parameterIndex}`;
      return syntax(name);
    })
    .join("/");
}

function componentName(pathname) {
  if (pathname === "/") return "Home";
  const name = pathname
    .split("/")
    .filter(Boolean)
    .map(
      (segment) =>
        `${segment.replace(/[^a-zA-Z0-9]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\s+/g, "")}`,
    )
    .join("");
  return `${name || "Page"}Page`;
}

function nextTarget(pathname) {
  if (pathname === "/") return "app/page.jsx";
  const segments = parameterize(pathname, (name) => `[${name}]`)
    .split("/")
    .filter(Boolean);
  return `app/${segments.join("/")}/page.jsx`;
}

function buildRoutingIntelligence(pages = [], sourceUrl) {
  const origin = new URL(sourceUrl).origin;
  const paths = new Set();
  pages.forEach((page) => {
    const pagePath = normalizePath(page.path || page.url, sourceUrl);
    if (pagePath) paths.add(pagePath);
    const $ = cheerio.load(page.html || "");
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;
      try {
        const parsed = new URL(href, page.url || sourceUrl);
        if (parsed.origin === origin) paths.add(normalizePath(parsed.href, sourceUrl));
      } catch {
        // Ignore malformed links.
      }
    });
  });
  const routes = [...paths]
    .filter(Boolean)
    .sort((left, right) => {
      if (left === "/") return -1;
      if (right === "/") return 1;
      return left.localeCompare(right);
    })
    .map((pathname) => {
      const name = componentName(pathname);
      return {
        path: pathname,
        dynamic: parameterize(pathname, (parameter) => `:${parameter}`) !== pathname,
        react: {
          path: parameterize(pathname, (parameter) => `:${parameter}`),
          component: name,
          hint: `<Route path="${parameterize(pathname, (parameter) => `:${parameter}`)}" element={<${name} />} />`,
        },
        nextjs: {
          path: parameterize(pathname, (parameter) => `[${parameter}]`),
          target: nextTarget(pathname),
        },
        laravel: {
          path: parameterize(pathname, (parameter) => `{${parameter}}`),
          hint: `Route::view(${JSON.stringify(
            parameterize(pathname, (parameter) => `{${parameter}}`),
          )}, ${JSON.stringify(
            pathname === "/"
              ? "pages.home"
              : `pages.${pathname.split("/").filter(Boolean).join("-")}`,
          )});`,
        },
        express: {
          path: parameterize(pathname, (parameter) => `:${parameter}`),
          hint: `router.get(${JSON.stringify(
            parameterize(pathname, (parameter) => `:${parameter}`),
          )}, handler);`,
        },
        vue: {
          path: parameterize(pathname, (parameter) => `:${parameter}`),
          component: name,
          hint: `{ path: ${JSON.stringify(
            parameterize(pathname, (parameter) => `:${parameter}`),
          )}, component: () => import("./views/${name}.vue") }`,
        },
      };
    });

  return {
    sourceUrl,
    routeCount: routes.length,
    routes,
    frameworkHints: {
      react: "Use react-router-dom and render the generated route entries inside <Routes>.",
      nextjs: "Place generated pages at each app router target; bracketed folders represent dynamic parameters.",
      laravel: "Copy reviewed Route::view hints into routes/web.php and replace them with controller routes when state is required.",
      express: "Register generated router.get hints on an Express Router.",
      vue: "Create a Vue Router instance from the generated lazy-loaded route records.",
    },
  };
}

function routingMarkdown(routing) {
  return `# Routing Intelligence

Routes inferred: ${routing.routeCount}

## Route map

${routing.routes
  .map(
    (route) =>
      `- \`${route.path}\`${route.dynamic ? " (dynamic)" : ""}\n  - React: \`${route.react.path}\` → ${route.react.component}\n  - Next.js: \`${route.nextjs.target}\`\n  - Laravel: \`${route.laravel.path}\`\n  - Express: \`${route.express.path}\`\n  - Vue: \`${route.vue.path}\` → ${route.vue.component}`,
  )
  .join("\n") || "- No application routes inferred."}

## Framework notes

${Object.entries(routing.frameworkHints)
  .map(([framework, hint]) => `- ${framework}: ${hint}`)
  .join("\n")}
`;
}

module.exports = {
  buildRoutingIntelligence,
  routingMarkdown,
};
