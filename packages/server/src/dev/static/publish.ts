import { promises as fs } from "node:fs";
import path from "node:path";

export const isPublicOutputPublished = async (publicDir: string): Promise<boolean> => {
  const publicIndexPath = path.join(publicDir, "index.html");
  try {
    const indexStats = await fs.stat(publicIndexPath);
    return indexStats.isFile() || indexStats.isSymbolicLink();
  } catch {
    return false;
  }
};
