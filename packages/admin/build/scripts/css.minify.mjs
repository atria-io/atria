import path from "node:path";
import { promises as fs } from "node:fs";
import { transform } from "lightningcss";

/**
 * Build-time CSS minifier wrapper around lightningcss.
 *
 * @param {string} source
 * @param {string} filename
 * @returns {string}
 */
export const minifyCss = (source, filename) => {
  const { code } = transform({
    filename,
    code: Buffer.from(source),
    minify: true
  });

  return Buffer.from(code).toString("utf-8");
};

/**
 * Reads source CSS, writes minified output and ensures destination directory exists.
 *
 * @param {string} sourceFile
 * @param {string} targetFile
 * @returns {Promise<void>}
 */
export const writeMinifiedCss = async (sourceFile, targetFile) => {
  const source = await fs.readFile(sourceFile, "utf-8");
  const minified = minifyCss(source, sourceFile);
  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, minified, "utf-8");
};
