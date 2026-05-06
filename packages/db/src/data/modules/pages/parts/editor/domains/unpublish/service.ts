import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";
import * as compose from "../../../editor/domains/read/compose.js";
import * as route from "../../../routes/domains/publish/service.js";
import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";
import type * as pagesTypes from "@/data/modules/pages/types.js";

export const unpublishPage = async (uuid: string, locale: string | null = null): Promise<pagesTypes.PageDocument | null> => {
  return withDatabase<pagesTypes.PageDocument | null>(null, (db) => {
    try {
      const now = support.getTimestamp();
      const routeLocale = scope.getLocale(locale);
      db
        .prepare(sql.page.updateUnpublished)
        .run(
          now,
          uuid
        );
      route.setRoutePublishedState(db, routeLocale, uuid, 0);
      return compose.composePageByIdSync(db, uuid, {});
    } catch {
      return null;
    }
  });
};
