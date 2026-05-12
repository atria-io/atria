import { createOwner, createSession, getOwnerState } from "./db.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LENGTH = 256;
const MAX_NAME_LENGTH = 80;

export const parseEmail = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : null;
};

export const parsePassword = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_PASSWORD_LENGTH) {
    return null;
  }

  return normalized;
};

const parseNamePart = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_NAME_LENGTH) {
    return null;
  }

  return normalized;
};

export const parseFirstName = parseNamePart;
export const parseLastName = parseNamePart;

export const resolveCreateOwner = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<
  | { status: "ok"; sessionId: string }
  | { status: "ready" }
  | { status: "setup" }
  | { status: "failed" }
> => {
  const ownerState = await getOwnerState();
  if (ownerState === "ready") {
    return { status: "ready" };
  }

  if (ownerState === "setup") {
    return { status: "setup" };
  }

  const ownerId = await createOwner({
    firstName,
    lastName,
    name: firstName,
    email,
    password
  });
  if (!ownerId) {
    return { status: "failed" };
  }

  const session = await createSession(ownerId);
  if (!session) {
    return { status: "failed" };
  }

  return { status: "ok", sessionId: session.id };
};
