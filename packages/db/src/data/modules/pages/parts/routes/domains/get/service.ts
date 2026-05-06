import { sql } from "@/data/modules/pages/queriesApi.js";
import * as scope from "../../../shared.js";

export type PageRouteRecord = {
  slug?: unknown;
  parentUuid?: unknown;
  isPublished?: unknown;
};

export const getPageRoute = (
  db: scope.PagesDatabase,
  uuid: string,
  locale: string
): PageRouteRecord | undefined => {
  return db
    .prepare(sql.route.selectByPageAndLocale)
    .get(uuid, locale) as PageRouteRecord | undefined;
};
