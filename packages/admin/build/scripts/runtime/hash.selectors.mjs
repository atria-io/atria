import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { md5 } from "../../../../shared/dist/hash/md5.js";

const ENABLE_SELECTOR_MD5 = true;
const HASH_LENGTH = 4;
const HASH_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const HASH_SPACE = HASH_ALPHABET.length ** HASH_LENGTH;

const RESERVED_DATA_VALUES = new Set(["true", "false"]);

const toAlphaBase = (value) => {
  let next = value % HASH_SPACE;
  let output = "";

  for (let index = 0; index < HASH_LENGTH; index += 1) {
    output = HASH_ALPHABET[next % HASH_ALPHABET.length] + output;
    next = Math.floor(next / HASH_ALPHABET.length);
  }

  return output;
};

const toStableHash = (name, usedValues) => {
  const hashHex = md5(name).slice(0, 8);
  let probe = Number.parseInt(hashHex, 16);
  let candidate = toAlphaBase(probe);

  while (usedValues.has(candidate)) {
    probe += 1;
    candidate = toAlphaBase(probe);
  }

  usedValues.add(candidate);
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

const isReservedClassToken = (value) => RESERVED_CLASS_TOKENS.has(value) || value.startsWith("aria-");

const isHashableDataAttr = (name) => name.startsWith("data-");

const isHashableDataValue = (value) => {
  if (!value || RESERVED_DATA_VALUES.has(value)) {
    return false;
  }

  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value);
};

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

const collectDataAttrsAndValuesFromCss = (source, dataAttrs, dataValues) => {
  const selectorPattern = /\[(data-[A-Za-z0-9_-]+)(?:\s*=\s*(["']?)([A-Za-z0-9_-]+)\2)?\]/g;
  let match;

  while ((match = selectorPattern.exec(source)) !== null) {
    const attr = match[1];
    const value = match[3];

    if (isHashableDataAttr(attr)) {
      dataAttrs.add(attr);
    }

    if (isHashableDataValue(value)) {
      dataValues.add(value);
    }
  }
};

const collectClassNamesFromHtml = (source) => {
  const classNames = new Set();
  const patterns = [/class\s*=\s*"([^"]*)"/g, /class\s*=\s*'([^']*)'/g];

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

const collectDataAttrsAndValuesFromHtml = (source, dataAttrs, dataValues) => {
  const attrPattern = /\b(data-[A-Za-z0-9_-]+)\b(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let match;

  while ((match = attrPattern.exec(source)) !== null) {
    const attr = match[1];
    const value = match[2] ?? match[3] ?? "";

    if (isHashableDataAttr(attr)) {
      dataAttrs.add(attr);
    }

    for (const token of value.split(/\s+/).filter(Boolean)) {
      if (isHashableDataValue(token)) {
        dataValues.add(token);
      }
    }
  }
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

const collectDataAttrsAndValuesFromJs = (source, dataAttrs, dataValues) => {
  const attrPatterns = [
    /setAttribute\s*\(\s*["'](data-[A-Za-z0-9_-]+)["']/g,
    /getAttribute\s*\(\s*["'](data-[A-Za-z0-9_-]+)["']/g,
    /removeAttribute\s*\(\s*["'](data-[A-Za-z0-9_-]+)["']/g,
    /hasAttribute\s*\(\s*["'](data-[A-Za-z0-9_-]+)["']/g,
    /querySelector(?:All)?\s*\(\s*["'][^"']*\[(data-[A-Za-z0-9_-]+)/g,
    /attributeFilter\s*:\s*\[\s*["'](data-[A-Za-z0-9_-]+)["']/g,
  ];

  for (const pattern of attrPatterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      if (isHashableDataAttr(match[1])) {
        dataAttrs.add(match[1]);
      }
    }
  }

  const objectDataAttrPattern = /["'](data-[A-Za-z0-9_-]+)["']\s*:/g;
  let objectDataAttrMatch;
  while ((objectDataAttrMatch = objectDataAttrPattern.exec(source)) !== null) {
    if (isHashableDataAttr(objectDataAttrMatch[1])) {
      dataAttrs.add(objectDataAttrMatch[1]);
    }
  }

  const valuePatterns = [
    /setAttribute\s*\(\s*["']data-[A-Za-z0-9_-]+["']\s*,\s*["']([^"']+)["']/g,
    /getAttribute\s*\(\s*["']data-[A-Za-z0-9_-]+["']\s*\)\s*[!=]==?\s*["']([^"']+)["']/g,
    /\[(?:data-[A-Za-z0-9_-]+)=(?:"|')?([A-Za-z0-9_-]+)(?:"|')?\]/g,
  ];

  for (const pattern of valuePatterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const token = match[1];
      if (isHashableDataValue(token)) {
        dataValues.add(token);
      }
    }
  }

  const objectDataValuePattern = /["']data-[A-Za-z0-9_-]+["']\s*:\s*["']([A-Za-z0-9_-]+)["']/g;
  let objectDataValueMatch;
  while ((objectDataValueMatch = objectDataValuePattern.exec(source)) !== null) {
    const token = objectDataValueMatch[1];
    if (isHashableDataValue(token)) {
      dataValues.add(token);
    }
  }

  const datasetPattern = /\bdataset\.([A-Za-z][A-Za-z0-9_]*)/g;
  let datasetMatch;
  while ((datasetMatch = datasetPattern.exec(source)) !== null) {
    const camel = datasetMatch[1];
    const kebab = camel.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`);
    const attr = `data-${kebab}`;
    if (isHashableDataAttr(attr)) {
      dataAttrs.add(attr);
    }
  }
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
      else if ((char === "," || char === "}" || char === ")" || char === "]") && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
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

const rewriteCssSource = (source, classMap, dataAttrMap, dataValueMap) => {
  let next = source;

  for (const [fromClass, toClass] of classMap) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9_-])\\.${escapeRegex(fromClass)}(?![A-Za-z0-9_-])`, "g");
    next = next.replace(pattern, `$1.${toClass}`);
  }

  for (const [fromAttr, toAttr] of dataAttrMap) {
    const pattern = new RegExp(`\\[${escapeRegex(fromAttr)}(?![A-Za-z0-9_-])`, "g");
    next = next.replace(pattern, `[${toAttr}`);
  }

  for (const [fromValue, toValue] of dataValueMap) {
    const pattern = new RegExp(`([=\\s\"'])${escapeRegex(fromValue)}(?![A-Za-z0-9_-])`, "g");
    next = next.replace(pattern, `$1${toValue}`);
  }

  return next;
};

const rewriteHtmlClassAttribute = (value, classMap) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => classMap.get(token) ?? token)
    .join(" ");

const rewriteDataAttributeValue = (value, dataValueMap) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => dataValueMap.get(token) ?? token)
    .join(" ");

const rewriteHtmlSource = (source, classMap, dataAttrMap, dataValueMap) => {
  let next = source
    .replace(/class\s*=\s*"([^"]*)"/g, (full, value) => `class="${rewriteHtmlClassAttribute(value, classMap)}"`)
    .replace(/class\s*=\s*'([^']*)'/g, (full, value) => `class='${rewriteHtmlClassAttribute(value, classMap)}'`);

  next = next.replace(/\b(data-[A-Za-z0-9_-]+)\b(\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g, (full, attr, assignment, doubleValue, singleValue) => {
    const mappedAttr = dataAttrMap.get(attr) ?? attr;

    if (!assignment) {
      return mappedAttr;
    }

    const rawValue = doubleValue ?? singleValue ?? "";
    const mappedValue = rewriteDataAttributeValue(rawValue, dataValueMap);

    if (doubleValue !== undefined) {
      return `${mappedAttr}="${mappedValue}"`;
    }

    return `${mappedAttr}='${mappedValue}'`;
  });

  return next;
};

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

const rewriteJsDataValue = (value, dataValueMap) => {
  if (!/\s/.test(value) && !dataValueMap.has(value)) {
    return value;
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => dataValueMap.get(token) ?? token)
    .join(" ");
};

const rewriteSelectorValue = (value, classMap, dataAttrMap, dataValueMap) => {
  let next = value.replace(/\.([A-Za-z_][A-Za-z0-9_-]*)/g, (full, className) => {
    const mapped = classMap.get(className);
    return mapped ? `.${mapped}` : full;
  });

  next = next.replace(/\[(data-[A-Za-z0-9_-]+)/g, (full, attr) => {
    const mapped = dataAttrMap.get(attr);
    return mapped ? `[${mapped}` : full;
  });

  next = next.replace(/\[(data-[A-Za-z0-9_-]+)\s*=\s*(["']?)([A-Za-z0-9_-]+)\2\]/g, (full, attr, quote, token) => {
    const mappedAttr = dataAttrMap.get(attr) ?? attr;
    const mappedToken = dataValueMap.get(token) ?? token;
    const q = quote ?? "";
    return `[${mappedAttr}=${q}${mappedToken}${q}]`;
  });

  return next;
};

const rewriteDatasetProperty = (source, datasetMap) =>
  source.replace(/\bdataset\.([A-Za-z][A-Za-z0-9_]*)/g, (full, prop) => {
    const mapped = datasetMap.get(prop);
    return mapped ? `dataset.${mapped}` : full;
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
      else if ((char === "," || char === "}" || char === ")" || char === "]") && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
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

const toDatasetProp = (dataAttr) => {
  const raw = dataAttr.slice(5);
  return raw.replace(/-([a-z])/g, (full, letter) => letter.toUpperCase());
};

const toDatasetMap = (dataAttrMap) => {
  const map = new Map();

  for (const [fromAttr, toAttr] of dataAttrMap) {
    map.set(toDatasetProp(fromAttr), toDatasetProp(toAttr));
  }

  return map;
};

const rewriteJsSource = (source, classMap, dataAttrMap, dataValueMap) => {
  const datasetMap = toDatasetMap(dataAttrMap);
  return rewriteDatasetProperty(
    rewriteClassNameExpressions(source, classMap)
      .replace(/(\bclassName\b\s*[:=]\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsClassValue(value, classMap)}${suffix}`)
      .replace(/(\bsetAttribute\s*\(\s*["']class["']\s*,\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsClassValue(value, classMap)}${suffix}`)
      .replace(/(\bclassList\.(?:add|remove|toggle)\s*\(\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsClassValue(value, classMap)}${suffix}`)
      .replace(/(\b(?:querySelector|querySelectorAll|closest|matches)\s*\(\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteSelectorValue(value, classMap, dataAttrMap, dataValueMap)}${suffix}`)
      .replace(/(["'])(data-[A-Za-z0-9_-]+)\1/g, (full, quote, attr) => {
        const mapped = dataAttrMap.get(attr);
        return mapped ? `${quote}${mapped}${quote}` : full;
      })
      .replace(/(["']data-[A-Za-z0-9_-]+["']\s*:\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsDataValue(value, dataValueMap)}${suffix}`)
      .replace(/(\[(?:data-[A-Za-z0-9_-]+)\s*=\s*["']?)([A-Za-z0-9_-]+)(["']?\])/g, (full, prefix, token, suffix) => `${prefix}${dataValueMap.get(token) ?? token}${suffix}`)
      .replace(/(\bsetAttribute\s*\(\s*["']data-[A-Za-z0-9_-]+["']\s*,\s*["'])([^"']*)(["'])/g, (full, prefix, value, suffix) => `${prefix}${rewriteJsDataValue(value, dataValueMap)}${suffix}`),
    datasetMap,
  );
};

export const hashSelectors = async (packageRoot) => {
  if (!ENABLE_SELECTOR_MD5) {
    return {
      enabled: false,
      cssFiles: 0,
      htmlFiles: 0,
      jsFiles: 0,
      mappedClasses: 0,
      mappedDataAttrs: 0,
      mappedDataValues: 0,
    };
  }

  const frontendDir = path.join(packageRoot, "dist", "frontend");
  const cssFiles = await collectFiles(frontendDir, ".css");
  const htmlFiles = await collectFiles(frontendDir, ".htm");
  const jsFiles = await collectFiles(frontendDir, ".js");

  const classNames = new Set();
  const dataAttrs = new Set();
  const dataValues = new Set();

  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    for (const className of collectClassNamesFromCss(source)) {
      classNames.add(className);
    }
    collectDataAttrsAndValuesFromCss(source, dataAttrs, dataValues);
  }

  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf-8");
    for (const className of collectClassNamesFromHtml(source)) {
      classNames.add(className);
    }
    collectDataAttrsAndValuesFromHtml(source, dataAttrs, dataValues);
  }

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");
    for (const className of collectClassNamesFromJs(source)) {
      classNames.add(className);
    }
    for (const className of collectClassNamesFromClassNameExpressions(source)) {
      classNames.add(className);
    }
    collectDataAttrsAndValuesFromJs(source, dataAttrs, dataValues);
  }

  const classMap = new Map();
  const usedClasses = new Set();
  for (const className of classNames) {
    if (isReservedClassToken(className)) {
      continue;
    }
    classMap.set(className, toStableHash(className, usedClasses));
  }

  const dataAttrMap = new Map();
  const usedDataAttrs = new Set(usedClasses);
  for (const dataAttr of dataAttrs) {
    dataAttrMap.set(dataAttr, `data-${toStableHash(dataAttr, usedDataAttrs)}`);
  }

  const dataValueMap = new Map();
  const usedDataValues = new Set(usedDataAttrs);
  for (const dataValue of dataValues) {
    dataValueMap.set(dataValue, toStableHash(dataValue, usedDataValues));
  }

  for (const cssFile of cssFiles) {
    const source = await readFile(cssFile, "utf-8");
    const next = rewriteCssSource(source, classMap, dataAttrMap, dataValueMap);
    if (next !== source) {
      await writeFile(cssFile, next, "utf-8");
    }
  }

  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf-8");
    const next = rewriteHtmlSource(source, classMap, dataAttrMap, dataValueMap);
    if (next !== source) {
      await writeFile(htmlFile, next, "utf-8");
    }
  }

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, "utf-8");
    const next = rewriteJsSource(source, classMap, dataAttrMap, dataValueMap);
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
    mappedDataAttrs: dataAttrMap.size,
    mappedDataValues: dataValueMap.size,
  };
};
