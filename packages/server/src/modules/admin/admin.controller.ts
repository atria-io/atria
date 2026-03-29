import { promises as fs } from "node:fs";
import path from "node:path";
import type { ServerResponse } from "node:http";
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

const getAdminBootstrapState = async (): Promise<AdminBootstrapResponse> => {
  const databaseUrl = await resolveDatabaseUrl();
  if (databaseUrl === "") {
    return { state: "setup" };
  }

  return { state: "create" };
};

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const sendAdminBootstrap = async (response: ServerResponse): Promise<void> => {
  writeJson(response, 200, await getAdminBootstrapState());
};

export const sendNotFound = (response: ServerResponse): void => {
  writeJson(response, 404, { error: "Not Found" });
};
