import type { AppState } from "../state/app.state.js";
import type { BootPayload } from "./boot.types.js";
import { setFrontendUrl } from "../config/app.config.js";
import { resolveAppState } from "./resolve/app.resolver.js";

export type { BootPayload, BootSnapshot } from "./boot.types.js";
export { resolveAppState } from "./resolve/app.resolver.js";
export { resolveBootState } from "./resolve/app.resolver.js";

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
