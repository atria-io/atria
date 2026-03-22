import { promises as fs } from "node:fs";
import path from "node:path";
import { rollup } from "rollup";
import { syncDirectory, syncFile } from "./scripts/file.system.mjs";
import appRollupConfig from "./scripts/rollup.config.mjs";
import { syncStaticStyles } from "./scripts/styles.static.mjs";
import { syncScopedStyles } from "./scripts/styles.module.mjs";
import { composeRuntimeGlobalsStyles } from "./scripts/styles.globals.mjs";

const packageRoot = process.cwd();
const staticStylesSourceRoot = path.join(packageRoot, "src", "app", "static", "styles");
const staticStylesDistRoot = path.join(packageRoot, "dist", "styles");
const modulesRoot = path.join(packageRoot, "src", "app", "modules");
const modulesStylesDistRoot = path.join(packageRoot, "dist", "styles", "modules");
const layoutStyleSourceRoot = path.join(packageRoot, "src", "app", "kernel", "layout", "style");
const globalsStyleSourceFile = path.join(staticStylesSourceRoot, "globals.css");
const criticalStyleSourceFile = path.join(modulesRoot, "critical", "styles", "critical.css");
const globalsStyleDistFile = path.join(staticStylesDistRoot, "globals.css");
const appLocalesSourceRoot = path.join(packageRoot, "src", "i18n", "locales");
const authLocalesSourceRoot = path.join(
  packageRoot,
  "src",
  "app",
  "modules",
  "auth",
  "i18n",
  "locales"
);
const localesDistRoot = path.join(packageRoot, "dist", "locales");

const isLocaleTree = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const flattenLocaleTree = (source, dictionary, filePath, prefix = "") => {
  if (!isLocaleTree(source)) {
    throw new Error(`Invalid locale dictionary: ${filePath}`);
  }

  for (const [segment, value] of Object.entries(source)) {
    const key = prefix.length > 0 ? `${prefix}.${segment}` : segment;

    if (typeof value === "string") {
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        throw new Error(`Duplicate locale key "${key}"`);
      }

      dictionary[key] = value;
      continue;
    }

    if (!isLocaleTree(value)) {
      throw new Error(`Invalid locale value "${key}" in ${filePath}`);
    }

    flattenLocaleTree(value, dictionary, filePath, key);
  }
};

const composeLocales = async (sourceRoots, distRoot) => {
  const dictionariesByLocale = new Map();

  for (const sourceRoot of sourceRoots) {
    const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }

      const localeId = entry.name.replace(/\.json$/, "");
      const filePath = path.join(sourceRoot, entry.name);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      const dictionary = dictionariesByLocale.get(localeId) ?? {};
      dictionariesByLocale.set(localeId, dictionary);
      flattenLocaleTree(parsed, dictionary, filePath);
    }
  }

  await fs.rm(distRoot, { recursive: true, force: true });
  await fs.mkdir(distRoot, { recursive: true });

  for (const [localeId, dictionary] of dictionariesByLocale.entries()) {
    const orderedDictionary = Object.fromEntries(
      Object.entries(dictionary).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    );

    await fs.writeFile(
      path.join(distRoot, `${localeId}.json`),
      `${JSON.stringify(orderedDictionary, null, 2)}\n`
    );
  }
};

const { output: appOutputOptions, ...appInputOptions } = appRollupConfig;
const appBundle = await rollup(appInputOptions);
await appBundle.write(appOutputOptions);
await appBundle.close();

await syncStaticStyles(staticStylesSourceRoot, staticStylesDistRoot);
await syncDirectory(path.join(packageRoot, "src", "app", "static", "fonts"), path.join(packageRoot, "dist", "fonts"));
await composeLocales(
  [appLocalesSourceRoot, authLocalesSourceRoot],
  localesDistRoot
);
await syncFile(path.join(packageRoot, "src", "app", "static", "favicon.ico"), path.join(packageRoot, "dist", "favicon.ico"));
await syncFile(path.join(packageRoot, "src", "app", "static", "favicon.svg"), path.join(packageRoot, "dist", "favicon.svg"));
await syncScopedStyles(modulesRoot, modulesStylesDistRoot);
await composeRuntimeGlobalsStyles({
  globalsStyleSourceFile,
  layoutStyleSourceRoot,
  criticalStyleSourceFile,
  globalsStyleDistFile
});
