import path from "node:path";
import { promises as fs } from "node:fs";

const SCHEME_FILE_PATH = ["..", "admin", "src", "app", "static", "styles", "scheme.css"];
const SCHEME_BLOCK_PATTERN = /\[data-scheme="(dark|light)"\]\s*\{([\s\S]*?)\}/g;
const TOKEN_PATTERN = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
const SCHEME_MAP_PLACEHOLDER = "__ATRIA_SCHEME_MAP__";
const REQUIRED_TOKENS = ["color_background", "color_foreground"];

const toTokenKey = (rawToken) => rawToken.trim().toLowerCase().replace(/-/g, "_");

const sortObject = (value) =>
  Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));

const assertRequiredTokens = (schemeName, tokens) => {
  for (const tokenName of REQUIRED_TOKENS) {
    if (!tokens[tokenName]) {
      throw new Error(`Missing token "${tokenName}" in [data-scheme="${schemeName}"]`);
    }
  }
};

const parseSchemeMap = (source) => {
  const schemeMap = Object.create(null);
  let match = SCHEME_BLOCK_PATTERN.exec(source);

  while (match) {
    const schemeName = match[1];
    const blockBody = match[2];
    const tokens = Object.create(null);

    let tokenMatch = TOKEN_PATTERN.exec(blockBody);
    while (tokenMatch) {
      tokens[toTokenKey(tokenMatch[1])] = tokenMatch[2].trim();
      tokenMatch = TOKEN_PATTERN.exec(blockBody);
    }

    TOKEN_PATTERN.lastIndex = 0;
    assertRequiredTokens(schemeName, tokens);
    schemeMap[schemeName] = sortObject(tokens);
    match = SCHEME_BLOCK_PATTERN.exec(source);
  }

  SCHEME_BLOCK_PATTERN.lastIndex = 0;

  if (!schemeMap.dark || !schemeMap.light) {
    throw new Error(`Expected both [data-scheme="dark"] and [data-scheme="light"] in scheme.css`);
  }

  return {
    dark: schemeMap.dark,
    light: schemeMap.light
  };
};

const resolveSchemeFilePath = (packageRoot) =>
  path.resolve(packageRoot, ...SCHEME_FILE_PATH);

const loadSchemeMap = async (packageRoot) => {
  const schemeFilePath = resolveSchemeFilePath(packageRoot);
  const schemeCss = await fs.readFile(schemeFilePath, "utf-8");
  return parseSchemeMap(schemeCss);
};

export const injectRuntimeSchemeMap = async (packageRoot, runtimeTemplate) => {
  if (!runtimeTemplate.includes(SCHEME_MAP_PLACEHOLDER)) {
    throw new Error(`Runtime template is missing "${SCHEME_MAP_PLACEHOLDER}" placeholder.`);
  }

  const schemeMap = await loadSchemeMap(packageRoot);
  return runtimeTemplate.replaceAll(SCHEME_MAP_PLACEHOLDER, JSON.stringify(schemeMap));
};
