import type { AuthState } from "../../runtime/auth/AuthTypes.js";
import type { AppUser } from "../../runtime/studio/StudioTypes.js";

export interface BootPayload {
  state: AuthState | "authenticated";
  user?: AppUser;
}

export type BootState = BootPayload["state"];

export interface BootSnapshot {
  ok: boolean;
  payload?: unknown;
  failed?: "network";
  online?: boolean;
}

export const isBootState = (value: unknown): value is BootState => {
  return (
    value === "setup" ||
    value === "create" ||
    value === "sign-in" ||
    value === "broker-consent" ||
    value === "authenticated"
  );
};

export const isBootUser = (value: unknown): value is AppUser => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<AppUser>;
  return (
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.avatarUrl === "string" &&
    typeof user.role === "string"
  );
};
