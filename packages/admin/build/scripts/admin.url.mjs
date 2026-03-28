import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdir, rm, cp, readFile } from "node:fs/promises";
import { writeMinifiedCss } from "./css.minify.mjs";

export const runAdminBuild = async (entryUrl) => {
  const paths = getBuildPaths(entryUrl);
  await prepareDistDirectory(paths.distDir);
  await buildSource(paths.packageRoot, paths.tscEntry);
  await copyRuntime(paths.runtimeSourceDir, paths.runtimeDistDir);
  await minifyRuntimeStyles(paths.runtimeDistDir);
};

const getBuildPaths = (entryUrl) => {
  const buildDir = path.dirname(fileURLToPath(entryUrl));
  const packageRoot = path.resolve(buildDir, "..");
  const distDir = path.join(packageRoot, "dist");
  const runtimeSourceDir = path.join(packageRoot, "studio");
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

  return { packageRoot, distDir, runtimeSourceDir, runtimeDistDir, tscEntry };
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
  const linkCssPattern = /\bsrc\s*=\s*["']([^"']+\.css(?:\?[^"']*)?)["']/gi;
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
