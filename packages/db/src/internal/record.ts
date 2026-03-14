import type { DatabaseSession, DatabaseUser, DatabaseUserWithPassword } from "../database.js";

export const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const normalizeNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const recordToUser = (row: Record<string, unknown>): DatabaseUser | null => {
  const id = row.id;
  const createdAt = row.created_at;
  const updatedAt = row.updated_at;

  if (
    typeof id !== "string" ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id,
    email: normalizeNullableString(row.email),
    name: normalizeNullableString(row.name),
    avatarUrl: normalizeNullableString(row.avatar_url),
    createdAt,
    updatedAt
  };
};

export const rowToUser = (rowValue: unknown): DatabaseUser | null => {
  const row = asRecord(rowValue);
  if (!row) {
    return null;
  }

  return recordToUser(row);
};

export const rowToUserWithPassword = (rowValue: unknown): DatabaseUserWithPassword | null => {
  const row = asRecord(rowValue);
  if (!row) {
    return null;
  }

  const user = recordToUser(row);
  const passwordHash = row.password_hash;

  if (!user || typeof passwordHash !== "string") {
    return null;
  }

  return {
    user,
    passwordHash
  };
};

export const rowToSession = (rowValue: unknown): DatabaseSession | null => {
  const row = asRecord(rowValue);
  if (!row) {
    return null;
  }

  const id = row.id;
  const userId = row.user_id;
  const createdAt = row.created_at;
  const expiresAt = row.expires_at;

  if (
    typeof id !== "string" ||
    typeof userId !== "string" ||
    typeof createdAt !== "string" ||
    typeof expiresAt !== "string"
  ) {
    return null;
  }

  return {
    id,
    userId,
    createdAt,
    expiresAt
  };
};
