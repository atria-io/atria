import * as db from "@atria/db";
import type { BootUser } from "./types.js";

const toStringValue = (
  value: unknown
): string =>
  typeof value === "string" ? value : "";

export const getOwnerState = db.auth.getOwnerState;
export const getSessionById = db.auth.getSessionById;
export const initializeDatabase = db.initializeDatabase;

export const getBootUser = async (
  userId: string
): Promise<BootUser | null> => {
  const database = await db.openDatabase();
  if (!database) {
    return null;
  }

  try {
    const row = database
      .prepare(
        [
          "SELECT name AS name, email AS email, avatar_url AS avatarUrl, ",
          "role AS role FROM users WHERE id = ? LIMIT 1",
        ].join("")
      )
      .get(userId) as
      | {
          name?: unknown;
          email?: unknown;
          avatarUrl?: unknown;
          role?: unknown;
        }
      | undefined;

    if (!row) {
      return null;
    }

    const email = toStringValue(row.email);
    if (email === "") {
      return null;
    }

    const name = toStringValue(row.name) || email;
    const avatarUrl = toStringValue(row.avatarUrl);
    const role = toStringValue(row.role) || "owner";
    return {
      name,
      email,
      avatarUrl,
      role
    };
  } finally {
    database.close();
  }
};
