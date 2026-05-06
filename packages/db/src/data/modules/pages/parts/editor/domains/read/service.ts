import { withDatabase } from "@/system/withDatabase.js";
import * as compose from "./compose.js";
import type * as pagesTypes from "@/data/modules/pages/types.js";

export const getPageByUuid = async (
  uuid: string,
  input: pagesTypes.PageById = {}
): Promise<pagesTypes.PageDocument | null> => {
  return withDatabase<pagesTypes.PageDocument | null>(null, (db) => {
    try {
      return compose.composePageByIdSync(db, uuid, input);
    } catch {
      return null;
    }
  });
};
