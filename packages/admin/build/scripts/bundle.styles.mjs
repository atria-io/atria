import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { minifyCss } from "./css.minify.mjs";

export const runStyleBundle = async (entryUrl) => {
  const paths = getPaths(entryUrl);
  const shellFiles = await collectShellStyleFiles(paths.shellStylesDir);
  const files = await collectModuleStyleFiles(paths.modulesDir);
  const css = await concatCss(paths.baseFile, shellFiles, files);
  const minified = minifyCss(css);
  await writeFile(paths.outputFile, minified, "utf-8");
};

const getPaths = (entryUrl) => {
  const entryDir = path.dirname(fileURLToPath(entryUrl));
  const packageRoot =
    path.basename(entryDir) === "scripts"
      ? path.resolve(entryDir, "..", "..")
      : path.resolve(entryDir, "..");
  const modulesDir = path.join(packageRoot, "src", "modules");
  const shellStylesDir = path.join(packageRoot, "src", "app", "shell", "styles");
  const outputFile = path.join(packageRoot, "dist", "runtime", "static", "styles", "globals.css");
  const baseFile = path.join(packageRoot, "public", "static", "styles", "globals.css");

  return { modulesDir, shellStylesDir, outputFile, baseFile };
};

const collectShellStyleFiles = async (shellStylesDir) => {
  try {
    const entries = await readdir(shellStylesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
      .map((entry) => path.join(shellStylesDir, entry.name))
      .sort();
  } catch {
    return [];
  }
};

const collectModuleStyleFiles = async (dir) => {
  const out = [];
  await walk(dir, out, false);
  out.sort();
  return out;
};

const walk = async (dir, out, insideStyleDir) => {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const nextInsideStyleDir = insideStyleDir || entry.name === "style" || entry.name === "styles";
      await walk(fullPath, out, nextInsideStyleDir);
      continue;
    }

    if (insideStyleDir && entry.isFile() && fullPath.endsWith(".css")) {
      out.push(fullPath);
    }
  }
};

const concatCss = async (baseFile, shellFiles, moduleFiles) => {
  const parts = [];
  parts.push(await readFile(baseFile, "utf-8"));

  for (const file of shellFiles) {
    parts.push(await readFile(file, "utf-8"));
  }

  for (const file of moduleFiles) {
    parts.push(await readFile(file, "utf-8"));
  }

  return parts.join("\n\n");
};
