import { sql } from "../dml.api.js";
import { withDatabase } from "@/system/withDatabase.js";
import { toString } from "@/data/support/shared.js";
import type { AuthUser } from "../types.js";

export const getUserByEmail = async (
  email: string
): Promise<AuthUser | null> => {
  return withDatabase<AuthUser | null>(null, (db) => {
    try {
      const row = db
        .prepare(sql.user.userSelectByEmail)
        .get(email) as
          | { id?: unknown; email?: unknown; passwordHash?: unknown }
          | undefined;

      const id = toString(row?.id);
      const rowEmail = toString(row?.email);
      const passwordHash = toString(row?.passwordHash);
      if (!id || !rowEmail || !passwordHash) {
        return null;
      }

      return { id, email: rowEmail, password: passwordHash };
    } catch {
      return null;
    }
  });
};
