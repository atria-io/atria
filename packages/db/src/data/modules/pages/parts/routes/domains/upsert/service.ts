import { sql } from "@/data/modules/pages/queriesApi.js";
import * as scope from "../../../shared.js";

export const upsertPageRoute = (
  db: scope.PagesDatabase,
  locale: string,
  uuid: string,
  slug: string,
  parentUuid: string | null,
  isPublished: number
): void => {
  db
    .prepare(sql.route.upsert)
    .run(
      locale,
      uuid,
      slug,
      parentUuid,
      isPublished
    );
};
