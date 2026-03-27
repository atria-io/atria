import path from "node:path";
import { promises as fs } from "node:fs";
import { minifyCss } from "./css.minify.mjs";

/**
 * Returns true if a path exists.
 *
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
const exists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Recursively collects all CSS files matching `**\/styles/*.css`.
 *
 * @param {string} root
 * @returns {Promise<string[]>}
 */
const listshellStyleFiles = async (root) => {
  if (!(await exists(root))) {
    return [];
  }

  const files = [];

  /**
   * @param {string} currentRoot
   * @returns {Promise<void>}
   */
  const walk = async (currentRoot) => {
    const entries = await fs.readdir(currentRoot, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentRoot, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "styles") {
          const styleEntries = await fs.readdir(entryPath, { withFileTypes: true });

          for (const styleEntry of styleEntries) {
            if (!styleEntry.isFile() || !styleEntry.name.endsWith(".css")) {
              continue;
            }

            files.push(path.join(entryPath, styleEntry.name));
          }

          continue;
        }

        await walk(entryPath);
      }
    }
  };

  await walk(root);

  return files.sort((left, right) => left.localeCompare(right));
};

/**
 * Produces the runtime `globals.css` bundle consumed by the host HTML.
 *
 * Order:
 * 1. static globals
 * 2. all `shell/**\/styles/*.css`
 *
 * @param {{
 *  globalsStyleSourceFile: string;
 *  shellRoot: string;
 *  globalsStyleDistFile: string;
 * }} options
 * @returns {Promise<void>}
 */
export const composeRuntimeGlobalsStyles = async (options) => {
  const {
    globalsStyleSourceFile,
    shellRoot,
    globalsStyleDistFile
  } = options;

  const shellStyleFiles = await listshellStyleFiles(shellRoot);
  const parts = [await fs.readFile(globalsStyleSourceFile, "utf-8")];

  for (const filePath of shellStyleFiles) {
    parts.push(await fs.readFile(filePath, "utf-8"));
  }

  const composedSource = parts.join("\n");
  const minified = minifyCss(composedSource, globalsStyleSourceFile);

  await fs.mkdir(path.dirname(globalsStyleDistFile), { recursive: true });
  await fs.writeFile(globalsStyleDistFile, minified, "utf-8");
};
