import path from "node:path";
import { createHash } from "node:crypto";
import { access, readFile, rename, unlink, writeFile, readdir, rm } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

const SUPPORTED_EXTENSIONS = new Set([".css", ".woff", ".woff2", ".ico", ".svg", ".js"]);
const ATTRIBUTE_PATTERN = /\b(?:href|src)\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;

const exists = async (target) => {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const normalizeStaticPath = (rawValue) => {
  const value = rawValue.trim();
  const pathOnly = value.split("?")[0].split("#")[0];
  const normalized = pathOnly.startsWith("/static/") ? pathOnly : pathOnly.startsWith("static/") ? `/${pathOnly}` : null;

  if (!normalized) {
    return null;
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return null;
  }

  return normalized;
};

const collectStaticReferences = (html) => {
  const references = new Set();
  let match;

  while ((match = ATTRIBUTE_PATTERN.exec(html)) !== null) {
    const value = match[1] ?? match[2];
    const normalized = normalizeStaticPath(value);

    if (normalized) {
      references.add(normalized);
    }
  }

  return [...references];
};

const collectStaticReferencesFromSource = (content) => {
  const references = new Set();
  const stringLiteralPattern = /["'`]([^"'`]+)["'`]/g;
  let match;

  while ((match = stringLiteralPattern.exec(content)) !== null) {
    const normalized = normalizeStaticPath(match[1]);
    if (normalized) {
      references.add(normalized);
    }
  }

  return [...references];
};

const hashFile = (buffer) => createHash("md5").update(buffer).digest("hex").slice(0, 8);
const hashShort = (value) => createHash("md5").update(value).digest("hex").slice(0, 3);

const createReplacementEntries = (mapping) => {
  const entries = [];

  for (const [from, to] of mapping.entries()) {
    entries.push([from, to]);

    if (from.startsWith("/")) {
      entries.push([from.slice(1), to]);
    }
  }

  entries.sort((a, b) => b[0].length - a[0].length);
  return entries;
};

const rewriteFileWithMapping = async (targetFile, replacements) => {
  let content = await readFile(targetFile, "utf-8");
  let changed = false;

  for (const [from, to] of replacements) {
    if (!content.includes(from)) {
      continue;
    }

    content = content.split(from).join(to);
    changed = true;
  }

  if (changed) {
    await writeFile(targetFile, content, "utf-8");
  }

  return changed;
};

const collectJsFiles = async (rootDir) => {
  const files = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const current = queue.shift();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && fullPath.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  }

  return files;
};

const resolveExistingHtmlTargets = async (distDir) => {
  const candidates = [path.join(distDir, "index.htm"), path.join(distDir, "runtime", "index.htm")];
  const targets = [];

  for (const file of candidates) {
    if (await exists(file)) {
      targets.push(file);
    }
  }

  if (targets.length === 0) {
    throw new Error(`Missing runtime HTML. Expected one of: ${candidates.join(", ")}`);
  }

  return targets;
};

const resolveStaticRelativePath = (staticPath) => {
  const relative = staticPath.replace(/^\/static\//, "");
  return relative.replace(/^\/+/, "");
};

const resolveStaticSourceFile = async (roots, staticRelativePath) => {
  for (const root of roots) {
    const candidate = path.join(root, staticRelativePath);
    if (await exists(candidate)) {
      return candidate;
    }
  }

  return null;
};

export const convertRuntimeAssets = async (packageRoot) => {
  const distDir = path.join(packageRoot, "dist");
  const frontendDir = path.join(distDir, "frontend");
  const staticRoot = path.join(frontendDir, "static");
  const staticDirectoryHash = hashShort("static");
  const hashedStaticRoot = path.join(frontendDir, staticDirectoryHash);
  const manifestFile = path.join(frontendDir, "asset.manifest.json");
  const staticLookupRoots = [staticRoot, path.join(frontendDir, "runtime", "static")];
  const htmlTargets = await resolveExistingHtmlTargets(frontendDir);
  const jsFiles = await collectJsFiles(frontendDir);

  const references = new Set();
  for (const htmlFile of htmlTargets) {
    const html = await readFile(htmlFile, "utf-8");
    for (const reference of collectStaticReferences(html)) {
      references.add(reference);
    }
  }

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");
    for (const reference of collectStaticReferencesFromSource(source)) {
      references.add(reference);
    }
  }

  const mapping = new Map();
  const hashedTargets = new Map();
  let transformedAssets = 0;

  for (const reference of references) {
    const staticRelativePath = resolveStaticRelativePath(reference);
    const sourceFile = await resolveStaticSourceFile(staticLookupRoots, staticRelativePath);
    if (!sourceFile) {
      throw new Error(`Missing referenced asset: ${reference}`);
    }

    const content = await readFile(sourceFile);
    const extension = path.extname(reference).toLowerCase();
    const digest = hashFile(content);
    const hashedName = `${digest}${extension}`;
    const hashedPath = `/${staticDirectoryHash}/${hashedName}`;
    const targetFile = path.join(staticRoot, hashedName);

    const existingTarget = hashedTargets.get(hashedName);

    if (existingTarget && existingTarget !== sourceFile) {
      if (await exists(sourceFile)) {
        await unlink(sourceFile);
      }
    } else if (sourceFile !== targetFile) {
      if (await exists(targetFile)) {
        await unlink(sourceFile);
      } else {
        await rename(sourceFile, targetFile);
      }
      transformedAssets += 1;
    }

    hashedTargets.set(hashedName, targetFile);
    mapping.set(reference, hashedPath);
  }

  const replacements = createReplacementEntries(mapping);
  let rewrittenJsFiles = 0;

  for (const jsFile of jsFiles) {
    if (!(await exists(jsFile))) {
      continue;
    }

    if (await rewriteFileWithMapping(jsFile, replacements)) {
      rewrittenJsFiles += 1;
    }
  }

  const manifest = {};
  for (const [from, to] of mapping.entries()) {
    manifest[from] = to;
  }
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");

  if (await exists(hashedStaticRoot)) {
    await rm(hashedStaticRoot, { recursive: true, force: true });
  }
  if (await exists(staticRoot)) {
    await rename(staticRoot, hashedStaticRoot);
  }

  return {
    transformedAssets,
    htmlRewritten: false,
    rewrittenJsFiles,
    mapping,
  };
};
