import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import { md5 } from "../../../shared/src/hash/md5.ts";

const isLowerHexHashName = (value) => /^[0-9a-f]{8}$/.test(value);

const shouldRenameStaticAsset = (fileName) => {
  const ext = path.extname(fileName);
  if (ext !== ".js" && ext !== ".css") {
    return false;
  }

  const baseName = path.basename(fileName, ext);
  if (isLowerHexHashName(baseName)) {
    return false;
  }

  return true;
};

const collectRewriteTargets = async (distDir) => {
  const targets = [];
  const queue = [distDir];

  while (queue.length > 0) {
    const current = queue.shift();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const targetPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(targetPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (ext === ".js" || ext === ".html" || ext === ".htm" || ext === ".css") {
        targets.push(targetPath);
      }
    }
  }

  return targets;
};

const replaceAllExact = (value, replacements) => {
  let next = value;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  return next;
};

export const renameAssets = async (entryUrl) => {
  const buildDir = path.dirname(fileURLToPath(entryUrl));
  const packageRoot = path.resolve(buildDir, "..");
  const distDir = path.join(packageRoot, "dist");
  const staticDir = path.join(distDir, "static");
  const entries = await readdir(staticDir, { withFileTypes: true });
  const replacements = new Map();
  const usedTargets = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (!shouldRenameStaticAsset(entry.name)) {
      continue;
    }

    const sourcePath = path.join(staticDir, entry.name);
    const ext = path.extname(entry.name);
    const content = await readFile(sourcePath);
    const hash = md5(content.toString("utf-8")).slice(0, 8);
    const nextFileName = `${hash}${ext}`;
    const targetPath = path.join(staticDir, nextFileName);

    if (entry.name === nextFileName) {
      continue;
    }

    if (usedTargets.has(nextFileName) && usedTargets.get(nextFileName) !== entry.name) {
      throw new Error(`Asset rename collision: ${entry.name} -> ${nextFileName}`);
    }

    usedTargets.set(nextFileName, entry.name);
    replacements.set(`/static/${entry.name}`, `/static/${nextFileName}`);
    await rename(sourcePath, targetPath);
  }

  if (replacements.size === 0) {
    return;
  }

  const rewriteTargets = await collectRewriteTargets(distDir);
  const pairs = [...replacements.entries()];

  for (const target of rewriteTargets) {
    const source = await readFile(target, "utf-8");
    const updated = replaceAllExact(source, pairs);
    if (updated !== source) {
      await writeFile(target, updated, "utf-8");
    }
  }
};
