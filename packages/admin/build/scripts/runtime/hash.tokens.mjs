import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { md5 } from "../../../../shared/dist/hash/md5.js";

const ENABLE_CSS_TOKEN_MD5 = true;
const TOKEN_HASH_PREFIX = "t_";

const toTokenHash = (name) => `${TOKEN_HASH_PREFIX}${md5(name).slice(0, 8)}`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const collectFiles = async (rootDir, extension) => {
  const files = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const current = queue.pop();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  return files;
};

const collectTokensFromCss = (source) => {
  const tokens = new Set();
  const declarationPattern = /--([A-Za-z0-9_-]+)\s*:/g;
  const usagePattern = /var\(\s*--([A-Za-z0-9_-]+)\s*(?:,[^)]+)?\)/g;
  let match;

  while ((match = declarationPattern.exec(source)) !== null) {
    tokens.add(match[1]);
  }

  while ((match = usagePattern.exec(source)) !== null) {
    tokens.add(match[1]);
  }

  return tokens;
};

const rewriteSourceWithTokens = (source, tokenMap) => {
  let next = source;

  for (const [fromToken, toToken] of tokenMap) {
    const pattern = new RegExp(`--${escapeRegex(fromToken)}(?![A-Za-z0-9_-])`, "g");
    next = next.replace(pattern, `--${toToken}`);
  }

  return next;
};

const rewriteSchemeTokenKeys = (source, tokenMap) => {
  let next = source;

  for (const [fromToken, toToken] of tokenMap) {
    const keyPattern = new RegExp(`([,{])\\s*"${escapeRegex(fromToken)}"\\s*:`, "g");
    next = next.replace(keyPattern, `$1"${toToken}":`);
  }

  return next;
};

export const hashCssTokens = async (packageRoot) => {
  if (!ENABLE_CSS_TOKEN_MD5) {
    return {
      enabled: false,
      mappedTokens: 0,
      cssFiles: 0,
      htmlFiles: 0,
      jsFiles: 0,
    };
  }

  const frontendDir = path.join(packageRoot, "dist", "frontend");
  const cssFiles = await collectFiles(frontendDir, ".css");
  const htmlFiles = await collectFiles(frontendDir, ".htm");
  const jsFiles = await collectFiles(frontendDir, ".js");
  const tokenNames = new Set();

  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    for (const tokenName of collectTokensFromCss(source)) {
      tokenNames.add(tokenName);
    }
  }

  const tokenMap = new Map();
  for (const tokenName of tokenNames) {
    tokenMap.set(tokenName, toTokenHash(tokenName));
  }

  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    const next = rewriteSourceWithTokens(source, tokenMap);
    if (next !== source) {
      await writeFile(cssFile, next, "utf-8");
    }
  }

  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf-8");
    const next = rewriteSourceWithTokens(source, tokenMap);
    if (next !== source) {
      await writeFile(htmlFile, next, "utf-8");
    }
  }

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");
    let next = rewriteSourceWithTokens(source, tokenMap);

    // Scheme runtime stores token names as object keys and builds --token at runtime.
    if (next.includes("STORAGE_KEY=\"atria:color-scheme\"") && next.includes("TOKENS=")) {
      next = rewriteSchemeTokenKeys(next, tokenMap);
    }

    if (next !== source) {
      await writeFile(jsFile, next, "utf-8");
    }
  }

  return {
    enabled: true,
    mappedTokens: tokenMap.size,
    cssFiles: cssFiles.length,
    htmlFiles: htmlFiles.length,
    jsFiles: jsFiles.length,
  };
};
