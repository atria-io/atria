import { promises as fs } from "node:fs";
import path from "node:path";

export type WriteStatus = "created" | "updated" | "skipped";

export const ensureDirectory = async (directoryPath: string): Promise<void> => {
  await fs.mkdir(directoryPath, { recursive: true });
};

export const writeFile = async (
  filePath: string,
  content: string,
  force = false
): Promise<WriteStatus> => {
  let existed = false;

  try {
    await fs.access(filePath);
    existed = true;
  } catch {
    existed = false;
  }

  if (existed && !force) {
    return "skipped";
  }

  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");

  return existed ? "updated" : "created";
};

