import { sql } from "@/data/modules/pages/queriesApi.js";
import * as scope from "../../../shared.js";

export const setRoutePublishedState = (
  db: scope.PagesDatabase,
  locale: string,
  uuid: string,
  isPublished: number
): void => {
  db
    .prepare(sql.route.updatePublishedState)
    .run(
      isPublished,
      locale,
      uuid
    );
};
