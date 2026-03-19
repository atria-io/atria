export type AuthMethod = "google" | "github" | "email";

/**
 * Default auth broker origin used by the runtime templates.
 */
export const DEFAULT_AUTH_BROKER_ORIGIN = "https://api.atrialabs.pt";

/**
 * Parses a user-provided auth method into a supported value.
 *
 * @param {unknown} value
 * @returns {AuthMethod | null}
 */
export const parseAuthMethod = (value: unknown): AuthMethod | null => {
  if (value === "google" || value === "github" || value === "email") {
    return value;
  }

  return null;
};
