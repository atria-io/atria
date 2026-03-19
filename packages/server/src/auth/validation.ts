const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 256;
const MAX_NAME_LENGTH = 120;

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

const parseEmail = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
};

const parsePassword = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const password = value.trim();
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return null;
  }

  return password;
};

const parseName = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.slice(0, MAX_NAME_LENGTH);
};

const readCredentials = (
  payload: unknown
): ValidationResult<{ data: Record<string, unknown>; email: string; password: string }> => {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, error: "Invalid request payload." };
  }

  const data = payload as Record<string, unknown>;
  const email = parseEmail(data.email);
  if (!email) {
    return { ok: false, error: "A valid email is required." };
  }

  const password = parsePassword(data.password);
  if (!password) {
    return { ok: false, error: "Password must have at least 8 characters." };
  }

  return { ok: true, value: { data, email, password } };
};

export const validateRegisterCredentials = (
  payload: unknown
): ValidationResult<RegisterCredentials> => {
  const result = readCredentials(payload);
  return result.ok
    ? {
        ok: true,
        value: {
          email: result.value.email,
          password: result.value.password,
          name: parseName(result.value.data.name)
        }
      }
    : result;
};

export const validateLoginCredentials = (payload: unknown): ValidationResult<LoginCredentials> => {
  const result = readCredentials(payload);
  return result.ok
    ? { ok: true, value: { email: result.value.email, password: result.value.password } }
    : result;
};
