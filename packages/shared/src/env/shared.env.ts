import { promises as fs } from "node:fs";

/**
 * Returns a trimmed env value or `null` when it is empty.
 *
 * @param {string | undefined} value
 * @returns {string | null}
 */
export const cleanEnvValue = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Checks whether a connection string targets PostgreSQL.
 *
 * @param {string} value
 * @returns {boolean}
 */
export const isPostgresConnectionString = (value: string): boolean =>
  /^(postgres|postgresql):\/\//i.test(value);

/**
 * Parses a single `.env` line into a key/value pair.
 *
 * @param {string} line
 * @returns {{ key: string; value: string } | null}
 */
export const parseDotEnvLine = (line: string): { key: string; value: string } | null => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex < 1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  if (!key) {
    return null;
  }

  const quoted =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"));

  return { key, value: quoted ? rawValue.slice(1, -1) : rawValue };
};

/**
 * Loads a `.env` file into the provided environment object without overwriting existing keys.
 *
 * @param {string} envPath
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {Promise<void>}
 */
export const loadEnvFile = async (
  envPath: string,
  env: NodeJS.ProcessEnv = process.env
): Promise<void> => {
  const content = await fs.readFile(envPath, "utf-8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  });

  if (!content) {
    return;
  }

  for (const line of content.split(/\r?\n/g)) {
    const entry = parseDotEnvLine(line);
    if (entry && env[entry.key] === undefined) {
      env[entry.key] = entry.value;
    }
  }
};

/**
 * Updates a `.env` file in place, removing keys whose value is `null`.
 *
 * @param {string} envPath
 * @param {Record<string, string | null>} updates
 * @returns {Promise<void>}
 */
export const updateEnvFile = async (
  envPath: string,
  updates: Record<string, string | null>
): Promise<void> => {
  const managedKeys = new Set(Object.keys(updates));
  const content = await fs.readFile(envPath, "utf-8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });

  const seen = new Set<string>();
  const output = (content ? content.split(/\r?\n/g) : [])
    .flatMap((line) => {
      const entry = parseDotEnvLine(line);
      if (!entry || !managedKeys.has(entry.key)) {
        return [line];
      }
      if (seen.has(entry.key)) {
        return [];
      }

      seen.add(entry.key);
      const nextValue = updates[entry.key];
      return nextValue === null ? [] : [`${entry.key}=${nextValue}`];
    });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key) && value !== null) {
      output.push(`${key}=${value}`);
    }
  }

  const nextContent = output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!nextContent) {
    await fs.unlink(envPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
    return;
  }

  await fs.writeFile(envPath, `${nextContent}\n`, "utf-8");
};
