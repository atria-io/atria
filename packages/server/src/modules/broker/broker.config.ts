import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BROKER_ORIGIN = "https://api.atrialabs.pt";
const DEFAULT_PROJECT_ID = "local-dev";

const toStringValue = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export const resolveBrokerOrigin = (): string => {
  const configured = toStringValue(process.env.ATRIA_BROKER_ORIGIN);
  return configured === "" ? DEFAULT_BROKER_ORIGIN : configured;
};

let cachedProjectId: string | null = null;
let hasCachedProjectId = false;

const readProjectIdFromConfigPath = async (configPath: string): Promise<string> => {
  try {
    const raw = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as { projectId?: unknown };
    return toStringValue(parsed.projectId);
  } catch {
    return "";
  }
};

const readProjectIdFromConfig = async (): Promise<string> => {
  const primary = await readProjectIdFromConfigPath(path.join(process.cwd(), "atria.config.json"));
  if (primary !== "") {
    return primary;
  }

  return readProjectIdFromConfigPath(path.join(process.cwd(), "workspace", "atria.config.json"));
};

export const resolveBrokerProjectId = async (): Promise<string> => {
  const fromEnv = toStringValue(process.env.ATRIA_PROJECT_ID);
  if (fromEnv !== "") {
    return fromEnv;
  }

  if (hasCachedProjectId) {
    return cachedProjectId ?? "";
  }

  const fromConfig = await readProjectIdFromConfig();
  cachedProjectId = fromConfig === "" ? null : fromConfig;
  hasCachedProjectId = true;
  return fromConfig === "" ? DEFAULT_PROJECT_ID : fromConfig;
};
