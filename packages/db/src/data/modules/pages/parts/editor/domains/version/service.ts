import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";
import * as support from "@/data/support/shared.js";
import type * as pagesTypes from "@/data/modules/pages/types.js";

type VersionRecord = Record<string, unknown>;

type PageSnapshot = {
  snapshotJson: Record<string, unknown>;
};

export const listPageVersions = async (
  uuid: string
): Promise<pagesTypes.PageVersion[]> => {
  return withDatabase<pagesTypes.PageVersion[]>([], (db) => {
    try {
      const rows = db
        .prepare(sql.version.listByPage)
        .all(uuid) as
        Array<VersionRecord>;
      return rows
        .map((row) => ({
          versionId: (support.toString(row.versionId) ?? ""),
          kind: ((support.toString(row.kind) ?? "") as
            | pagesTypes.PageVersion["kind"])
            || "draft-save",
          createdAt: (support.toString(row.createdAt) ?? ""),
          createdBy: support.toStringOrNull(row.createdBy),
        }))
        .filter((row) => row.versionId !== "" && row.createdAt !== "");
    } catch {
      return [];
    }
  });
};

export const getPageVersion = async (
  uuid: string,
  versionId: string
): Promise<(pagesTypes.PageVersion & PageSnapshot) | null> => {
  return withDatabase<(pagesTypes.PageVersion & PageSnapshot) | null>(null, (db) => {
    try {
      const row = db
        .prepare(sql.version.selectById)
        .get(uuid, versionId) as
        | VersionRecord
        | undefined;
      if (!row) {
        return null;
      }

      return {
        versionId: (support.toString(row.versionId) ?? ""),
        kind: ((support.toString(row.kind) ?? "") as
          | pagesTypes.PageVersion["kind"])
          || "draft-save",
        createdAt: (support.toString(row.createdAt) ?? ""),
        createdBy: support.toStringOrNull(row.createdBy),
        snapshotJson: support.parseJSON(row.snapshotJson),
      };
    } catch {
      return null;
    }
  });
};
