import path from "node:path";
import { promises as fs } from "node:fs";
import { minifyCss } from "./css.minify.mjs";

const listLayoutStyleFiles = async (layoutStyleSourceRoot) =>
  (await fs.readdir(layoutStyleSourceRoot))
    .filter((entry) => entry.endsWith(".css"))
    .sort((left, right) => left.localeCompare(right));

/**
 * Produces the runtime `globals.css` bundle consumed by the host HTML.
 * Order is intentional: base globals, shell layout CSS, then critical CSS overrides.
 *
 * @param {{
 *  globalsStyleSourceFile: string;
 *  layoutStyleSourceRoot: string;
 *  criticalStyleSourceFile: string;
 *  globalsStyleDistFile: string;
 * }} options
 * @returns {Promise<void>}
 */
export const composeRuntimeGlobalsStyles = async (options) => {
  const {
    globalsStyleSourceFile,
    layoutStyleSourceRoot,
    criticalStyleSourceFile,
    globalsStyleDistFile
  } = options;
  const shellStyleSourceFiles = await listLayoutStyleFiles(layoutStyleSourceRoot);
  const composedSourceParts = [await fs.readFile(globalsStyleSourceFile, "utf-8")];

  for (const sourceFileName of shellStyleSourceFiles) {
    const sourceFile = path.join(layoutStyleSourceRoot, sourceFileName);
    composedSourceParts.push(await fs.readFile(sourceFile, "utf-8"));
  }

  composedSourceParts.push(await fs.readFile(criticalStyleSourceFile, "utf-8"));
  const composedSource = composedSourceParts.join("\n");
  const minified = minifyCss(composedSource, globalsStyleSourceFile);

  await fs.mkdir(path.dirname(globalsStyleDistFile), { recursive: true });
  await fs.writeFile(globalsStyleDistFile, minified, "utf-8");
};
