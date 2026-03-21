import path from "node:path";
import { promises as fs } from "node:fs";
import { pathExists } from "./file.system.mjs";
import { writeMinifiedCss } from "./css.minify.mjs";

/**
 * Collects all `styles/` directories under module scope so each module can publish scoped CSS output.
 *
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
const collectStyleDirs = async (rootDir) => {
  const collected = [];

  const walk = async (currentDir) => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const entryPath = path.join(currentDir, entry.name);

      if (entry.name === "styles") {
        collected.push(entryPath);
        continue;
      }

      await walk(entryPath);
    }
  };

  await walk(rootDir);
  return collected;
};

const normalizePathForUrl = (value) => value.replace(/\\/g, "/").toLowerCase();

/**
 * Emits module styles into `dist/styles/modules` with stable lowercase URL paths.
 * `index.css` and `<module>.css` collapse to `<module>.css` to keep runtime references predictable.
 *
 * @param {string} scopeRoot
 * @param {string} scopeStylesDistRoot
 * @returns {Promise<void>}
 */
export const syncScopedStyles = async (scopeRoot, scopeStylesDistRoot) => {
  await fs.rm(scopeStylesDistRoot, { recursive: true, force: true });

  if (!(await pathExists(scopeRoot))) {
    return;
  }

  const styleDirs = await collectStyleDirs(scopeRoot);

  for (const styleDir of styleDirs) {
    const moduleDir = path.dirname(styleDir);
    const moduleRelativeDir = normalizePathForUrl(path.relative(scopeRoot, moduleDir));
    const moduleName = path.basename(moduleDir).toLowerCase();
    const entries = await fs.readdir(styleDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".css")) {
        continue;
      }

      const sourceFile = path.join(styleDir, entry.name);
      const targetRelativePath =
        entry.name === "index.css" || entry.name.toLowerCase() === `${moduleName}.css`
          ? `${moduleRelativeDir}.css`
          : normalizePathForUrl(path.join(moduleRelativeDir, entry.name));

      const targetFile = path.join(scopeStylesDistRoot, targetRelativePath);
      await writeMinifiedCss(sourceFile, targetFile);
    }
  }
};
