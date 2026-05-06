import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";
import * as compose from "../../../editor/domains/read/compose.js";
import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";

import type * as pagesTypes from "@/data/modules/pages/types.js";

export const updatePageDraft = async (
  uuid: string,
  patch: pagesTypes.PageUpdate
): Promise<pagesTypes.PageDocument | null> => {
  return withDatabase<pagesTypes.PageDocument | null>(null, (db) => {
    try {
      const current = compose.composePageByIdSync(db, uuid, {});
      if (!current) {
        return null;
      }

      const now = support.getTimestamp();
      const title = patch.title ?? current.title;
      const template = patch.template ?? current.template;
      const status = patch.status ?? current.status;
      const draftSlug = patch.draftSlug ? scope.normalizeSlug(patch.draftSlug) : current.draftSlug;
      const draft = patch.draftContent ?? current.draftContent;

      db
        .prepare(sql.page.updateDraft)
        .run(
          title,
          template,
          draftSlug,
          status,
          JSON.stringify(draft),
          now,
          uuid
        );

      return compose.composePageByIdSync(db, uuid, {});
    } catch {
      return null;
    }
  });
};
