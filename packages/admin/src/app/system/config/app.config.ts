const DEFAULT_FRONTEND_URL = "http://localhost:3333";

let frontendUrl = DEFAULT_FRONTEND_URL;

export const setFrontendUrl = (value: unknown): void => {
  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim();
  if (normalized !== "") {
    frontendUrl = normalized;
  }
};

export const getFrontendUrl = (): string => frontendUrl;
