import { sql } from "../../dml.api.js";
import { withDatabase } from "@/system/withDatabase.js";
import { toString } from "@/data/support/shared.js";
import type { AuthOAuthProvider } from "../../types.js";

export const getProviderUserId = async (
  provider: AuthOAuthProvider
): Promise<string | null> => {
  return withDatabase<string | null>(null, (db) => {
    try {
      const row = db
        .prepare(sql.identity.selectUserIdByProvider)
        .get(provider) as
          | { userId?: unknown }
          | undefined;
      return toString(row?.userId);
    } catch {
      return null;
    }
  });
};
