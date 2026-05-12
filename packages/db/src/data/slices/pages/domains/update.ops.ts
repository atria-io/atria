import { withDatabase } from "@/system/withDatabase.js";
import { getTimestamp } from "@/data/support/shared.js";
import { sql } from "../dml.api.js";
import { toPageRecord } from "../shared.js";
import type { PageRecord, UpdatePageInput } from "../types.js";

export const updatePage = async (input: UpdatePageInput): Promise<PageRecord | null> => {
  return withDatabase<PageRecord | null>(null, (db) => {
    const now = getTimestamp();

    try {
      const result = db.prepare(sql.update.updatePageTitle).run(
        input.status,
        input.title,
        input.slug,
        input.status,
        now,
        now,
        input.id
      ) as { changes?: unknown };
      if ((typeof result?.changes === "number" ? result.changes : 0) < 1) {
        return null;
      }

      const row = db.prepare(sql.read.selectPageById).get(input.id) as
        | {
            id?: unknown;
            type?: unknown;
            status?: unknown;
            title?: unknown;
            slug?: unknown;
            createdAt?: unknown;
            publishedAt?: unknown;
            updatedAt?: unknown
          }
        | undefined;

      if (!row) {
        return null;
      }

      return toPageRecord(row);
    } catch {
      return null;
    }
  });
};
