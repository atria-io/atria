import { withDatabase } from "@/system/withDatabase.js";
import { getTimestamp } from "@/data/support/shared.js";
import { sql } from "../dml.api.js";
import type { CreatePageInput, PageRecord } from "../types.js";

export const createPage = async (input: CreatePageInput): Promise<PageRecord | null> => {
  return withDatabase<PageRecord | null>(null, (db) => {
    const now = getTimestamp();

    try {
      db.prepare(sql.create.insertPage).run(
        input.id,
        "page",
        "draft",
        input.title,
        input.slug,
        now,
        null,
        now
      );
      return {
        id: input.id,
        type: "page",
        status: "draft",
        title: input.title,
        slug: input.slug,
        timestamps: {
          createdAt: now,
          publishedAt: null,
          updatedAt: now,
        },
      };
    } catch {
      return null;
    }
  });
};
