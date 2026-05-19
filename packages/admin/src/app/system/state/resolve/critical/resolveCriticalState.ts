import type { State } from "@/runtime/domains/critical/types.js";
import type { AppState } from "@/system/appState.js";

export const resolveState = (
  screen: State
): AppState => {
  return { realm: "critical", screen };
};
