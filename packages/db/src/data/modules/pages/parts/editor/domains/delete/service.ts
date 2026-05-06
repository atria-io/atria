import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "@/data/modules/pages/queriesApi.js";

import * as support from "@/data/support/shared.js";
import * as scope from "../../../shared.js";

export const deletePage = async (uuid: string): Promise<boolean> => {
  return withDatabase(false, (db) => {
    try {
      scope.runInTransaction(db, () => {
        db
          .prepare(sql.page.deleteByUuid)
          .run(uuid);

        const workspaceRecord = db
          .prepare(sql.folder.selectWorkspace)
          .get() as
            | { dataJson?: unknown }
            | undefined;
        const workspace = scope.resolveFolders(support.parseJSON(workspaceRecord?.dataJson));
        delete (workspace.assignments as Record<string, unknown>)[uuid];
        db
          .prepare(sql.folder.upsertWorkspace)
          .run(
            JSON.stringify(workspace),
            support.getTimestamp()
          );
      });

      return true;
    } catch {
      return false;
    }
  });
};
