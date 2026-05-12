import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "../dml.api.js";
import { toPageRecord } from "../shared.js";
import type { PageRecord } from "../types.js";

export const listPages = async (): Promise<PageRecord[]> => {
  return withDatabase<PageRecord[]>([], (db) => {
    try {
      const rows = db.prepare(sql.read.selectPages).all() as Array<{
        id?: unknown;
        type?: unknown;
        status?: unknown;
        title?: unknown;
        slug?: unknown;
        createdAt?: unknown;
        publishedAt?: unknown;
        updatedAt?: unknown;
      }>;

      return rows.map(toPageRecord).filter((page) => page.id !== "");
    } catch {
      return [];
    }
  });
};

export const getPageById = async (id: string): Promise<PageRecord | null> => {
  return withDatabase<PageRecord | null>(null, (db) => {
    try {
      const row = db.prepare(sql.read.selectPageById).get(id) as
        | {
            id?: unknown;
            type?: unknown;
            status?: unknown;
            title?: unknown;
            slug?: unknown;
            createdAt?: unknown;
            publishedAt?: unknown;
            updatedAt?: unknown;
          }
        | undefined;

      if (!row) {
        return null;
      }

      const page = toPageRecord(row);
      return page.id === "" ? null : page;
    } catch {
      return null;
    }
  });
};
