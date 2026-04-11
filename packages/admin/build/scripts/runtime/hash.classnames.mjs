import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { md5 } from "../../../../shared/dist/hash/md5.js";

const ENABLE_CLASSNAME_MD5 = true;
const CLASS_HASH_PREFIX = "c_";

const toClassHash = (name) => `${CLASS_HASH_PREFIX}${md5(name).slice(0, 8)}`;

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

const collectClassNamesFromCss = (source) => {
  const classNames = new Set();
  const pattern = /(^|[^A-Za-z0-9_-])\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    classNames.add(match[2]);
  }

  return classNames;
};

const collectClassNamesFromHtml = (source) => {
  const classNames = new Set();
  const patterns = [
    /class\s*=\s*"([^"]*)"/g,
    /class\s*=\s*'([^']*)'/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const value = match[1] ?? "";
      for (const token of value.split(/\s+/).filter(Boolean)) {
        classNames.add(token);
      }
    }
  }

  return classNames;
};

const collectClassNamesFromJs = (source) => {
  const classNames = new Set();
  const patterns = [
    /\bclassName\b\s*[:=]\s*["']([^"']*)["']/g,
    /\bsetAttribute\s*\(\s*["']class["']\s*,\s*["']([^"']*)["']/g,
    /\bclassList\.(?:add|remove|toggle)\s*\(\s*["']([^"']*)["']/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const value = match[1] ?? "";
      for (const token of value.split(/\s+/).filter(Boolean)) {
        classNames.add(token);
      }
    }
  }

  return classNames;
};

const rewriteCssSource = (source, classMap) => {
  let next = source;

  for (const [fromClass, toClass] of classMap) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9_-])\\.${escapeRegex(fromClass)}(?![A-Za-z0-9_-])`, "g");
    next = next.replace(pattern, `$1.${toClass}`);
  }

  return next;
};

const rewriteHtmlClassAttribute = (value, classMap) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => classMap.get(token) ?? token)
    .join(" ");

const rewriteHtmlSource = (source, classMap) =>
  source
    .replace(/class\s*=\s*"([^"]*)"/g, (full, value) => `class="${rewriteHtmlClassAttribute(value, classMap)}"`)
    .replace(/class\s*=\s*'([^']*)'/g, (full, value) => `class='${rewriteHtmlClassAttribute(value, classMap)}'`);

const rewriteJsClassValue = (value, classMap) => {
  if (!/\s/.test(value) && !classMap.has(value)) {
    return value;
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => classMap.get(token) ?? token)
    .join(" ");
};

const rewriteSelectorValue = (value, classMap) =>
  value.replace(/\.([A-Za-z_][A-Za-z0-9_-]*)/g, (full, className) => {
    const next = classMap.get(className);
    return next ? `.${next}` : full;
  });

const rewriteJsSource = (source, classMap) =>
  source
    .replace(/(\bclassName\b\s*[:=]\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsClassValue(value, classMap)}${suffix}`)
    .replace(/(\bsetAttribute\s*\(\s*["']class["']\s*,\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsClassValue(value, classMap)}${suffix}`)
    .replace(/(\bclassList\.(?:add|remove|toggle)\s*\(\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsClassValue(value, classMap)}${suffix}`)
    .replace(/(\b(?:querySelector|querySelectorAll|closest|matches)\s*\(\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteSelectorValue(value, classMap)}${suffix}`);

export const hashClassNames = async (packageRoot) => {
  if (!ENABLE_CLASSNAME_MD5) {
    return {
      enabled: false,
      cssFiles: 0,
      htmlFiles: 0,
      mappedClasses: 0,
    };
  }

  const frontendDir = path.join(packageRoot, "dist", "frontend");
  const cssFiles = await collectFiles(frontendDir, ".css");
  const htmlFiles = await collectFiles(frontendDir, ".htm");
  const jsFiles = await collectFiles(frontendDir, ".js");
  const classNames = new Set();

  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    for (const className of collectClassNamesFromCss(source)) {
      classNames.add(className);
    }
  }

  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf-8");
    for (const className of collectClassNamesFromHtml(source)) {
      classNames.add(className);
    }
  }

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");
    for (const className of collectClassNamesFromJs(source)) {
      classNames.add(className);
    }
  }

  const classMap = new Map();
  for (const className of classNames) {
    classMap.set(className, toClassHash(className));
  }

  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    const next = rewriteCssSource(source, classMap);
    if (next !== source) {
      await writeFile(cssFile, next, "utf-8");
    }
  }

  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf-8");
    const next = rewriteHtmlSource(source, classMap);
    if (next !== source) {
      await writeFile(htmlFile, next, "utf-8");
    }
  }

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");
    const next = rewriteJsSource(source, classMap);
    if (next !== source) {
      await writeFile(jsFile, next, "utf-8");
    }
  }

  return {
    enabled: true,
    cssFiles: cssFiles.length,
    htmlFiles: htmlFiles.length,
    jsFiles: jsFiles.length,
    mappedClasses: classMap.size,
  };
};
