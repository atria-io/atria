import type { AppState } from "../runtimeTypes.js";
import type { BootPayload } from "./bootAppState.js";
import { resolveAppState } from "./resolve/resolveAppState.js";

export type { BootPayload, BootSnapshot } from "./bootAppState.js";
export { resolveAppState } from "./resolve/resolveAppState.js";
export { resolveBootState } from "./resolve/resolveBootState.js";

export const getAppState = async (basePath: string): Promise<AppState> => {
  const response = await fetch("/api/state", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Api request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<BootPayload>;
  return resolveAppState(payload, basePath);
};
