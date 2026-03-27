/*!packages/admin/build/scripts/i18n.locales.mjs*/
import { promises as fs } from "node:fs";
import path from "node:path";

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

const getModuleLocaleRoots = async (modulesRoot) => {
  const entries = await fs.readdir(modulesRoot, { withFileTypes: true });
  const localeRoots = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const localeRoot = path.join(modulesRoot, entry.name, "i18n", "locales");

    try {
      await fs.access(localeRoot);
      localeRoots.push(localeRoot);
    } catch {}
  }

  return localeRoots;
};

/**
 * Builds flattened i18n dictionaries into `dist/locales`.
 *
 * @param {string} packageRoot
 * @returns {Promise<void>}
 */
export const syncI18nLocales = async (packageRoot) => {
  const appLocalesSourceRoot = path.join(packageRoot, "src", "i18n", "locales");
  const modulesRoot = path.join(packageRoot, "src", "app", "shell", "modules");
  const moduleLocaleRoots = await getModuleLocaleRoots(modulesRoot);
  const localesDistRoot = path.join(packageRoot, "dist", "locales");

  await composeLocales(
    [appLocalesSourceRoot, ...moduleLocaleRoots],
    localesDistRoot
  );
};
