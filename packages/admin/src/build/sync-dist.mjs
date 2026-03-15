import path from "node:path";
import { promises as fs } from "node:fs";

const packageRoot = process.cwd();

const directoryMappings = [
  {
    sourceDir: path.join(packageRoot, "src", "app", "static", "styles"),
    targetDir: path.join(packageRoot, "dist", "styles")
  },
  {
    sourceDir: path.join(packageRoot, "src", "i18n", "locales"),
    targetDir: path.join(packageRoot, "dist", "locales")
  }
];

const fileMappings = [
  {
    sourceFile: path.join(packageRoot, "src", "app", "static", "favicon.ico"),
    targetFile: path.join(packageRoot, "dist", "favicon.ico")
  }
];

const modulesRoot = path.join(packageRoot, "src", "app", "modules");
const modulesStylesDistRoot = path.join(packageRoot, "dist", "styles", "modules");

const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const syncDirectory = async (sourceDir, targetDir) => {
  const exists = await pathExists(sourceDir);

  await fs.rm(targetDir, { recursive: true, force: true });

  if (!exists) {
    return;
  }

  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
};

const syncFile = async (sourceFile, targetFile) => {
  const exists = await pathExists(sourceFile);

  await fs.rm(targetFile, { force: true });

  if (!exists) {
    return;
  }

  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.copyFile(sourceFile, targetFile);
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

  if (!(await pathExists(modulesRoot))) {
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

for (const mapping of directoryMappings) {
  await syncDirectory(mapping.sourceDir, mapping.targetDir);
}

for (const mapping of fileMappings) {
  await syncFile(mapping.sourceFile, mapping.targetFile);
}

await syncModuleStyles();
