import { mkdir, rm, cp } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  const stylesDir = path.join(runtimeDistDir, "static", "styles");
  const styleFiles = ["tokens.css", "scheme.css", "globals.css"];

  for (const filename of styleFiles) {
    const targetFile = path.join(stylesDir, filename);
    await writeMinifiedCss(targetFile, targetFile);
  }
};
