import { promises as fs } from "node:fs";
import path from "node:path";

export type WriteStatus = "created" | "updated" | "skipped";

/**
 * Ensures a directory exists.
 *
 * @param {string} directoryPath
 * @returns {Promise<void>}
 */
export const ensureDirectory = async (directoryPath: string): Promise<void> => {
  await fs.mkdir(directoryPath, { recursive: true });
};

/**
 * Checks whether a path exists.
 *
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
export const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Writes a file, optionally keeping the existing file when `force` is false.
 *
 * @param {string} filePath
 * @param {string} content
 * @param {boolean} [force=false]
 * @returns {Promise<WriteStatus>}
 */
export const writeFile = async (
  filePath: string,
  content: string,
  force = false
): Promise<WriteStatus> => {
  const existed = await pathExists(filePath);
  if (existed && !force) {
    return "skipped";
  }

  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
  return existed ? "updated" : "created";
};
