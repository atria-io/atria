import type { CriticalState } from "@/runtime/critical/CriticalTypes.js";
import type { AppState } from "@/system/runtimeTypes.js";

export const resolveCriticalState = (screen: CriticalState): AppState => {
  return { realm: "critical", screen };
};
