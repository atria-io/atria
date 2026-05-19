import type { State } from "../../realms/auth/model/auth.types.js";
import type { User } from "../../realms/studio/model/studio.types.js";

export interface BootPayload {
  state: State | "authenticated";
  user?: User;
  frontendUrl?: string;
}

export type BootState = BootPayload["state"];

export interface BootSnapshot {
  ok: boolean;
  payload?: unknown;
  failed?: "network";
  online?: boolean;
}

export const isBootState = (
  value: unknown
): value is BootState => {
  return (
    value === "setup" ||
    value === "create" ||
    value === "sign-in" ||
    value === "broker-consent" ||
    value === "authenticated"
  );
};

export const isBootUser = (
  value: unknown
): value is User => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<User>;
  return (
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.avatarUrl === "string" &&
    typeof user.role === "string"
  );
};
