import { scryptSync, timingSafeEqual } from "node:crypto";
import { createSession, getUserByEmail } from "./login.db.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LENGTH = 256;

const verifyPassword = (
  storedPassword: string,
  providedPassword: string
): boolean => {
  if (!storedPassword.startsWith("scrypt$")) {
    return storedPassword === providedPassword;
  }

  const parts = storedPassword.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const salt = parts[1];
  const storedHashHex = parts[2];

  if (salt === "" || storedHashHex === "") {
    return false;
  }

  try {
    const providedHash = scryptSync(providedPassword, salt, 64);
    const storedHash = Buffer.from(storedHashHex, "hex");

    if (providedHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(providedHash, storedHash);
  } catch {
    return false;
  }
};

export const parseEmail = (
  value: unknown
): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : null;
};

export const parsePassword = (
  value: unknown
): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_PASSWORD_LENGTH) {
    return null;
  }

  return normalized;
};

export const resolveSignIn = async (
  email: string,
  password: string
): Promise<{ status: "ok"; sessionId: string } | { status: "unauthorized" }> => {
  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(user.password, password)) {
    return { status: "unauthorized" };
  }

  const session = await createSession(user.id);
  if (!session) {
    return { status: "unauthorized" };
  }

  return { status: "ok", sessionId: session.id };
};
