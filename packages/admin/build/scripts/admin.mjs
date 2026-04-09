import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdir, rm, cp, readFile } from "node:fs/promises";
import { writeMinifiedCss } from "./css.minify.mjs";
import { transformRuntime } from "./runtime.load.mjs";

export const runAdminBuild = async (entryUrl) => {
  const paths = getBuildPaths(entryUrl);
  await prepareDistDirectory(paths.distDir);
  await buildSource(paths.packageRoot, paths.tscEntry);
  await transformRuntime(paths.packageRoot);
  await bundleApp(paths.packageRoot, paths.rollupEntry, paths.rollupConfig);
  await copyRuntime(paths.runtimeSourceDir, paths.runtimeDistDir);
  await minifyRuntimeStyles(paths.runtimeDistDir);
};

const getBuildPaths = (entryUrl) => {
  const buildDir = path.dirname(fileURLToPath(entryUrl));
  const packageRoot = path.resolve(buildDir, "..");
  const distDir = path.join(packageRoot, "dist");
  const runtimeSourceDir = path.join(packageRoot, "boot");
  const runtimeDistDir = path.join(distDir, "runtime");
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
  const rollupConfig = path.join(packageRoot, "build", "scripts", "rollup.config.mjs");

  return { packageRoot, distDir, runtimeSourceDir, runtimeDistDir, tscEntry, rollupEntry, rollupConfig };
};

const prepareDistDirectory = async (distDir) => {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
};

const buildSource = async (packageRoot, tscEntry) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [tscEntry, "-p", "tsconfig.json"], {
      cwd: packageRoot,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`admin build failed with exit code ${code ?? 1}`));
    });

    child.on("error", reject);
  });

const bundleApp = async (packageRoot, rollupEntry, rollupConfig) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [rollupEntry, "--config", rollupConfig], {
      cwd: packageRoot,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`admin rollup failed with exit code ${code ?? 1}`));
    });

    child.on("error", reject);
  });

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
