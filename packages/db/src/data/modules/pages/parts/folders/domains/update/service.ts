import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";
import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";

export const updatePageFolderAssignment = async (
  uuid: string,
  folderId: string | null
): Promise<boolean> => {
  return withDatabase(false, (db) => {
    try {
      const pageRecord = db
        .prepare(sql.page.selectByUuid)
        .get(uuid) as
          | Record<string, unknown>
          | undefined;
      if (!pageRecord) {
        return false;
      }

      const workspaceRecord = db
        .prepare(sql.folder.selectWorkspace)
        .get() as
          | { dataJson?: unknown }
          | undefined;
      const workspace = scope.resolveFolders(support.parseJSON(workspaceRecord?.dataJson));
      const assignments = workspace.assignments as Record<string, unknown>;

      if (folderId) {
        assignments[uuid] = folderId;
      } else {
        delete assignments[uuid];
      }

      db
        .prepare(sql.folder.upsertWorkspace)
        .run(JSON.stringify(workspace), support.getTimestamp());
      return true;
    } catch {
      return false;
    }
  });
};
