export type AuthMethod = "google" | "github" | "email";

export const DEFAULT_AUTH_BROKER_ORIGIN = "https://api.atrialabs.pt";

export const parseAuthMethod = (value: unknown): AuthMethod | null => {
  if (value === "google" || value === "github" || value === "email") {
    return value;
  }

  return null;
};
