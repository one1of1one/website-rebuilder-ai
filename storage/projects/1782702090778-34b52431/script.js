const form = document.querySelector("#rebuild-form");
const submitButton = document.querySelector("#submit-button");
const formatCards = [...document.querySelectorAll("#format-grid .format-card")];
const exportCards = [
  ...document.querySelectorAll("#export-grid .format-card"),
];
const editorProjectLabel = document.querySelector("#editor-project-label");
const editorFiles = document.querySelector("#editor-files");
const editorFilePath = document.querySelector("#editor-file-path");
const editorContent = document.querySelector("#editor-content");
const editorStatus = document.querySelector("#editor-status");
const editorRefresh = document.querySelector("#editor-refresh");
const editorSave = document.querySelector("#editor-save");
const editorDownload = document.querySelector("#editor-download");
const chatLog = document.querySelector("#chat-log");
const chatInput = document.querySelector("#chat-input");
const chatSend = document.querySelector("#chat-send");
const structurePreview = document.querySelector("#structure-preview");
const structureType = document.querySelector("#structure-type");
const technologyList = document.querySelector("#technology-list");
const progressPanel = document.querySelector("#progress-panel");
const progressSteps = [...document.querySelectorAll("#progress-steps li")];
const progressBar = document.querySelector("#progress-bar");
const progressPercent = document.querySelector("#progress-percent");
const progressTitle = document.querySelector("#progress-title");
const resultActions = document.querySelector("#result-actions");
const resultMessage = document.querySelector("#result-message");
const downloadLink = document.querySelector("#download-link");
const projectsList = document.querySelector("#projects-list");
const modeCards = [...document.querySelectorAll(".mode-card")];
const aiImprovements = document.querySelector("#ai-improvements");
const analyzeButton = document.querySelector("#analyze-button");
const reportPanel = document.querySelector("#report-panel");
const reportTitle = document.querySelector("#report-title");
const reportMetrics = document.querySelector("#report-metrics");
const reportTechnologyList = document.querySelector(
  "#report-technology-list",
);
const componentList = document.querySelector("#component-list");
const routeList = document.querySelector("#route-list");
const assetSummary = document.querySelector("#asset-summary");
const sideReport = document.querySelector("#side-report");
const projectInspector = document.querySelector("#project-inspector");
const resultTechnology = document.querySelector("#result-technology");
const resultPages = document.querySelector("#result-pages");
const resultAssets = document.querySelector("#result-assets");
const resultComponents = document.querySelector("#result-components");
const resultSimilarity = document.querySelector("#result-similarity");

const structures = {
  "static-html": {
    badge: "HTML",
    tree: `project/
├── index.html
├── assets/
│   ├── styles.css
│   ├── scripts.js
│   └── images/
├── fonts/
├── videos/
├── icons/
├── documents/
├── manifests/
├── data/
└── README.md`,
  },
  php: {
    badge: "PHP",
    tree: `project/
├── index.php
├── assets/
│   ├── styles.css
│   ├── scripts.js
│   └── images/
└── README.md`,
  },
  laravel: {
    badge: "LARAVEL",
    tree: `project/
├── public/
│   ├── index.php
│   └── assets/
├── resources/views/
│   └── welcome.blade.php
├── routes/web.php
└── composer.json`,
  },
  wordpress: {
    badge: "WP",
    tree: `theme/
├── index.php
├── functions.php
├── style.css
├── assets/
│   ├── scripts.js
│   └── images/
└── README.md`,
  },
  nextjs: {
    badge: "NEXT.JS",
    tree: `project/
├── app/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── public/site/
│   ├── index.html
│   └── assets/
└── package.json`,
  },
  nuxt: {
    badge: "NUXT",
    tree: `project/
├── app/
│   ├── app.vue
│   └── page.vue
├── public/assets/
├── nuxt.config.ts
└── package.json`,
  },
  react: {
    badge: "REACT",
    tree: `project/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── source.html
│   └── assets/
└── package.json`,
  },
  vue: {
    badge: "VUE",
    tree: `project/
├── src/
│   ├── App.vue
│   └── main.js
├── public/
│   ├── source.html
│   └── assets/
└── package.json`,
  },
  aspnet: {
    badge: ".NET",
    tree: `project/
├── wwwroot/
│   ├── index.html
│   └── assets/
├── Program.cs
├── RebuiltWebsite.csproj
└── README.md`,
  },
  express: {
    badge: "EXPRESS",
    tree: `project/
├── server.js
├── public/assets/
├── routes/index.js
├── package.json
└── README.md`,
  },
  node: {
    badge: "NODE",
    tree: `project/
├── server.js
├── public/assets/
├── package.json
└── README.md`,
  },
};

const aiStructures = {
  "static-html": {
    badge: "AI HTML",
    tree: `project/
|-- index.html
|-- style.css
|-- script.js
|-- images/
|-- fonts/
|-- videos/
|-- icons/
|-- documents/
|-- manifests/
|-- data/
\`-- README.md`,
  },
  php: {
    badge: "AI PHP",
    tree: `project/
|-- index.php
|-- includes/
|   |-- header.php
|   \`-- footer.php
|-- components/
|-- assets/css/
|-- assets/js/
|-- assets/images/
\`-- README.md`,
  },
  laravel: {
    badge: "AI LARAVEL",
    tree: `project/
|-- resources/views/
|   |-- layouts/app.blade.php
|   |-- components/
|   \`-- home.blade.php
|-- routes/web.php
|-- public/assets/
\`-- README.md`,
  },
  wordpress: {
    badge: "AI WP",
    tree: `theme/
|-- style.css
|-- functions.php
|-- header.php
|-- footer.php
|-- page.php
|-- single.php
|-- assets/
\`-- README.md`,
  },
  nextjs: {
    badge: "AI NEXT.JS",
    tree: `project/
|-- app/
|   |-- layout.js
|   |-- page.js
|   \`-- globals.css
|-- components/
|-- public/assets/
|-- package.json
\`-- README.md`,
  },
  nuxt: {
    badge: "AI NUXT",
    tree: `project/
|-- app/
|   |-- app.vue
|   \`-- page.vue
|-- components/
|-- public/assets/
|-- nuxt.config.ts
|-- package.json
\`-- README.md`,
  },
  react: {
    badge: "AI REACT",
    tree: `project/
|-- src/components/
|-- src/pages/Home.jsx
|-- src/App.jsx
|-- src/main.jsx
|-- public/assets/
|-- package.json
\`-- README.md`,
  },
  vue: {
    badge: "AI VUE",
    tree: `project/
|-- src/components/
|-- src/views/Home.vue
|-- src/App.vue
|-- src/main.js
|-- public/assets/
|-- package.json
\`-- README.md`,
  },
  aspnet: {
    badge: "AI .NET",
    tree: `project/
|-- Controllers/
|-- Views/
|   |-- Home/
|   \`-- Shared/
|-- wwwroot/
|-- Program.cs
|-- RebuiltWebsite.csproj
\`-- README.md`,
  },
  express: {
    badge: "AI EXPRESS",
    tree: `project/
|-- routes/
|-- public/assets/
|-- server.js
|-- package.json
\`-- README.md`,
  },
  node: {
    badge: "AI NODE",
    tree: `project/
|-- public/assets/
|-- server.js
|-- package.json
\`-- README.md`,
  },
};

function selectedOutputType() {
  return form.elements.outputType.value;
}

function selectedMode() {
  return form.elements.rebuildMode.value;
}

function selectedExportFormat() {
  return form.elements.exportFormat.value;
}

function updateStructure() {
  const source = selectedMode() === "mirror" ? structures : aiStructures;
  const structure = source[selectedOutputType()];
  structureType.textContent = structure.badge;
  structurePreview.textContent = structure.tree;
}

formatCards.forEach((card) => {
  card.addEventListener("click", () => {
    formatCards.forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    updateStructure();
  });
});

exportCards.forEach((card) => {
  card.addEventListener("click", () => {
    exportCards.forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
  });
});

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    modeCards.forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    aiImprovements.hidden = selectedMode() === "mirror";
    updateStructure();
  });
});

function renderTechnologies(technologies) {
  technologyList.replaceChildren();
  if (!technologies?.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No common technologies were detected.";
    technologyList.append(empty);
    return;
  }

  technologies.forEach((technology) => {
    const chip = document.createElement("span");
    chip.className = "technology-chip";
    chip.textContent = technology;
    technologyList.append(chip);
  });
}

function renderInspectorItems(container, items, emptyMessage, formatter) {
  container.replaceChildren();
  if (!items?.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = emptyMessage;
    container.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "inspector-item";
    formatter(row, item);
    container.append(row);
  });
}

function renderComponents(components) {
  renderInspectorItems(
    componentList,
    components,
    "No common layout components detected.",
    (row, component) => {
      const name = document.createElement("span");
      const confidence = document.createElement("b");
      name.textContent =
        typeof component === "string" ? component : component.name;
      confidence.textContent =
        typeof component === "string" ? "Detected" : `${component.confidence}%`;
      row.append(name, confidence);
    },
  );
}

function renderRoutes(routes) {
  renderInspectorItems(
    routeList,
    routes,
    "No internal routes detected.",
    (row, route) => {
      row.textContent = route;
      row.title = route;
    },
  );
}

function renderSideMetrics(container, metrics) {
  container.replaceChildren();
  metrics.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "side-metric";
    const name = document.createElement("span");
    const result = document.createElement("strong");
    name.textContent = label;
    result.textContent = value ?? 0;
    item.append(name, result);
    container.append(item);
  });
}

function renderAssets(assets, report = {}) {
  const counts = assets?.counts || {
    images: report.imagesCount,
    css: report.cssCount ?? report.cssFilesCount,
    js: report.jsCount ?? report.jsFilesCount,
    fonts: report.fontsCount,
    videos: report.videosCount,
    icons: report.iconsCount,
    svg: report.svgCount,
    audio: report.audioCount,
    documents: report.documentsCount,
    manifests: report.manifestsCount,
    data: report.dataCount,
    externalCdnAssets: report.externalCdnAssets,
  };
  renderSideMetrics(assetSummary, [
    ["Images", counts.images],
    ["CSS", counts.css],
    ["JavaScript", counts.js],
    ["Fonts", counts.fonts],
    ["Videos", counts.videos],
    ["SVG", counts.svg],
    ["Audio", counts.audio],
    ["PDF", counts.documents],
    ["Manifest", counts.manifests],
    ["JSON", counts.data],
    ["Icons", counts.icons],
    ["External CDN", counts.externalCdnAssets],
  ]);
}

function renderSideReport(report) {
  if (!report) return;
  const score = (value) => (Number.isFinite(value) ? `${value}/100` : "—");
  renderSideMetrics(sideReport, [
    ["SEO", score(report.seoScore)],
    ["Accessibility", score(report.accessibilityScore)],
    ["Performance", score(report.performanceScore)],
    [
      "Responsive",
      report.responsiveStatus || (report.responsive ? "Responsive" : "Needs review"),
    ],
    ["Pages", report.pagesCount],
    ["Similarity", `${report.estimatedSimilarity}%`],
  ]);
}

function renderProjectInspector(inspector) {
  if (!inspector) return;
  renderSideMetrics(projectInspector, [
    ["Project size", inspector.projectSizeFormatted],
    ["Files", inspector.fileCount],
    ["Pages", inspector.pagesGenerated],
    ["Components", inspector.componentsGenerated],
    ["Assets", inspector.assetsDownloaded],
    ["ZIP size", inspector.zipSizeFormatted],
  ]);
}

function appendChatBubble(text, variant = "assistant") {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${variant}`;
  bubble.textContent = text;
  chatLog.append(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function fetchProjectFiles(projectId) {
  const response = await fetch(`/api/project/${encodeURIComponent(projectId)}/files`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Project files unavailable.");
  return data.files || [];
}

async function fetchProjectFile(projectId, filePath) {
  const response = await fetch(
    `/api/project/${encodeURIComponent(projectId)}/file?path=${encodeURIComponent(filePath)}`,
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "File content unavailable.");
  return data.content ?? "";
}

async function saveProjectFile(projectId, filePath, content) {
  const response = await fetch(`/api/project/${encodeURIComponent(projectId)}/file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath, content }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "File could not be saved.");
  return data;
}

function renderEditorFiles(files) {
  editorFiles.replaceChildren();
  if (!files?.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No files available.";
    editorFiles.append(empty);
    return;
  }

  files.forEach((file) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inspector-item";
    item.textContent = file;
    item.addEventListener("click", async () => {
      if (!activeProjectId) return;
      activeFilePath = file;
      editorFilePath.textContent = file;
      editorStatus.textContent = "Loading file...";
      try {
        editorContent.value = await fetchProjectFile(activeProjectId, file);
        editorStatus.textContent = `Loaded ${file}`;
      } catch (error) {
        editorStatus.textContent = error.message;
      }
    });
    editorFiles.append(item);
  });
}

async function loadProjectEditor(projectId, project = null) {
  activeProjectId = projectId;
  activeProject = project;
  activeFilePath = "";
  editorProjectLabel.textContent = project?.name || projectId;
  editorDownload.hidden = !project?.downloadUrl;
  editorDownload.href = project?.downloadUrl || "#";
  editorFilePath.textContent = "Select a file";
  editorContent.value = "";
  editorStatus.textContent = "Loading project files...";
  try {
    const files = await fetchProjectFiles(projectId);
    renderEditorFiles(files);
    editorStatus.textContent = `${files.length} files loaded.`;
    if (files[0]) {
      activeFilePath = files[0];
      editorFilePath.textContent = files[0];
      editorContent.value = await fetchProjectFile(projectId, files[0]);
      editorStatus.textContent = `Loaded ${files[0]}`;
    }
  } catch (error) {
    editorFiles.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty-copy";
    message.textContent = error.message;
    editorFiles.append(message);
    editorStatus.textContent = error.message;
  }
}

async function saveActiveProjectFile() {
  if (!activeProjectId || !activeFilePath) {
    editorStatus.textContent = "Select a file first.";
    return;
  }
  editorStatus.textContent = "Saving file...";
  try {
    await saveProjectFile(activeProjectId, activeFilePath, editorContent.value);
    editorStatus.textContent = `Saved ${activeFilePath}`;
  } catch (error) {
    editorStatus.textContent = error.message;
  }
}

async function submitChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  appendChatBubble(message, "user");
  chatInput.value = "";
  const payload = { message, projectId: activeProjectId };
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Chat request failed.");
    appendChatBubble(data.reply || "Action queued.", "assistant");
    if (data.action && activeProjectId) {
      editorStatus.textContent = `Chat action: ${data.action}`;
    }
  } catch (error) {
    appendChatBubble(error.message, "assistant");
  }
}

function renderAnalysisPanels(data) {
  renderTechnologies(
    data.technologies ||
      data.detectedTechnologies ||
      data.report?.detectedTechnologies,
  );
  renderComponents(
    data.components ||
      data.detectedComponents ||
      data.report?.detectedComponents,
  );
  renderRoutes(
    data.routes || data.detectedRoutes || data.report?.detectedRoutes,
  );
  renderAssets(data.assets, data.report);
  renderSideReport(data.report);
  if (data.report?.inspector?.fileCount) {
    renderProjectInspector(data.report.inspector);
  }
}

let progressTimer;
let progressIndex = 0;
let activeProjectId = null;
let activeProject = null;
let activeFilePath = "";

function setProgress(index) {
  progressIndex = Math.min(index, progressSteps.length);
  progressSteps.forEach((step, stepIndex) => {
    step.classList.toggle("done", stepIndex < progressIndex);
    step.classList.toggle("active", stepIndex === progressIndex);
  });
  const percent = Math.round((progressIndex / progressSteps.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
}

function startProgress() {
  clearInterval(progressTimer);
  progressPanel.hidden = false;
  progressPanel.classList.remove("error");
  resultActions.hidden = true;
  progressTitle.textContent = "Rebuilding your project";
  setProgress(0);
  progressTimer = setInterval(() => {
    if (progressIndex < progressSteps.length - 2) {
      setProgress(progressIndex + 1);
    }
  }, 850);
  progressPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function finishProgress(data) {
  clearInterval(progressTimer);
  setProgress(progressSteps.length);
  progressTitle.textContent = "Project ready";
  const componentText = data.aiRebuildMode
    ? ` ${data.report.componentsCreated || 0} clean components generated.`
    : "";
  const exportText = data.project?.exportLabel
    ? ` Export preset: ${data.project.exportLabel}.`
    : "";
  resultMessage.textContent = `${data.assetCount} assets downloaded. ${data.technologies.length} technologies detected.${componentText}${exportText}`;
  resultTechnology.textContent = data.technologies.slice(0, 3).join(", ");
  resultPages.textContent = data.report.pagesCount;
  resultAssets.textContent = data.assetCount;
  resultComponents.textContent = data.report.componentsCreated;
  resultSimilarity.textContent = `${data.report.estimatedSimilarity}%`;
  downloadLink.href = data.downloadUrl;
  resultActions.hidden = false;
  renderAnalysisPanels(data);
  renderReport(data.report);
  if (data.project?.id) {
    loadProjectEditor(data.project.id, data.project);
  }
}

function failProgress(message) {
  clearInterval(progressTimer);
  progressPanel.classList.add("error");
  progressTitle.textContent = "Build failed";
  resultMessage.textContent = message;
  downloadLink.removeAttribute("href");
  downloadLink.hidden = true;
  resultActions.hidden = false;
}

function getOptions() {
  const names = [
    "downloadImages",
    "downloadVideos",
    "downloadFonts",
    "rewriteCss",
    "optimizeImages",
    "mobileResponsive",
    "seoOptimize",
    "generateComponents",
    "aiCleanCode",
    "splitComponents",
    "removeDuplicateCss",
    "renameClasses",
    "improveAccessibility",
    "generateReadme",
    "generateHtaccess",
    "generateSitemap",
    "generateRobots",
  ];
  return Object.fromEntries(
    names.map((name) => [name, form.elements[name].checked]),
  );
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  submitButton.classList.add("loading");
  downloadLink.hidden = false;
  startProgress();

  try {
    const response = await fetch("/api/rebuild", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: form.elements.url.value.trim(),
      projectName: form.elements.projectName.value.trim(),
      outputType: selectedOutputType(),
      aiRebuildMode: selectedMode() !== "mirror",
      rebuildMode: selectedMode(),
      exportFormat: selectedExportFormat(),
      options: getOptions(),
    }),
  });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "The rebuild could not be completed.");
    }

    finishProgress(data);
    await loadProjects();
  } catch (error) {
    failProgress(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("loading");
  }
});

analyzeButton.addEventListener("click", async () => {
  const urlInput = form.elements.url;
  if (!urlInput.reportValidity()) return;

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analyzing…";
  technologyList.replaceChildren();
  const status = document.createElement("p");
  status.className = "empty-copy";
  status.textContent = "Fetching the site and detecting technologies…";
  technologyList.append(status);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput.value.trim() }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed.");
    renderAnalysisPanels(data);
    renderReport(data.report, false);
  } catch (error) {
    technologyList.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty-copy";
    message.textContent = error.message;
    technologyList.append(message);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze URL";
  }
});

function renderReport(report, shouldScroll = true) {
  if (!report) return;
  const score = (value) => (Number.isFinite(value) ? `${value}/100` : "—");

  const metrics = [
    ["Pages", report.pagesCount],
    ["Images", report.imagesCount],
    ["CSS files", report.cssCount ?? report.cssFilesCount],
    ["JS files", report.jsCount ?? report.jsFilesCount],
    ["Fonts", report.fontsCount],
    ["Videos", report.videosCount],
    ["Icons", report.iconsCount],
    ["SVG", report.svgCount],
    ["Audio", report.audioCount],
    ["PDF", report.documentsCount],
    ["Manifest", report.manifestsCount],
    ["JSON", report.dataCount],
    [
      "Responsive",
      report.responsiveStatus || (report.responsive ? "Responsive" : "Needs review"),
    ],
    ["SEO score", score(report.seoScore)],
    ["Accessibility", score(report.accessibilityScore)],
    ["Performance", score(report.performanceScore)],
    ["Components", report.componentsCreated],
    ["Similarity", `${report.estimatedSimilarity}%`],
    ["Project size", report.projectSizeFormatted || "—"],
    ["File count", report.fileCount ?? "—"],
    ["ZIP size", report.inspector?.zipSizeFormatted || "—"],
  ];

  reportTitle.textContent = report.projectName
    ? `${report.projectName} Report`
    : "Website Report";
  reportMetrics.replaceChildren();
  metrics.forEach(([label, value]) => {
    const metric = document.createElement("div");
    metric.className = "report-metric";
    const name = document.createElement("span");
    name.textContent = label;
    const result = document.createElement("strong");
    result.textContent = value ?? 0;
    metric.append(name, result);
    reportMetrics.append(metric);
  });

  reportTechnologyList.replaceChildren();
  (report.detectedTechnologies || report.technologies || []).forEach(
    (technology) => {
    const chip = document.createElement("span");
    chip.className = "technology-chip";
    chip.textContent = technology;
    reportTechnologyList.append(chip);
    },
  );
  reportPanel.hidden = false;
  renderSideReport(report);
  if (report.inspector?.fileCount) renderProjectInspector(report.inspector);
  if (shouldScroll) {
    reportPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

async function viewReport(project) {
  try {
    const response = await fetch(
      project.reportUrl || `/api/report/${encodeURIComponent(project.id)}`,
    );
    const report = await response.json();
    if (!response.ok) throw new Error(report.error || "Report unavailable.");
    renderAnalysisPanels({ report });
    renderReport(report);
  } catch (error) {
    window.alert(error.message);
  }
}

function projectRow(project) {
  const row = document.createElement("tr");

  const nameCell = document.createElement("td");
  const name = document.createElement("strong");
  name.textContent = project.name;
  const assetText = document.createElement("span");
  const exportLabel = project.exportLabel || "ZIP";
  assetText.textContent = `${project.aiRebuildMode ? "AI Rebuild" : "Mirror"} · ${exportLabel} · ${project.assetCount || 0} assets`;
  nameCell.append(name, assetText);

  const urlCell = document.createElement("td");
  const url = document.createElement("span");
  url.className = "project-url";
  url.title = project.url;
  url.textContent = project.url;
  urlCell.append(url);

  const outputCell = document.createElement("td");
  const output = document.createElement("span");
  output.className = "output-label";
  output.textContent = project.outputLabel || project.outputType;
  outputCell.append(output);

  const modeCell = document.createElement("td");
  modeCell.textContent =
    {
      mirror: "Mirror",
      "ai-rebuild": "AI Rebuild",
      "ai-upgrade": "AI Upgrade",
      "framework-migration": "Framework Migration",
    }[project.rebuildMode] || (project.aiRebuildMode ? "AI Rebuild" : "Mirror");

  const statusCell = document.createElement("td");
  const status = document.createElement("span");
  status.className = "status-complete";
  status.textContent = project.status || "Completed";
  statusCell.append(status);

  const dateCell = document.createElement("td");
  dateCell.textContent = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(project.date));

  const actionCell = document.createElement("td");
  actionCell.className = "table-actions";
  const download = document.createElement("a");
  download.className = "table-download";
  download.href =
    project.downloadUrl ||
    `/api/download/${encodeURIComponent(project.zipName)}`;
  download.textContent = "Download ZIP";
  const report = document.createElement("button");
  report.className = "report-action";
  report.type = "button";
  report.textContent = "View Report";
  report.disabled = !project.reportUrl;
  report.addEventListener("click", () => viewReport(project));
  const edit = document.createElement("button");
  edit.className = "report-action";
  edit.type = "button";
  edit.textContent = "Open Editor";
  edit.addEventListener("click", () => loadProjectEditor(project.id, project));
  actionCell.append(download, report, edit);

  row.append(
    nameCell,
    urlCell,
    outputCell,
    modeCell,
    statusCell,
    dateCell,
    actionCell,
  );
  return row;
}

async function loadProjects() {
  projectsList.innerHTML =
    '<tr><td colspan="7" class="table-empty">Loading projects…</td></tr>';
  try {
    const response = await fetch("/api/projects");
    const data = await response.json();
    if (!response.ok) throw new Error();

    projectsList.replaceChildren();
    if (!data.projects.length) {
      projectsList.innerHTML =
        '<tr><td colspan="7" class="table-empty">No projects generated yet.</td></tr>';
      return;
    }
    data.projects.forEach((project) => projectsList.append(projectRow(project)));
    if (!activeProjectId && data.projects[0]) {
      loadProjectEditor(data.projects[0].id, data.projects[0]);
    }
  } catch {
    projectsList.innerHTML =
      '<tr><td colspan="7" class="table-empty">Project history is unavailable.</td></tr>';
  }
}

document
  .querySelector("#refresh-projects")
  .addEventListener("click", loadProjects);

editorRefresh.addEventListener("click", () => {
  if (activeProjectId) loadProjectEditor(activeProjectId, activeProject);
});

editorSave.addEventListener("click", saveActiveProjectFile);

chatSend.addEventListener("click", submitChatMessage);
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitChatMessage();
  }
});

updateStructure();
loadProjects();
