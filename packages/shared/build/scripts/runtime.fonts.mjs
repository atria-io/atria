import path from "node:path";
import { promises as fs } from "node:fs";

const RUNTIME_TEMPLATE_PATH = ["src", "runtime", "index.htm"];
const ADMIN_FONTS_DIRECTORY_PATH = ["..", "admin", "src", "app", "static", "fonts"];
const FONT_ROUTE_PREFIX = "static/fonts/";
const RUNTIME_FONT_SOURCE_PATTERN = /["'](static\/fonts\/[^"'?#\s]+)["']/g;

const readRuntimeTemplateFontSources = (runtimeTemplate) => {
  const fontSources = new Set();

  for (const match of runtimeTemplate.matchAll(RUNTIME_FONT_SOURCE_PATTERN)) {
    const fontSource = match[1];
    if (fontSource.startsWith(FONT_ROUTE_PREFIX)) {
      fontSources.add(fontSource);
    }
  }

  return [...fontSources];
};

const validateRuntimeTemplateFontSources = (runtimeTemplate) => {
  const fontSources = readRuntimeTemplateFontSources(runtimeTemplate);

  if (fontSources.length === 0) {
    throw new Error(`Runtime template is missing required font route "${FONT_ROUTE_PREFIX}".`);
  }

  return fontSources;
};

const validateRuntimeFontFiles = async (packageRoot, fontSources) => {
  const fontsDirectoryPath = path.resolve(packageRoot, ...ADMIN_FONTS_DIRECTORY_PATH);

  for (const fontSource of fontSources) {
    const relativeFontPath = fontSource.slice(FONT_ROUTE_PREFIX.length);
    const absolutePath = path.resolve(fontsDirectoryPath, relativeFontPath);

    if (!absolutePath.startsWith(`${fontsDirectoryPath}${path.sep}`)) {
      throw new Error(`Runtime template has invalid font source "${fontSource}".`);
    }

    try {
      await fs.access(absolutePath);
    } catch {
      throw new Error(
        `Runtime template references a missing font file "${fontSource}" ` +
          `(${absolutePath}).`
      );
    }
  }
};

export const validateRuntimeFonts = async (packageRoot) => {
  const runtimeTemplatePath = path.resolve(packageRoot, ...RUNTIME_TEMPLATE_PATH);
  const runtimeTemplate = await fs.readFile(runtimeTemplatePath, "utf-8");

  const fontSources = validateRuntimeTemplateFontSources(runtimeTemplate);
  await validateRuntimeFontFiles(packageRoot, fontSources);
};
