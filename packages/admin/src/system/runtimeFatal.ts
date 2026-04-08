import type { CriticalState } from "./runtimeTypes.js";

export const RUNTIME_FATAL_EVENT = "atria:runtime:fatal";

export interface RuntimeFatalDetail {
  state?: CriticalState;
  message?: string;
}

const readRuntimeFatalStateKind = (event: Event): CriticalState | null => {
  const detail = (event as CustomEvent<RuntimeFatalDetail | undefined>).detail;
  if (!detail || typeof detail !== "object") {
    return null;
  }

  if (detail.state === "critical" || detail.state === "offline" || detail.state === "server-down") {
    return detail.state;
  }

  return null;
};

export const getRuntimeFatalState = (event: Event): CriticalState => {
  return readRuntimeFatalStateKind(event) ?? "critical";
};
