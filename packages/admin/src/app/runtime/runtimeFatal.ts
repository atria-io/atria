import type { CriticalScreen } from "./runtimeTypes.js";

export const RUNTIME_FATAL_EVENT = "atria:runtime:fatal";

export interface RuntimeFatalDetail {
  state?: CriticalScreen;
  message?: string;
}

const readRuntimeFatalStateKind = (event: Event): CriticalScreen | null => {
  const detail = (event as CustomEvent<RuntimeFatalDetail | undefined>).detail;
  if (!detail || typeof detail !== "object") {
    return null;
  }

  if (detail.state === "critical" || detail.state === "offline" || detail.state === "server-down") {
    return detail.state;
  }

  return null;
};

export const getRuntimeFatalState = (event: Event): CriticalScreen => {
  return readRuntimeFatalStateKind(event) ?? "critical";
};
