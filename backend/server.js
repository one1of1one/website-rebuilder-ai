const path = require("path");
const express = require("express");
const cors = require("cors");
const { registerApiRoutes } = require("./api/routes");
const { ensureStorage, frontendDirectory, outputDirectory } = require("./storage");
const { globalErrorHandler } = require("./utils/http");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "32kb" }));
app.use(express.static(frontendDirectory));
app.use("/downloads", express.static(outputDirectory));

registerApiRoutes(app);

app.use((_request, response) => {
  response.sendFile(path.join(frontendDirectory, "index.html"));
});

app.use(globalErrorHandler);

async function start() {
  await ensureStorage();
  app.listen(port, () => {
    console.log(`Website Rebuilder AI Pro running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});
