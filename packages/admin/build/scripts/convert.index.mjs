import path from "node:path";
import { readFile, writeFile, access, rm } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

const exists = async (target) => {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const replaceAllWithManifest = (html, manifest) => {
  let next = html;
  const entries = [];

  for (const [from, to] of Object.entries(manifest)) {
    entries.push([from, to]);

    if (from.startsWith("/")) {
      entries.push([from.slice(1), to]);
    }
  }

  entries.sort((a, b) => b[0].length - a[0].length);

  for (const [from, to] of entries) {
    if (typeof to !== "string") {
      continue;
    }

    next = next.split(from).join(to);
  }

  return next;
};

const normalizeRuntimeEntry = (html) =>
  html
    .split('src="app.js"')
    .join('src="/runtime/app.js"')
    .split("src='app.js'")
    .join("src='/runtime/app.js'");

export const convertRuntimeIndex = async (packageRoot) => {
  const distDir = path.join(packageRoot, "dist");
  const frontendDir = path.join(distDir, "frontend");
  const manifestFile = path.join(frontendDir, "asset.manifest.json");
  const primaryIndexFile = path.join(frontendDir, "index.htm");
  const runtimeIndexFile = path.join(frontendDir, "runtime", "index.htm");

  const manifestRaw = await readFile(manifestFile, "utf-8");
  const manifest = JSON.parse(manifestRaw);

  const sourceIndexFile = (await exists(primaryIndexFile)) ? primaryIndexFile : runtimeIndexFile;
  const sourceHtml = await readFile(sourceIndexFile, "utf-8");
  const rewrittenHtml = normalizeRuntimeEntry(replaceAllWithManifest(sourceHtml, manifest));

  await writeFile(primaryIndexFile, rewrittenHtml, "utf-8");

  if (await exists(runtimeIndexFile)) {
    await writeFile(runtimeIndexFile, rewrittenHtml, "utf-8");
  }

  await rm(manifestFile, { force: true });

  return {
    rewritten: sourceHtml !== rewrittenHtml,
    target: primaryIndexFile,
  };
};
