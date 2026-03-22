import path from "node:path";
import { promises as fs } from "node:fs";

const PROTECTED_FUNCTION_NAMES = new Set([
  "calc",
  "translate",
  "translatex",
  "translatey",
  "translatez",
  "translate3d"
]);

const isAsciiLetter = (character) =>
  (character >= "a" && character <= "z") || (character >= "A" && character <= "Z");

const isIdentifierStart = (character) =>
  character === "-" || character === "_" || isAsciiLetter(character);

const isIdentifierContinuation = (character) =>
  isIdentifierStart(character) || (character >= "0" && character <= "9");

const stripComments = (source) => {
  let output = "";
  let quote = "";
  let escaped = false;
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1] ?? "";

    if (quote !== "") {
      output += character;

      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = "";
      }

      index += 1;
      continue;
    }

    if ((character === "\"" || character === "'") && quote === "") {
      quote = character;
      output += character;
      index += 1;
      continue;
    }

    if (character === "/" && next === "*") {
      index += 2;

      while (index < source.length) {
        if (source[index] === "*" && source[index + 1] === "/") {
          index += 2;
          break;
        }

        index += 1;
      }

      continue;
    }

    output += character;
    index += 1;
  }

  return output;
};

const protectQuotedStrings = (source) => {
  const placeholders = new Map();
  let output = "";
  let index = 0;
  let tokenIndex = 0;

  while (index < source.length) {
    const character = source[index];

    if (character !== "\"" && character !== "'") {
      output += character;
      index += 1;
      continue;
    }

    const quote = character;
    const start = index;
    let escaped = false;
    index += 1;

    while (index < source.length) {
      const current = source[index];

      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === quote) {
        index += 1;
        break;
      }

      index += 1;
    }

    const quotedValue = source.slice(start, index);
    const token = `__CSSSTR_${tokenIndex}__`;
    tokenIndex += 1;
    placeholders.set(token, quotedValue);
    output += token;
  }

  return { source: output, placeholders };
};

const protectFunctions = (source) => {
  const placeholders = new Map();
  let output = "";
  let index = 0;
  let tokenIndex = 0;

  while (index < source.length) {
    const character = source[index];

    if (!isIdentifierStart(character)) {
      output += character;
      index += 1;
      continue;
    }

    const start = index;
    let name = character;
    index += 1;

    while (index < source.length && isIdentifierContinuation(source[index])) {
      name += source[index];
      index += 1;
    }

    const functionName = name.toLowerCase();
    let lookAhead = index;

    while (lookAhead < source.length && /\s/.test(source[lookAhead])) {
      lookAhead += 1;
    }

    if (!PROTECTED_FUNCTION_NAMES.has(functionName) || source[lookAhead] !== "(") {
      output += name;
      continue;
    }

    let depth = 0;
    let cursor = lookAhead;
    let quote = "";
    let escaped = false;

    while (cursor < source.length) {
      const current = source[cursor];

      if (quote !== "") {
        if (escaped) {
          escaped = false;
        } else if (current === "\\") {
          escaped = true;
        } else if (current === quote) {
          quote = "";
        }

        cursor += 1;
        continue;
      }

      if (current === "\"" || current === "'") {
        quote = current;
        cursor += 1;
        continue;
      }

      if (current === "(") {
        depth += 1;
      } else if (current === ")") {
        depth -= 1;

        if (depth === 0) {
          cursor += 1;
          break;
        }
      }

      cursor += 1;
    }

    const functionSource = source.slice(start, cursor);
    const token = `__CSSFUNC_${tokenIndex}__`;
    tokenIndex += 1;
    placeholders.set(token, functionSource);
    output += token;
    index = cursor;
  }

  return { source: output, placeholders };
};

const minifySelectorPrefix = (source) =>
  source.replace(/([^{]+)\{/g, (match, selector) => {
    const compactSelector = selector
      .replace(/\s+/g, " ")
      .replace(/\s*([>+~])\s*/g, "$1")
      .replace(/\s*,\s*/g, ",")
      .trim();

    return `${compactSelector}{`;
  });

const restorePlaceholders = (source, placeholders) => {
  let restored = source;

  for (const [token, value] of placeholders.entries()) {
    restored = restored.split(token).join(value);
  }

  return restored;
};

export const minifyCss = (source) => {
  if (source === "") {
    return "";
  }

  const normalized = source.replace(/\r\n?/g, "\n");
  const withoutComments = stripComments(normalized);
  const { source: withoutStrings, placeholders: stringPlaceholders } =
    protectQuotedStrings(withoutComments);
  const { source: protectedSource, placeholders: functionPlaceholders } =
    protectFunctions(withoutStrings);
  const minified = minifySelectorPrefix(protectedSource)
    .replace(/[\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/([;{])\s*([A-Za-z_-][A-Za-z0-9_-]*)\s*:\s*/g, "$1$2:")
    .replace(/\s*!important\b/g, "!important")
    .replace(/;}/g, "}")
    .trim();

  if (minified === "") {
    return "";
  }

  const withFunctionsRestored = restorePlaceholders(minified, functionPlaceholders);
  return restorePlaceholders(withFunctionsRestored, stringPlaceholders);
};

export const writeMinifiedCss = async (sourceFile, targetFile) => {
  const source = await fs.readFile(sourceFile, "utf-8");
  const minified = minifyCss(source);
  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, minified, "utf-8");
};
