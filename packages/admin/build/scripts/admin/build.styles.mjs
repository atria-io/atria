import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { minifyCss } from "../shared/minifycss.mjs";

export const runStyleBundle = async (packageRoot) => {
  const paths = getPaths(packageRoot);
  const componentFiles = await collectModuleStyleFiles(paths.componentsDir);
  const runtimeFiles = await collectModuleStyleFiles(paths.modulesDir);
  const css = await concatCss(paths.baseFiles, [...componentFiles, ...runtimeFiles]);
  const minified = minifyCss(css);
  await writeFile(paths.outputFile, minified, "utf-8");
};

const getPaths = (packageRoot) => {
  const modulesDir = path.join(packageRoot, "src", "app", "realms");
  const componentsDir = path.join(packageRoot, "..", "ui", "src", "css");
  const outputFile = path.join(packageRoot, "dist", "frontend", "static", "styles", "globals.css");
  const baseFiles = [
    path.join(packageRoot, "src", "boot", "static", "styles", "globals.css"),
    path.join(packageRoot, "src", "boot", "static", "styles", "admin.css")
  ];

  return { modulesDir, componentsDir, outputFile, baseFiles };
};

const collectModuleStyleFiles = async (dir) => {
  const out = [];
  await walk(dir, out);
  out.sort();
  return out;
};

const walk = async (dir, out) => {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath, out);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".css")) {
      out.push(fullPath);
    }
  }
};

const concatCss = async (baseFiles, runtimeFiles) => {
  const parts = [];
  for (const baseFile of baseFiles) {
    parts.push(await readFile(baseFile, "utf-8"));
  }

  for (const file of runtimeFiles) {
    parts.push(await readFile(file, "utf-8"));
  }

  return parts.join("\n\n");
};
