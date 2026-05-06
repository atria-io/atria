import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";
import { mapFolders } from "../../../folders/domains/get/mappers/mapFolders.js";
import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";
import type * as pagesTypes from "@/data/modules/pages/types.js";

export const getPagesWorkspaceFolders = async (): Promise<pagesTypes.WorkspaceFolders> => {
  return withDatabase<pagesTypes.WorkspaceFolders>({ folders: [], assignments: {} }, (db) => {
    try {
      const workspaceRecord = db
        .prepare(sql.folder.selectWorkspace)
        .get() as
          | { dataJson?: unknown }
          | undefined;
      const workspace = scope.resolveFolders(support.parseJSON(workspaceRecord?.dataJson));
      return mapFolders(workspace);
    } catch {
      return { folders: [], assignments: {} };
    }
  });
};
