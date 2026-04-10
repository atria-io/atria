import path from "node:path";
import { spawn } from "node:child_process";
import { mkdir, rm, cp, readFile } from "node:fs/promises";
import { writeMinifiedCss } from "../shared/minifycss.mjs";
import { applyLazyImports } from "../runtime/react.mjs";

export const runAdminBuild = async (packageRoot) => {
  const paths = getBuildPaths(packageRoot);
  await prepareDistDirectory(paths.distDir);
  await buildSource(paths.packageRoot, paths.tscEntry);
  await applyLazyImports(paths.packageRoot);
  await bundleApp(paths.packageRoot, paths.rollupEntry, paths.reactRollupConfig);
  await copyRuntime(paths.runtimeSourceDir, paths.frontendDir);
  await bundleBoot(paths.packageRoot, paths.rollupEntry, paths.bootRollupConfig);
  await minifyRuntimeStyles(paths.frontendDir);
};

const getBuildPaths = (packageRoot) => {
  const distDir = path.join(packageRoot, "dist");
  const frontendDir = path.join(distDir, "frontend");
  const runtimeSourceDir = path.join(packageRoot, "boot");
  const tscEntry = path.resolve(
    packageRoot,
    "..",
    "..",
    "node_modules",
    "typescript",
    "bin",
    "tsc"
  );
  const rollupEntry = path.resolve(
    packageRoot,
    "node_modules",
    "rollup",
    "dist",
    "bin",
    "rollup"
  );
  const reactRollupConfig = path.join(packageRoot, "build", "scripts", "admin", "config.react.rollup.mjs");
  const bootRollupConfig = path.join(packageRoot, "build", "scripts", "admin", "config.boot.rollup.mjs");

  return {
    packageRoot,
    distDir,
    frontendDir,
    runtimeSourceDir,
    tscEntry,
    rollupEntry,
    reactRollupConfig,
    bootRollupConfig
  };
};

const prepareDistDirectory = async (distDir) => {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
};

const runNodeCommand = async (packageRoot, entry, args, errorPrefix) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry, ...args], {
      cwd: packageRoot,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${errorPrefix} failed with exit code ${code ?? 1}`));
    });

    child.on("error", reject);
  });

const buildSource = (packageRoot, tscEntry) =>
  runNodeCommand(packageRoot, tscEntry, ["-p", "tsconfig.json"], "admin build");

const bundleApp = (packageRoot, rollupEntry, rollupConfig) =>
  runNodeCommand(packageRoot, rollupEntry, ["--config", rollupConfig], "admin react rollup");

const bundleBoot = (packageRoot, rollupEntry, rollupConfig) =>
  runNodeCommand(packageRoot, rollupEntry, ["--config", rollupConfig], "admin boot rollup");

const copyRuntime = async (runtimeSourceDir, runtimeDistDir) => {
  await cp(runtimeSourceDir, runtimeDistDir, { recursive: true });
};

const minifyRuntimeStyles = async (runtimeDistDir) => {
  const styleFiles = await getRuntimeStyleFiles(runtimeDistDir);

  for (const targetFile of styleFiles) {
    await writeMinifiedCss(targetFile, targetFile);
  }
};

const getRuntimeStyleFiles = async (runtimeDistDir) => {
  const indexFile = path.join(runtimeDistDir, "index.htm");
  const html = await readFile(indexFile, "utf-8");
  const files = new Set();
  const linkCssPattern = /\b(?:href|src)\s*=\s*["']([^"']+\.css(?:\?[^"']*)?)["']/gi;
  let match;

  while ((match = linkCssPattern.exec(html)) !== null) {
    const rawPath = match[1].split("?")[0];
    const targetFile = path.resolve(runtimeDistDir, rawPath.replace(/^\/+/, ""));
    const runtimeRoot = path.resolve(runtimeDistDir);

    if (targetFile.startsWith(`${runtimeRoot}${path.sep}`)) {
      files.add(targetFile);
    }
  }

  return [...files];
};
