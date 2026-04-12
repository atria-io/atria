import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { md5 } from "../../../../shared/dist/hash/md5.js";

const ENABLE_CLASSNAME_MD5 = true;
const CLASS_HASH_LENGTH = 4;
const CLASS_HASH_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const CLASS_HASH_SPACE = CLASS_HASH_ALPHABET.length ** CLASS_HASH_LENGTH;

const toAlphaClassBase = (value) => {
  let next = value % CLASS_HASH_SPACE;
  let output = "";

  for (let index = 0; index < CLASS_HASH_LENGTH; index += 1) {
    output = CLASS_HASH_ALPHABET[next % CLASS_HASH_ALPHABET.length] + output;
    next = Math.floor(next / CLASS_HASH_ALPHABET.length);
  }

  return output;
};

const toClassHash = (name, usedClasses) => {
  const hashHex = md5(name).slice(0, 8);
  let probe = Number.parseInt(hashHex, 16);
  let candidate = toAlphaClassBase(probe);

  while (usedClasses.has(candidate)) {
    probe += 1;
    candidate = toAlphaClassBase(probe);
  }

  usedClasses.add(candidate);
  return candidate;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RESERVED_CLASS_TOKENS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "role",
  "title",
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "defs",
  "symbol",
  "use",
  "mask",
  "clipPath",
  "linearGradient",
  "radialGradient",
  "stop",
  "text",
  "tspan",
  "div",
  "span",
  "button",
  "input",
  "label",
  "form",
  "main",
  "section",
  "nav",
  "aside",
  "header",
  "footer",
  "img",
  "a",
]);

const isReservedClassToken = (value) =>
  RESERVED_CLASS_TOKENS.has(value) ||
  value.startsWith("aria-");

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

const scanQuotedLiterals = (source, onValue) => {
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char !== '"' && char !== "'" && char !== "`") {
      index += 1;
      continue;
    }

    const quote = char;
    let cursor = index + 1;
    let escaped = false;
    while (cursor < source.length) {
      const next = source[cursor];
      if (escaped) {
        escaped = false;
        cursor += 1;
        continue;
      }
      if (next === "\\") {
        escaped = true;
        cursor += 1;
        continue;
      }
      if (next === quote) {
        onValue(source.slice(index + 1, cursor), index + 1, cursor);
        cursor += 1;
        break;
      }
      cursor += 1;
    }

    index = cursor;
  }
};

const collectClassNamesFromClassNameExpressions = (source) => {
  const classNames = new Set();
  const marker = "className:";
  let index = 0;

  while (index < source.length) {
    const start = source.indexOf(marker, index);
    if (start === -1) {
      break;
    }

    let cursor = start + marker.length;
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let quote = "";
    let escaped = false;

    while (cursor < source.length) {
      const char = source[cursor];
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = "";
        }
        cursor += 1;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        quote = char;
        cursor += 1;
        continue;
      }

      if (char === "(") parenDepth += 1;
      else if (char === ")") parenDepth = Math.max(parenDepth - 1, 0);
      else if (char === "{") braceDepth += 1;
      else if (char === "}") braceDepth = Math.max(braceDepth - 1, 0);
      else if (char === "[") bracketDepth += 1;
      else if (char === "]") bracketDepth = Math.max(bracketDepth - 1, 0);
      else if (
        (char === "," || char === "}" || char === ")" || char === "]") &&
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0
      ) {
        break;
      }

      cursor += 1;
    }

    const expression = source.slice(start + marker.length, cursor);
    scanQuotedLiterals(expression, (value) => {
      for (const token of value.split(/\s+/).filter(Boolean)) {
        if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(token)) {
          classNames.add(token);
        }
      }
    });

    index = cursor + 1;
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

const rewriteClassNameExpression = (expression, classMap) => {
  let output = "";
  let cursor = 0;

  scanQuotedLiterals(expression, (value, start, end) => {
    output += expression.slice(cursor, start);
    output += rewriteJsClassValue(value, classMap);
    cursor = end;
  });

  output += expression.slice(cursor);
  return output;
};

const rewriteClassNameExpressions = (source, classMap) => {
  const marker = "className:";
  let output = "";
  let index = 0;

  while (index < source.length) {
    const start = source.indexOf(marker, index);
    if (start === -1) {
      output += source.slice(index);
      break;
    }

    output += source.slice(index, start + marker.length);

    let cursor = start + marker.length;
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let quote = "";
    let escaped = false;

    while (cursor < source.length) {
      const char = source[cursor];
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = "";
        }
        cursor += 1;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        quote = char;
        cursor += 1;
        continue;
      }

      if (char === "(") parenDepth += 1;
      else if (char === ")") parenDepth = Math.max(parenDepth - 1, 0);
      else if (char === "{") braceDepth += 1;
      else if (char === "}") braceDepth = Math.max(braceDepth - 1, 0);
      else if (char === "[") bracketDepth += 1;
      else if (char === "]") bracketDepth = Math.max(bracketDepth - 1, 0);
      else if (
        (char === "," || char === "}" || char === ")" || char === "]") &&
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0
      ) {
        break;
      }

      cursor += 1;
    }

    const expression = source.slice(start + marker.length, cursor);
    output += rewriteClassNameExpression(expression, classMap);
    if (cursor < source.length && source[cursor] === ",") {
      output += ",";
      cursor += 1;
    }

    index = cursor;
  }

  return output;
};

const rewriteJsSource = (source, classMap) =>
  rewriteClassNameExpressions(source, classMap)
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
    for (const className of collectClassNamesFromClassNameExpressions(source)) {
      classNames.add(className);
    }
  }

  const classMap = new Map();
  const usedClasses = new Set();
  for (const className of classNames) {
    if (isReservedClassToken(className)) {
      continue;
    }
    classMap.set(className, toClassHash(className, usedClasses));
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
