import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";

const PROJECT_DISCOVERY_IGNORED_DIRS = new Set(["node_modules", ".git", ".pnpm-store"]);

export interface ExistingProjectEntry {
  configProjectName: string;
  projectRoot: string;
}

const readJsonFile = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const detectExistingProjectAt = async (
  projectRoot: string,
  configFile: string
): Promise<ExistingProjectEntry | null> => {
  const configPath = path.join(projectRoot, configFile);
  const config = await readJsonFile<{ name?: unknown }>(configPath);

  if (!config || typeof config.name !== "string") {
    return null;
  }

  const configProjectName = config.name.trim();
  if (!configProjectName) {
    return null;
  }

  return {
    configProjectName,
    projectRoot
  };
};

export const discoverExistingProjects = async (
  baseDir: string,
  configFile: string
): Promise<ExistingProjectEntry[]> => {
  const projectsByRoot = new Map<string, ExistingProjectEntry>();

  const collectProject = async (candidateRoot: string): Promise<void> => {
    const resolvedRoot = path.resolve(candidateRoot);
    if (projectsByRoot.has(resolvedRoot)) {
      return;
    }

    const detectedProject = await detectExistingProjectAt(resolvedRoot, configFile);
    if (!detectedProject) {
      return;
    }

    projectsByRoot.set(resolvedRoot, detectedProject);
  };

  await collectProject(baseDir);

  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(baseDir, { withFileTypes: true });
  } catch {
    entries = [];
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith(".") || PROJECT_DISCOVERY_IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    await collectProject(path.join(baseDir, entry.name));
  }

  return Array.from(projectsByRoot.values()).sort((left, right) =>
    left.projectRoot.localeCompare(right.projectRoot)
  );
};
