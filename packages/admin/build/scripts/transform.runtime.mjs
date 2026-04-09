import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";

const toPosix = (value) => value.replaceAll(path.sep, "/");

const resolveLoadRuntimeImportPath = (screenFile, runtimeRoot) => {
  const relative = toPosix(path.relative(path.dirname(screenFile), path.join(runtimeRoot, "loadRuntime.js")));
  return relative.startsWith(".") ? relative : `./${relative}`;
};

const appendAfterImportBlock = (code, line) => {
  const importBlock = code.match(/^(?:import[\s\S]*?;\n)+/);

  if (!importBlock) {
    return `${line}\n${code}`;
  }

  return `${importBlock[0]}${line}\n${code.slice(importBlock[0].length)}`;
};

const ensureLoadRuntimeFile = async (runtimeRoot) => {
  const target = path.join(runtimeRoot, "loadRuntime.js");
  const content = [
    'import { createElement, lazy, Suspense } from "react";',
    "",
    "export const loadRuntime = (loader) => {",
    "  const RuntimeComponent = lazy(loader);",
    "  return (props) =>",
    "    createElement(",
    "      Suspense,",
    "      { fallback: null },",
    "      createElement(RuntimeComponent, props)",
    "    );",
    "};",
    "",
  ].join("\n");

  await writeFile(target, content, "utf-8");
};

const transformRouterFile = async (routerFile) => {
  let code = await readFile(routerFile, "utf-8");

  if (code.includes('from "./loadRuntime.js";')) {
    return;
  }

  const replacements = [
    { source: "./auth/AuthShell.js", name: "AuthShell" },
    { source: "./critical/CriticalShell.js", name: "CriticalShell" },
    { source: "./studio/StudioShell.js", name: "StudioShell" },
  ];

  let transformed = code;
  const lines = [];

  for (const item of replacements) {
    const pattern = new RegExp(
      `^import\\s*\\{\\s*${item.name}\\s*\\}\\s*from\\s*"${item.source.replaceAll("/", "\\/")}";\\n?`,
      "m"
    );

    if (pattern.test(transformed)) {
      transformed = transformed.replace(pattern, "");
      lines.push(
        `const ${item.name} = loadRuntime(() => import("${item.source}").then((m) => ({ default: m.${item.name} })));`
      );
    }
  }

  if (lines.length === 0) {
    return;
  }

  transformed = appendAfterImportBlock(transformed, 'import { loadRuntime } from "./loadRuntime.js";');
  transformed = appendAfterImportBlock(transformed, lines.join("\n"));
  await writeFile(routerFile, transformed, "utf-8");
};

const parseImportSpecifiers = (rawSpecifiers) => {
  const parts = rawSpecifiers
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const parsed = [];

  for (const part of parts) {
    const match = part.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
    if (!match) {
      return null;
    }
    const imported = match[1];
    const local = match[2] ?? match[1];
    parsed.push({ imported, local });
  }

  return parsed;
};

const isPascalCase = (name) => /^[A-Z][A-Za-z0-9_$]*$/.test(name);

const transformScreenFile = async (screenFile, runtimeRoot) => {
  let code = await readFile(screenFile, "utf-8");
  const importRegex = /^import\s+\{([^}]+)\}\s+from\s+"([^"]+)";\n?/gm;
  const matches = [...code.matchAll(importRegex)];
  const rewriteEntries = [];

  for (const match of matches) {
    const statement = match[0];
    const rawSpecifiers = match[1];
    const source = match[2];

    if (!source.startsWith("./") && !source.startsWith("../")) {
      continue;
    }

    const parsedSpecifiers = parseImportSpecifiers(rawSpecifiers);
    if (!parsedSpecifiers || parsedSpecifiers.length === 0) {
      continue;
    }

    if (!parsedSpecifiers.every((item) => isPascalCase(item.local))) {
      continue;
    }

    rewriteEntries.push({ statement, source, specifiers: parsedSpecifiers });
  }

  if (rewriteEntries.length === 0) {
    return;
  }

  const constLines = [];
  for (const entry of rewriteEntries) {
    code = code.replace(entry.statement, "");

    for (const specifier of entry.specifiers) {
      constLines.push(
        `const ${specifier.local} = loadRuntime(() => import("${entry.source}").then((m) => ({ default: m.${specifier.imported} })));`
      );
    }
  }

  const loadRuntimeImportPath = resolveLoadRuntimeImportPath(screenFile, runtimeRoot);
  const importLine = `import { loadRuntime } from "${loadRuntimeImportPath}";`;

  if (!code.includes(importLine)) {
    code = appendAfterImportBlock(code, importLine);
  }

  code = appendAfterImportBlock(code, constLines.join("\n"));
  await writeFile(screenFile, code, "utf-8");
};

const collectScreenFiles = async (runtimeRoot) => {
  const files = [];
  const queue = [runtimeRoot];

  while (queue.length > 0) {
    const current = queue.shift();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(target);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith("Screen.js")) {
        files.push(target);
      }
    }
  }

  return files;
};

export const transformRuntime = async (packageRoot) => {
  const runtimeRoot = path.join(packageRoot, "dist", "runtime");
  const routerFile = path.join(runtimeRoot, "Router.js");

  await ensureLoadRuntimeFile(runtimeRoot);
  await transformRouterFile(routerFile);

  const screenFiles = await collectScreenFiles(runtimeRoot);
  for (const screenFile of screenFiles) {
    await transformScreenFile(screenFile, runtimeRoot);
  }
};
