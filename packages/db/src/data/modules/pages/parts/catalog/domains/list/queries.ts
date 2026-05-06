import { pageQueries } from "../../../editor/domains/create/queries.js";
import { folderQueries } from "../../../folders/domains/get/queries.js";

export const catalogQueries = {
  listByLocale: pageQueries.listByLocale,
  selectWorkspace: folderQueries.selectWorkspace,
} as const;
