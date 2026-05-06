import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(packageRoot, "dist");

await runTsc(packageRoot);
await rewriteDistAliases(distDir);

function runTsc(cwd) {
  const tscEntry = path.resolve(
    cwd,
    "..",
    "..",
    "node_modules",
    "typescript",
    "bin",
    "tsc"
  );

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [tscEntry, "-p", "tsconfig.json"], {
      cwd,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`db build failed with exit code ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}

async function rewriteDistAliases(rootDir) {
  const files = await collectJsFiles(rootDir);
  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const next = rewriteAliasesForFile(filePath, source, rootDir);
    if (next !== source) {
      await writeFile(filePath, next, "utf8");
    }
  }
}

async function collectJsFiles(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

function rewriteAliasesForFile(filePath, source, distRoot) {
  const importPattern = /(["'])@\/([^"']+)\1/g;
  return source.replace(importPattern, (_full, quote, aliasPath) => {
    const target = path.join(distRoot, aliasPath);
    let relative = path.relative(path.dirname(filePath), target);
    if (!relative.startsWith(".")) {
      relative = `./${relative}`;
    }
    return `${quote}${relative.split(path.sep).join("/")}${quote}`;
  });
}
