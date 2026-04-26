import type { AppState } from "../../appState.js";
import type { BootPayload, BootSnapshot } from "../bootAppState.js";
import { isBootState, isBootUser } from "../bootAppState.js";
import { resolveAppState } from "./resolveAppState.js";
import { resolveCriticalState } from "./critical/resolveCriticalState.js";

export const resolveBootState = (snapshot: BootSnapshot, basePath = "/"): AppState => {
  if (!snapshot.ok) {
    if (snapshot.failed === "network" && snapshot.online === false) {
      return resolveCriticalState("offline");
    }

    return resolveCriticalState("server-down");
  }

  const payload: Partial<BootPayload> =
    snapshot.payload && typeof snapshot.payload === "object"
      ? (snapshot.payload as Partial<BootPayload>)
      : {};

  if (!isBootState(payload.state)) {
    return resolveCriticalState("server-down");
  }

  if (payload.state === "authenticated" && !isBootUser(payload.user)) {
    return resolveCriticalState("server-down");
  }

  return resolveAppState(payload, basePath);
};
