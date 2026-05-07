import type { AppState } from "../../appState.js";
import type { BootPayload } from "../bootAppState.js";
import { isBootState, isBootUser } from "../bootAppState.js";
import { resolveState as resolveAuthState } from "./auth/resolveAuthState.js";
import { resolveState as resolveStudioState } from "./studio/resolveStudioState.js";

export const resolveAppState = (
  payload: Partial<BootPayload>,
  basePath: string
): AppState => {
  if (!isBootState(payload.state)) {
    throw new Error("Invalid bootstrap state");
  }

  if (payload.state !== "authenticated") {
    return resolveAuthState(payload.state);
  }

  if (!isBootUser(payload.user)) {
    throw new Error("Invalid authenticated bootstrap payload");
  }

  return resolveStudioState(basePath, payload.user);
};
