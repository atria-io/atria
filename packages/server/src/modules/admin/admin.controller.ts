import { promises as fs } from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AdminBootstrapResponse } from "./admin.types.js";

const parseEnvFile = (source: string): Record<string, string> => {
  const entries: Record<string, string> = {};
  const lines = source.split(/\r?\n/g);

  for (const rawLine of lines) {
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
  const fromFile = envFile.ATRIA_DATABASE_URL ?? envFile.DATABASE_URL ?? "";
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

const queryOwnerCount = (database: {
  prepare: (sql: string) => { get: (...args: unknown[]) => unknown };
}): number => {
  const statements: Array<{ sql: string; args: unknown[] }> = [
    { sql: "SELECT COUNT(*) AS count FROM atria_users WHERE role = ?", args: ["owner"] },
    { sql: "SELECT COUNT(*) AS count FROM atria_users WHERE is_owner = 1", args: [] },
  ];

  for (const statement of statements) {
    try {
      const row = database.prepare(statement.sql).get(...statement.args) as
        | { count?: number | bigint | string }
        | undefined;
      const value = row?.count;
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "bigint") {
        return Number(value);
      }
      if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    } catch {
      continue;
    }
  }

  return 0;
};

const isSqliteOwnerPresent = async (sqliteFilePath: string): Promise<"available" | "missing"> => {
  try {
    const sqlite = (await import("node:sqlite")) as {
      DatabaseSync: new (filename: string) => { prepare: (sql: string) => { get: (...args: unknown[]) => unknown }; close: () => void };
    };
    const database = new sqlite.DatabaseSync(sqliteFilePath);

    try {
      const ownerCount = queryOwnerCount(database);
      return ownerCount > 0 ? "available" : "missing";
    } finally {
      database.close();
    }
  } catch {
    return "missing";
  }
};

const hasSessionCookie = (request: IncomingMessage): boolean => {
  const rawCookie = request.headers.cookie;
  if (typeof rawCookie !== "string" || rawCookie.trim() === "") {
    return false;
  }

  const parts = rawCookie.split(";");
  for (const part of parts) {
    const cookie = part.trim();
    if (cookie === "") {
      continue;
    }

    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (name === "session" && value !== "") {
      return true;
    }
  }

  return false;
};

const getAdminBootstrapState = async (request: IncomingMessage): Promise<AdminBootstrapResponse> => {
  const databaseUrl = await resolveDatabaseUrl();
  if (databaseUrl === "") {
    return { state: "setup" };
  }

  const sqlitePath = resolveSqlitePath(databaseUrl);
  if (!sqlitePath) {
    return { state: "setup" };
  }

  if (!(await fileExists(sqlitePath))) {
    return { state: "setup" };
  }

  const ownerState = await isSqliteOwnerPresent(sqlitePath);
  if (ownerState === "missing") {
    return { state: "create" };
  }

  if (!hasSessionCookie(request)) {
    return { state: "login" };
  }

  return { state: "authenticated" };
};

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const sendAdminBootstrap = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  writeJson(response, 200, await getAdminBootstrapState(request));
};

export const sendNotFound = (response: ServerResponse): void => {
  writeJson(response, 404, { error: "Not Found" });
};
