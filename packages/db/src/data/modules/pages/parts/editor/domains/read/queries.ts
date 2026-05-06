import { pageQueries } from "../create/queries.js";
import { folderQueries } from "../../../folders/domains/get/queries.js";
import { versionQueries } from "../../../editor/domains/version/queries.js";

export const readQueries = {
  selectByUuid: pageQueries.selectByUuid,
  selectWorkspace: folderQueries.selectWorkspace,
  selectVersionById: versionQueries.selectById,
} as const;
