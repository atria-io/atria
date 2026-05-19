import { withDB } from "@/system/with.js";
import { getTimestamp } from "@/data/coerce.js";
import { sql } from "../dml.api.js";
import { toPageRecord } from "../serializer.js";

export const updatePage = async (input) => {
  return withDB((db) => {
    const now = getTimestamp();
    const result = db.prepare(sql.update.updatePage).run(
      input.status,
      input.title,
      input.slug,
      input.status,
      now,
      now,
      input.id
    );
    if ((typeof result?.changes === "number" ? result.changes : 0) < 1) {
      return null;
    }
    const row = db.prepare(sql.read.selectPageById).get(input.id);
    if (!row) {
      return null;
    }
    return toPageRecord(row);
  });
};
