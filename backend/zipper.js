const fs = require("fs");

async function createZip(sourceDirectory, zipPath) {
  const archiver = await import("archiver");
  const options = { zlib: { level: 9 } };

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver.ZipArchive
      ? new archiver.ZipArchive(options)
      : archiver.default("zip", options);

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("warning", (error) => {
      if (error.code !== "ENOENT") reject(error);
    });
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDirectory, false);
    archive.finalize();
  });
}

module.exports = { createZip };
