import { createHash, randomUUID } from "node:crypto";
import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";

import * as compose from "../../../editor/domains/read/compose.js";
import * as routesService from "../../../routes/domains/upsert/service.js";
import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";

import type * as pagesTypes from "@/data/modules/pages/types.js";

const createVersionId = (documentUuid: string): string => {
  const source = `${documentUuid}:${Date.now()}:${randomUUID()}`;
  return createHash("md5").update(source).digest("hex").slice(0, 7);
};

const insertVersionWithRetry = (
  db: scope.PagesDatabase,
  documentUuid: string,
  kind: "draft-save" | "publish",
  snapshotJson: string,
  createdBy: string | null
): string => {
  for (let attempts = 0; attempts < 5; attempts += 1) {
    const versionId = createVersionId(documentUuid);
    try {
      db
        .prepare(sql.version.insert)
        .run(
          documentUuid,
          versionId,
          kind,
          snapshotJson,
          support.getTimestamp(),
          createdBy
        );
      return versionId;
    } catch {
      continue;
    }
  }

  throw new Error("Could not generate unique version id");
};

export const publishPage = async (
  uuid: string,
  input: pagesTypes.PagePublish = {}
): Promise<pagesTypes.PageDocument | null> => {
  return withDatabase<pagesTypes.PageDocument | null>(null, (db) => {
    try {
      return scope.runInTransaction(db, () => {
        const current = compose.composePageByIdSync(db, uuid, {});
        if (!current) {
          return null;
        }

        const locale = scope.getLocale(input.locale);
        const actor = input.actor ?? null;
        const now = support.getTimestamp();
        const published = JSON.stringify(current.draftContent);
        const versionId = insertVersionWithRetry(db, uuid, "publish", published, actor);

        db
          .prepare(sql.page.updatePublished)
          .run(
            current.draftSlug,
            published,
            versionId,
            now,
            now,
            uuid
          );
        routesService.upsertPageRoute(db, locale, uuid, current.draftSlug, null, 1);

        return compose.composePageByIdSync(db, uuid, {});
      });
    } catch {
      return null;
    }
  });
};
