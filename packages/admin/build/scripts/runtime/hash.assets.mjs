import path from "node:path";
import { mkdir, readFile, readdir, rename, rm, unlink } from "node:fs/promises";
import { collectJsFiles, exists, pruneEmptyDirectories, removeUntrackedFiles } from "../shared/fs.mjs";
import { createReplacementEntries, rewriteFileWithMapping } from "../shared/rewrite.mjs";
import { hashDirectoryName, hashFileName, isAlreadyHashedJsFile } from "../shared/hash.mjs";

const SUPPORTED_EXTENSIONS = new Set([".css", ".woff", ".woff2", ".ico", ".svg", ".js"]);
const ATTRIBUTE_PATTERN = /\b(?:href|src)\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
const STRING_LITERAL_PATTERN = /["'`]([^"'`]+)["'`]/g;
const THREE_HEX_PATTERN = /^[a-f0-9]{3}$/;

const toStaticReference = (rawValue) => {
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

const collectStaticReferencesFromHtml = (html) => {
  const references = new Set();
  let match;

  while ((match = ATTRIBUTE_PATTERN.exec(html)) !== null) {
    const value = match[1] ?? match[2];
    const normalized = toStaticReference(value);

    if (normalized) {
      references.add(normalized);
    }
  }

  return references;
};

const collectStaticReferencesFromSource = (content) => {
  const references = new Set();
  let match;

  while ((match = STRING_LITERAL_PATTERN.exec(content)) !== null) {
    const normalized = toStaticReference(match[1]);
    if (normalized) {
      references.add(normalized);
    }
  }

  return references;
};

const toPosix = (value) => value.split(path.sep).join("/");

const collectRelativeStaticJsReferences = (source, jsFile, staticRoot) => {
  const references = new Set();
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const rawSpecifier = match[1];
      if (!rawSpecifier.startsWith("./") && !rawSpecifier.startsWith("../")) {
        continue;
      }

      const specifierPath = rawSpecifier.split("?")[0].split("#")[0];
      if (path.extname(specifierPath).toLowerCase() !== ".js") {
        continue;
      }

      const absoluteTarget = path.resolve(path.dirname(jsFile), specifierPath);
      const relativeToStatic = path.relative(staticRoot, absoluteTarget);
      if (relativeToStatic.startsWith("..") || path.isAbsolute(relativeToStatic)) {
        continue;
      }

      references.add(`/static/${toPosix(relativeToStatic)}`);
    }
  }

  return references;
};

const resolveStaticRelativePath = (staticPath) =>
  staticPath
    .replace(/^\/static\//, "")
    .replace(/^\/+/, "");

const collectReferences = async (indexFile, frontendDir, staticRoot) => {
  const references = new Set();

  const indexHtml = await readFile(indexFile, "utf-8");
  for (const reference of collectStaticReferencesFromHtml(indexHtml)) {
    references.add(reference);
  }

  const jsFiles = await collectJsFiles(frontendDir);
  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");

    for (const reference of collectStaticReferencesFromSource(source)) {
      references.add(reference);
    }

    for (const reference of collectRelativeStaticJsReferences(source, jsFile, staticRoot)) {
      references.add(reference);
    }
  }

  return { references, jsFiles };
};

const relocateAssets = async (references, staticRoot, staticDirHash) => {
  const mapping = new Map();
  const keepStaticFiles = new Set();

  for (const reference of references) {
    const staticRelativePath = resolveStaticRelativePath(reference);
    const sourceFile = path.join(staticRoot, staticRelativePath);

    if (!(await exists(sourceFile))) {
      throw new Error(`Missing referenced asset: ${reference}`);
    }

    const segments = staticRelativePath.split("/").filter(Boolean);
    const fileSegment = segments[segments.length - 1];
    const directorySegments = segments.slice(0, -1);
    const hashedDirectories = directorySegments.map(hashDirectoryName);

    const extension = path.extname(fileSegment).toLowerCase();
    const content = await readFile(sourceFile);
    const hashedName = extension === ".js" && isAlreadyHashedJsFile(fileSegment)
      ? fileSegment
      : hashFileName(content, extension);

    const targetDirectory = path.join(staticRoot, ...hashedDirectories);
    const targetFile = path.join(targetDirectory, hashedName);

    await mkdir(targetDirectory, { recursive: true });

    if (sourceFile !== targetFile) {
      if (await exists(targetFile)) {
        await unlink(sourceFile);
      } else {
        await rename(sourceFile, targetFile);
      }
    }

    mapping.set(reference, `/${staticDirHash}/${[...hashedDirectories, hashedName].join("/")}`);
    keepStaticFiles.add(targetFile);
  }

  await removeUntrackedFiles(staticRoot, keepStaticFiles);
  await pruneEmptyDirectories(staticRoot);

  return mapping;
};

const rewriteRuntimeFiles = async (indexFile, jsFiles, mapping) => {
  const replacements = createReplacementEntries(mapping);

  for (const jsFile of jsFiles) {
    if (await exists(jsFile)) {
      await rewriteFileWithMapping(jsFile, replacements);
    }
  }

  await rewriteFileWithMapping(indexFile, replacements);
};

const rewriteRootAppEntry = async (frontendDir, mapping) => {
  const appEntryFile = path.join(frontendDir, "app.js");

  if (!(await exists(appEntryFile))) {
    return mapping;
  }

  const appContent = await readFile(appEntryFile);
  const appHashedName = hashFileName(appContent, ".js");
  const appTargetFile = path.join(frontendDir, appHashedName);

  if (appEntryFile !== appTargetFile) {
    if (await exists(appTargetFile)) {
      await rm(appEntryFile, { force: true });
    } else {
      await rename(appEntryFile, appTargetFile);
    }
  }

  mapping.set("/app.js", `/${appHashedName}`);
  mapping.set("app.js", `/${appHashedName}`);
  return mapping;
};

const cleanupFrontendArtifacts = async (frontendDir, activeStaticDirName) => {
  const runtimeDir = path.join(frontendDir, "runtime");
  if (await exists(runtimeDir)) {
    await rm(runtimeDir, { recursive: true, force: true });
  }

  const staticDir = path.join(frontendDir, "static");
  if (await exists(staticDir)) {
    await rm(staticDir, { recursive: true, force: true });
  }

  const assetManifest = path.join(frontendDir, "asset.manifest.json");
  if (await exists(assetManifest)) {
    await rm(assetManifest, { force: true });
  }

  const entries = await readdir(frontendDir, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(frontendDir, entry.name);

    if (entry.name === "index.htm" || entry.name === activeStaticDirName) {
      continue;
    }

    if (entry.name === ".DS_Store") {
      await rm(target, { force: true });
      continue;
    }

    if (entry.isDirectory() && THREE_HEX_PATTERN.test(entry.name) && entry.name !== activeStaticDirName) {
      await rm(target, { recursive: true, force: true });
    }
  }
};

export const hashAssets = async (packageRoot) => {
  const frontendDir = path.join(packageRoot, "dist", "frontend");
  const indexFile = path.join(frontendDir, "index.htm");
  const staticRoot = path.join(frontendDir, "static");
  const staticDirHash = hashDirectoryName("static");
  const hashedStaticRoot = path.join(frontendDir, staticDirHash);

  if (!(await exists(indexFile))) {
    throw new Error(`Missing runtime HTML: ${indexFile}`);
  }

  if (!(await exists(staticRoot))) {
    throw new Error(`Missing static root: ${staticRoot}`);
  }

  if (await exists(hashedStaticRoot)) {
    await rm(hashedStaticRoot, { recursive: true, force: true });
  }

  const { references, jsFiles } = await collectReferences(indexFile, frontendDir, staticRoot);
  const assetMapping = await relocateAssets(references, staticRoot, staticDirHash);
  const finalMapping = await rewriteRootAppEntry(frontendDir, new Map(assetMapping));

  await rewriteRuntimeFiles(indexFile, jsFiles, finalMapping);

  if (await exists(staticRoot)) {
    await rename(staticRoot, hashedStaticRoot);
  }

  await cleanupFrontendArtifacts(frontendDir, staticDirHash);

  return {
    hashedAssets: finalMapping.size,
    staticDir: staticDirHash,
  };
};
