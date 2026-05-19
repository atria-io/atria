import type { State } from "../../runtime/domains/critical/types.js";

export interface RuntimeFatalDetail {
  state?: State;
  message?: string;
}

const readRuntimeFatalStateKind = (
  event: Event
): State | null => {
  const detail = (event as CustomEvent<RuntimeFatalDetail | undefined>).detail;
  if (!detail || typeof detail !== "object") {
    return null;
  }

  if (
    detail.state === "critical" ||
    detail.state === "offline" ||
    detail.state === "server-down"
  ) {
    return detail.state;
  }

  return null;
};

export const getRuntimeFatalState = (
  event: Event
): State => {
  return readRuntimeFatalStateKind(event) ?? "critical";
};
