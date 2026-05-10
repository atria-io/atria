import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_FRONTEND_URL = "http://localhost:4444";
let cachedFrontendUrl: string | null = null;

const parseEnvFile = (source: string): Record<string, string> => {
  const env: Record<string, string> = {};
  for (const rawLine of source.split(/\r?\n/g)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key !== "") env[key] = value;
  }
  return env;
};

const readProjectEnv = async (): Promise<Record<string, string>> => {
  try {
    const source = await fs.readFile(path.join(process.cwd(), ".env"), "utf-8");
    return parseEnvFile(source);
  } catch {
    return {};
  }
};

export const resolveFrontendUrl = async (): Promise<string> => {
  if (cachedFrontendUrl) {
    return cachedFrontendUrl;
  }

  const fromProcess = process.env.ATRIA_FRONTEND_URL?.trim();
  if (fromProcess) {
    cachedFrontendUrl = fromProcess;
    return fromProcess;
  }

  const env = await readProjectEnv();
  const fromEnv = env.ATRIA_FRONTEND_URL?.trim();
  if (fromEnv) {
    cachedFrontendUrl = fromEnv;
    return fromEnv;
  }

  cachedFrontendUrl = DEFAULT_FRONTEND_URL;
  return DEFAULT_FRONTEND_URL;
};
