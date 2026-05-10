import type { AppState } from "../appState.js";
import type { BootPayload } from "./bootAppState.js";
import { setFrontendUrl } from "../config/runtimeConfig.js";
import { resolveAppState } from "./resolve/resolveAppState.js";

export type { BootPayload, BootSnapshot } from "./bootAppState.js";
export { resolveAppState } from "./resolve/resolveAppState.js";
export { resolveBootState } from "./resolve/resolveBootState.js";

export const getAppState = async (
  basePath: string
): Promise<AppState> => {
  const response = await fetch("/api/state", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Api request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<BootPayload>;
  setFrontendUrl(payload.frontendUrl);
  return resolveAppState(payload, basePath);
};
