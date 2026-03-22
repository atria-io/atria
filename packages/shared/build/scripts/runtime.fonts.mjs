import path from "node:path";
import { promises as fs } from "node:fs";

const RUNTIME_TEMPLATE_PATH = ["src", "runtime", "index.htm"];
const REQUIRED_FONT_SOURCES = [
  "static/fonts/Inter-VariableFont_opsz,wght.ttf",
  "static/fonts/Inter-Italic-VariableFont_opsz,wght.ttf"
];
const REQUIRED_FONT_FILES = [
  ["..", "admin", "src", "app", "static", "fonts", "Inter-VariableFont_opsz,wght.ttf"],
  ["..", "admin", "src", "app", "static", "fonts", "Inter-Italic-VariableFont_opsz,wght.ttf"]
];

const validateRuntimeTemplateFontSources = (runtimeTemplate) => {
  for (const fontSource of REQUIRED_FONT_SOURCES) {
    if (!runtimeTemplate.includes(fontSource)) {
      throw new Error(
        `Runtime template is missing required font source "${fontSource}".`
      );
    }
  }
};

const validateRuntimeFontFiles = async (packageRoot) => {
  for (const fontFilePath of REQUIRED_FONT_FILES) {
    const absolutePath = path.resolve(packageRoot, ...fontFilePath);
    try {
      await fs.access(absolutePath);
    } catch {
      throw new Error(`Required runtime font file is missing: ${absolutePath}`);
    }
  }
};

export const validateRuntimeFonts = async (packageRoot) => {
  const runtimeTemplatePath = path.resolve(packageRoot, ...RUNTIME_TEMPLATE_PATH);
  const runtimeTemplate = await fs.readFile(runtimeTemplatePath, "utf-8");

  validateRuntimeTemplateFontSources(runtimeTemplate);
  await validateRuntimeFontFiles(packageRoot);
};
