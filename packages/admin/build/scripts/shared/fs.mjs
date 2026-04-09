import path from "node:path";
import { access, readdir, rm } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

export const exists = async (target) => {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const collectJsFiles = async (rootDir) => {
  const files = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const current = queue.shift();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const target = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(target);
        continue;
      }

      if (entry.isFile() && target.endsWith(".js")) {
        files.push(target);
      }
    }
  }

  return files;
};

export const removeUntrackedFiles = async (rootDir, keepFiles) => {
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const target = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      await removeUntrackedFiles(target, keepFiles);
      continue;
    }

    if (entry.isFile() && !keepFiles.has(target)) {
      await rm(target, { force: true });
    }
  }
};

export const pruneEmptyDirectories = async (rootDir, currentDir = rootDir) => {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    await pruneEmptyDirectories(rootDir, path.join(currentDir, entry.name));
  }

  if (currentDir === rootDir) {
    return;
  }

  const nextEntries = await readdir(currentDir, { withFileTypes: true });
  if (nextEntries.length === 0) {
    await rm(currentDir, { recursive: true, force: true });
  }
};
