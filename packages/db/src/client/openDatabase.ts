import { promises as fs } from "node:fs";
import path from "node:path";

export interface DatabaseLike {
  prepare: (sql: string) => { get: (...args: unknown[]) => unknown; run: (...args: unknown[]) => unknown };
  close: () => void;
}

const DEFAULT_DATABASE_URL = "file:./.atria/data/atria.db";

const parseEnvFile = (source: string): Record<string, string> => {
  const entries: Record<string, string> = {};

  for (const rawLine of source.split(/\r?\n/g)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key !== "") {
      entries[key] = value;
    }
  }

  return entries;
};

const readProjectEnvFile = async (): Promise<Record<string, string>> => {
  const envPath = path.join(process.cwd(), ".env");

  try {
    const source = await fs.readFile(envPath, "utf-8");
    return parseEnvFile(source);
  } catch {
    return {};
  }
};

const resolveDatabaseUrl = async (): Promise<string> => {
  const fromProcess = process.env.ATRIA_DATABASE_URL ?? process.env.DATABASE_URL;
  if (typeof fromProcess === "string" && fromProcess.trim() !== "") {
    return fromProcess.trim();
  }

  const envFile = await readProjectEnvFile();
  const fromFile = envFile.ATRIA_DATABASE_URL ?? envFile.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  return fromFile.trim();
};

const resolveSqlitePath = (databaseUrl: string): string | null => {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }

  const rawPath = databaseUrl.slice("file:".length).trim();
  if (rawPath === "") {
    return null;
  }

  return path.resolve(process.cwd(), rawPath);
};

const fileExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

export const openDatabase = async (): Promise<DatabaseLike | null> => {
  const databaseUrl = await resolveDatabaseUrl();
  if (databaseUrl === "") {
    return null;
  }

  const sqlitePath = resolveSqlitePath(databaseUrl);
  if (!sqlitePath) {
    return null;
  }

  if (!(await fileExists(sqlitePath))) {
    return null;
  }

  try {
    const sqlite = (await import("node:sqlite")) as {
      DatabaseSync: new (filename: string) => DatabaseLike;
    };
    return new sqlite.DatabaseSync(sqlitePath);
  } catch {
    return null;
  }
};

export const initializeDatabase = async (): Promise<boolean> => {
  const databaseUrl = await resolveDatabaseUrl();
  if (databaseUrl === "") {
    return false;
  }

  const sqlitePath = resolveSqlitePath(databaseUrl);
  if (!sqlitePath) {
    return false;
  }

  try {
    await fs.mkdir(path.dirname(sqlitePath), { recursive: true });
  } catch {
    return false;
  }

  try {
    const sqlite = (await import("node:sqlite")) as {
      DatabaseSync: new (filename: string) => DatabaseLike;
    };
    const database = new sqlite.DatabaseSync(sqlitePath);
    database.close();

    return true;
  } catch {
    return false;
  }
};
