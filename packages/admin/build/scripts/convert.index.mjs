import path from "node:path";
import { readFile, writeFile, access } from "node:fs/promises";
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

export const convertRuntimeIndex = async (packageRoot) => {
  const distDir = path.join(packageRoot, "dist");
  const manifestFile = path.join(distDir, "asset.manifest.json");
  const primaryIndexFile = path.join(distDir, "index.htm");
  const runtimeIndexFile = path.join(distDir, "runtime", "index.htm");

  const manifestRaw = await readFile(manifestFile, "utf-8");
  const manifest = JSON.parse(manifestRaw);

  const sourceIndexFile = (await exists(primaryIndexFile)) ? primaryIndexFile : runtimeIndexFile;
  const sourceHtml = await readFile(sourceIndexFile, "utf-8");
  const rewrittenHtml = replaceAllWithManifest(sourceHtml, manifest);

  await writeFile(primaryIndexFile, rewrittenHtml, "utf-8");

  if (await exists(runtimeIndexFile)) {
    await writeFile(runtimeIndexFile, rewrittenHtml, "utf-8");
  }

  return {
    rewritten: sourceHtml !== rewrittenHtml,
    target: primaryIndexFile,
  };
};
