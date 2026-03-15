import path from "node:path";
import { promises as fs } from "node:fs";

const packageRoot = process.cwd();

const assetMappings = [
  {
    sourceDir: path.join(packageRoot, "src", "app", "styles"),
    targetDir: path.join(packageRoot, "dist", "styles")
  },
  {
    sourceDir: path.join(packageRoot, "src", "i18n", "locales"),
    targetDir: path.join(packageRoot, "dist", "locales")
  }
];

const modulesRoot = path.join(packageRoot, "src", "app", "modules");
const modulesStylesDistRoot = path.join(packageRoot, "dist", "styles", "modules");

const syncDirectory = async (sourceDir, targetDir) => {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
};

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

const syncModuleStyles = async () => {
  await fs.rm(modulesStylesDistRoot, { recursive: true, force: true });

  try {
    await fs.access(modulesRoot);
  } catch {
    return;
  }

  const styleDirs = await collectStyleDirs(modulesRoot);

  for (const styleDir of styleDirs) {
    const moduleDir = path.dirname(styleDir);
    const moduleRelativeDir = normalizePathForUrl(path.relative(modulesRoot, moduleDir));
    const entries = await fs.readdir(styleDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".css")) {
        continue;
      }

      const sourceFile = path.join(styleDir, entry.name);
      const targetRelativePath =
        entry.name === "index.css"
          ? `${moduleRelativeDir}.css`
          : normalizePathForUrl(path.join(moduleRelativeDir, entry.name));

      const targetFile = path.join(modulesStylesDistRoot, targetRelativePath);
      await fs.mkdir(path.dirname(targetFile), { recursive: true });
      await fs.copyFile(sourceFile, targetFile);
    }
  }
};

for (const mapping of assetMappings) {
  await syncDirectory(mapping.sourceDir, mapping.targetDir);
}

await syncModuleStyles();
