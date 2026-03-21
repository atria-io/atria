import path from "node:path";
import { promises as fs } from "node:fs";
import { pathExists } from "./file.system.mjs";
import { writeMinifiedCss } from "./css.minify.mjs";

/**
 * Publishes static style assets to dist.
 * CSS files are minified; non-CSS files are copied as-is.
 *
 * @param {string} staticStylesSourceRoot
 * @param {string} staticStylesDistRoot
 * @returns {Promise<void>}
 */
export const syncStaticStyles = async (staticStylesSourceRoot, staticStylesDistRoot) => {
  const exists = await pathExists(staticStylesSourceRoot);

  await fs.rm(staticStylesDistRoot, { recursive: true, force: true });

  if (!exists) {
    return;
  }

  const walk = async (sourceDir, targetDir) => {
    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        await walk(sourcePath, targetPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (entry.name.endsWith(".css")) {
        await writeMinifiedCss(sourcePath, targetPath);
        continue;
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
    }
  };

  await walk(staticStylesSourceRoot, staticStylesDistRoot);
};
