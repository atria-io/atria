import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_DATABASE_URL = "file:./.atria/data/atria.db";

const parseEnvFile = (source) => {
  const entries = {};
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

const readProjectEnvFile = async () => {
  const envPath = path.join(process.cwd(), ".env");
  try {
    const source = await fs.readFile(envPath, "utf-8");
    return parseEnvFile(source);
  }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
};

const resolveDatabaseUrl = async () => {
  const fromProcessAtria = process.env.ATRIA_DATABASE_URL?.trim();
  if (fromProcessAtria) {
    return fromProcessAtria;
  }

  const fromProcessCompat = process.env.DATABASE_URL?.trim();
  if (fromProcessCompat) {
    return fromProcessCompat;
  }

  const envFile = await readProjectEnvFile();
  const fromFileAtria = envFile.ATRIA_DATABASE_URL?.trim();
  if (fromFileAtria) {
    return fromFileAtria;
  }

  const fromFileCompat = envFile.DATABASE_URL?.trim();
  if (fromFileCompat) {
    return fromFileCompat;
  }

  return DEFAULT_DATABASE_URL;
};

const resolveSqlitePath = (databaseUrl) => {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Invalid database URL protocol: ${databaseUrl}`);
  }

  const rawPath = databaseUrl.slice("file:".length).trim();
  if (rawPath === "") {
    throw new Error("Invalid database URL path");
  }

  return path.resolve(process.cwd(), rawPath);
};

export const ensureDatabaseFile = async () => {
  const databaseUrl = await resolveDatabaseUrl();
  if (databaseUrl === "") throw new Error("Database URL is empty");
  const sqlitePath = resolveSqlitePath(databaseUrl);
  await fs.mkdir(path.dirname(sqlitePath), { recursive: true });
  const sqlite = await import("node:sqlite");
  const database = new sqlite.DatabaseSync(sqlitePath);
  database.close();
  return true;
};

export const openDB = async () => {
  const databaseUrl = await resolveDatabaseUrl();
  if (databaseUrl === "") throw new Error("Database URL is empty");
  const sqlitePath = resolveSqlitePath(databaseUrl);
  await fs.access(sqlitePath);
  const sqlite = await import("node:sqlite");
  return new sqlite.DatabaseSync(sqlitePath);
};
