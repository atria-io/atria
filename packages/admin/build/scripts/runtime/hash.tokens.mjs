import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { md5 } from "../../../../shared/dist/hash/md5.js";

const ENABLE_CSS_TOKEN_MD5 = true;
const TOKEN_HASH_LENGTH = 4;
const TOKEN_HASH_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const TOKEN_HASH_SPACE = TOKEN_HASH_ALPHABET.length ** TOKEN_HASH_LENGTH;

const toAlphaTokenBase = (value) => {
  let next = value % TOKEN_HASH_SPACE;
  let output = "";

  for (let index = 0; index < TOKEN_HASH_LENGTH; index += 1) {
    output = TOKEN_HASH_ALPHABET[next % TOKEN_HASH_ALPHABET.length] + output;
    next = Math.floor(next / TOKEN_HASH_ALPHABET.length);
  }

  return output;
};

const toTokenHash = (name, usedTokens) => {
  const hashHex = md5(name).slice(0, 8);
  let probe = Number.parseInt(hashHex, 16);
  let candidate = toAlphaTokenBase(probe);

  while (usedTokens.has(candidate)) {
    probe += 1;
    candidate = toAlphaTokenBase(probe);
  }

  usedTokens.add(candidate);
  return candidate;
};

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

const collectAnimationNamesFromCss = (source) => {
  const animationNames = new Set();
  const keyframesPattern = /@keyframes\s+([A-Za-z_][A-Za-z0-9_-]*)/g;
  let match;

  while ((match = keyframesPattern.exec(source)) !== null) {
    animationNames.add(match[1]);
  }

  return animationNames;
};

const rewriteSourceWithTokens = (source, tokenMap) => {
  let next = source;

  for (const [fromToken, toToken] of tokenMap) {
    const pattern = new RegExp(`--${escapeRegex(fromToken)}(?![A-Za-z0-9_-])`, "g");
    next = next.replace(pattern, `--${toToken}`);
  }

  return next;
};

const rewriteSourceWithAnimationNames = (source, animationMap) => {
  let next = source;

  for (const [fromName, toName] of animationMap) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9_-])(${escapeRegex(fromName)})(?![A-Za-z0-9_-])`, "g");
    next = next.replace(pattern, `$1${toName}`);
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
      mappedAnimationNames: 0,
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
  const usedTokens = new Set();
  for (const tokenName of tokenNames) {
    tokenMap.set(tokenName, toTokenHash(tokenName, usedTokens));
  }

  const animationNames = new Set();
  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    for (const animationName of collectAnimationNamesFromCss(source)) {
      animationNames.add(animationName);
    }
  }

  const animationMap = new Map();
  const usedAnimationNames = new Set();
  for (const animationName of animationNames) {
    animationMap.set(animationName, toTokenHash(animationName, usedAnimationNames));
  }

  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    let next = rewriteSourceWithTokens(source, tokenMap);
    next = rewriteSourceWithAnimationNames(next, animationMap);
    if (next !== source) {
      await writeFile(cssFile, next, "utf-8");
    }
  }

  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf-8");
    let next = rewriteSourceWithTokens(source, tokenMap);
    next = rewriteSourceWithAnimationNames(next, animationMap);
    if (next !== source) {
      await writeFile(htmlFile, next, "utf-8");
    }
  }

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");
    let next = rewriteSourceWithTokens(source, tokenMap);
    next = rewriteSourceWithAnimationNames(next, animationMap);

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
    mappedAnimationNames: animationMap.size,
    cssFiles: cssFiles.length,
    htmlFiles: htmlFiles.length,
    jsFiles: jsFiles.length,
  };
};
