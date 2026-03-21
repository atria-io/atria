import path from "node:path";
import { promises as fs } from "node:fs";

/**
 * Filesystem existence check used by build steps that must tolerate optional sources.
 *
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
export const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Mirrors a source directory into dist after clearing previous output.
 * Missing source is treated as an empty output, not as a build failure.
 *
 * @param {string} sourceDir
 * @param {string} targetDir
 * @returns {Promise<void>}
 */
export const syncDirectory = async (sourceDir, targetDir) => {
  const exists = await pathExists(sourceDir);

  await fs.rm(targetDir, { recursive: true, force: true });

  if (!exists) {
    return;
  }

  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
};

/**
 * Mirrors one file into dist after removing stale output.
 * Missing source leaves no file at target.
 *
 * @param {string} sourceFile
 * @param {string} targetFile
 * @returns {Promise<void>}
 */
export const syncFile = async (sourceFile, targetFile) => {
  const exists = await pathExists(sourceFile);

  await fs.rm(targetFile, { force: true });

  if (!exists) {
    return;
  }

  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.copyFile(sourceFile, targetFile);
};
