import { withDatabase } from "@/system/withDatabase.js";
import { sql } from "../../dmlApi.js";

export const deletePage = async (id: string): Promise<boolean> => {
  return withDatabase(false, (db) => {
    try {
      const result = db.prepare(sql.delete.deletePageById).run(id) as { changes?: unknown };
      return (typeof result?.changes === "number" ? result.changes : 0) > 0;
    } catch {
      return false;
    }
  });
};
