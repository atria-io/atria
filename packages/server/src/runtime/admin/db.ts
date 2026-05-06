import * as db from "@atria/db";
import type { BootUser } from "./types.js";

const toStringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const getOwnerState = db.auth.getOwnerState;
export const getSessionById = db.auth.getSessionById;
export const initializeDatabase = db.initializeDatabase;

export const getBootUser = async (userId: string): Promise<BootUser | null> => {
  const database = await db.openDatabase();
  if (!database) {
    return null;
  }

  try {
    const statements = [
      [
        "SELECT name AS name, email AS email, avatar_url AS avatarUrl, ",
        "role AS role FROM users WHERE id = ? LIMIT 1",
      ].join(""),
      [
        "SELECT name AS name, email AS email, avatarUrl AS avatarUrl, ",
        "role AS role FROM users WHERE id = ? LIMIT 1",
      ].join(""),
      "SELECT email AS email, role AS role FROM users WHERE id = ? LIMIT 1",
    ];

    for (const sql of statements) {
      try {
        const row = database.prepare(sql).get(userId) as
          | {
              name?: unknown;
              email?: unknown;
              avatarUrl?: unknown;
              role?: unknown;
            }
          | undefined;
        if (!row) {
          continue;
        }

        const email = toStringValue(row.email);
        if (email === "") {
          continue;
        }

        const name = toStringValue(row.name) || email;
        const avatarUrl = toStringValue(row.avatarUrl);
        const role = toStringValue(row.role) || "owner";
        return { name, email, avatarUrl, role };
      } catch {
        continue;
      }
    }

    return null;
  } finally {
    database.close();
  }
};
