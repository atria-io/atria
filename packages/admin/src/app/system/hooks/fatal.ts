import type { State } from "../../realms/critical/model/critical.types.js";

export interface RuntimeFatalDetail {
  state?: State;
  message?: string;
}

const state = (
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

export const fatal = (
  event: Event
): State => {
  return state(event) ?? "critical";
};
