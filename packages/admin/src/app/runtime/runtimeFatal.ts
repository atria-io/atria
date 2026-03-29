import type { CriticalScreen } from "./runtimeTypes.js";

export const RUNTIME_FATAL_EVENT = "atria:runtime:fatal";

export interface RuntimeFatalDetail {
  state?: CriticalScreen["kind"];
  message?: string;
}

const readRuntimeFatalStateKind = (event: Event): CriticalScreen["kind"] | null => {
  const detail = (event as CustomEvent<RuntimeFatalDetail | undefined>).detail;
  if (!detail || typeof detail !== "object") {
    return null;
  }

  if (detail.state === "critical" || detail.state === "offline" || detail.state === "server-down") {
    return detail.state;
  }

  return null;
};

const readRuntimeFatalMessage = (event: Event): string | null => {
  const detail = (event as CustomEvent<RuntimeFatalDetail | undefined>).detail;
  if (!detail || typeof detail !== "object") {
    return null;
  }

  return typeof detail.message === "string" && detail.message.trim() !== "" ? detail.message : null;
};

export const getRuntimeFatalState = (event: Event): CriticalScreen => {
  const kind = readRuntimeFatalStateKind(event) ?? "critical";
  if (kind === "offline") {
    return { kind: "offline" };
  }

  if (kind === "server-down") {
    return { kind: "server-down" };
  }

  return {
    kind: "critical",
    message: readRuntimeFatalMessage(event) ?? "Runtime failed. Retry to continue.",
  };
};
