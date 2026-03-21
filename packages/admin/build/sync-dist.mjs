import path from "node:path";
import { promises as fs } from "node:fs";
import { transform } from "lightningcss";

const packageRoot = process.cwd();
const staticStylesSourceRoot = path.join(packageRoot, "src", "app", "static", "styles");
const staticStylesDistRoot = path.join(packageRoot, "dist", "styles");

const directoryMappings = [
  {
    sourceDir: path.join(packageRoot, "src", "i18n", "locales"),
    targetDir: path.join(packageRoot, "dist", "locales")
  }
];

const fileMappings = [
  {
    sourceFile: path.join(packageRoot, "src", "app", "static", "favicon.ico"),
    targetFile: path.join(packageRoot, "dist", "favicon.ico")
  },
  {
    sourceFile: path.join(packageRoot, "src", "app", "static", "favicon.svg"),
    targetFile: path.join(packageRoot, "dist", "favicon.svg")
  }
];

const modulesRoot = path.join(packageRoot, "src", "app", "modules");
const modulesStylesDistRoot = path.join(packageRoot, "dist", "styles", "modules");
const kernelRoot = path.join(packageRoot, "src", "app", "kernel");
const layoutStyleSourceRoot = path.join(kernelRoot, "layout", "style");
const adminShellBundleSourceFiles = [
  "admin-shell.css",
  "admin-shell_header.css",
  "admin-shell_header-menu.css",
  "admin-shell_main.css"
];
const adminShellBundleDistFile = path.join(packageRoot, "dist", "styles", "admin-shell.bundle.css");

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

const minifyCss = (source, filename) => {
  const { code } = transform({
    filename,
    code: Buffer.from(source),
    minify: true
  });

  return Buffer.from(code).toString("utf-8");
};

const writeMinifiedCss = async (sourceFile, targetFile) => {
  const source = await fs.readFile(sourceFile, "utf-8");
  const minified = minifyCss(source, sourceFile);
  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, minified, "utf-8");
};

const syncStaticStyles = async () => {
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

const syncScopedStyles = async (scopeRoot, scopeStylesDistRoot) => {
  await fs.rm(scopeStylesDistRoot, { recursive: true, force: true });

  if (!(await pathExists(scopeRoot))) {
    return;
  }

  const styleDirs = await collectStyleDirs(scopeRoot);

  for (const styleDir of styleDirs) {
    const moduleDir = path.dirname(styleDir);
    const moduleRelativeDir = normalizePathForUrl(path.relative(scopeRoot, moduleDir));
    const moduleName = path.basename(moduleDir).toLowerCase();
    const entries = await fs.readdir(styleDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".css")) {
        continue;
      }

      const sourceFile = path.join(styleDir, entry.name);
      const targetRelativePath =
        entry.name === "index.css" || entry.name.toLowerCase() === `${moduleName}.css`
          ? `${moduleRelativeDir}.css`
          : normalizePathForUrl(path.join(moduleRelativeDir, entry.name));

      const targetFile = path.join(scopeStylesDistRoot, targetRelativePath);
      await writeMinifiedCss(sourceFile, targetFile);
    }
  }
};

const syncAdminShellBundleStyles = async () => {
  await fs.rm(adminShellBundleDistFile, { force: true });

  if (!(await pathExists(layoutStyleSourceRoot))) {
    return;
  }

  const bundledSourceParts = [];

  for (const sourceFileName of adminShellBundleSourceFiles) {
    const sourceFile = path.join(layoutStyleSourceRoot, sourceFileName);
    bundledSourceParts.push(await fs.readFile(sourceFile, "utf-8"));
  }

  const bundledSource = bundledSourceParts.join("\n");
  const minified = minifyCss(
    bundledSource,
    path.join(layoutStyleSourceRoot, adminShellBundleSourceFiles[0])
  );

  await fs.mkdir(path.dirname(adminShellBundleDistFile), { recursive: true });
  await fs.writeFile(adminShellBundleDistFile, minified, "utf-8");
};

await syncStaticStyles();

for (const mapping of directoryMappings) {
  await syncDirectory(mapping.sourceDir, mapping.targetDir);
}

for (const mapping of fileMappings) {
  await syncFile(mapping.sourceFile, mapping.targetFile);
}

await syncScopedStyles(modulesRoot, modulesStylesDistRoot);
await syncAdminShellBundleStyles();
