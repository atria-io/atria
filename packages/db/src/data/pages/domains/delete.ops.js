import { withDB } from "@/system/with.js";
import { sql } from "../dml.api.js";

export const deletePage = async (id) => {
  return withDB((db) => {
    const result = db.prepare(sql.delete.deletePageById).run(id);
    return (typeof result?.changes === "number" ? result.changes : 0) > 0;
  });
};
