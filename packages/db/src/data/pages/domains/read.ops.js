import { withDB } from "@/system/with.js";
import { sql } from "../dml.api.js";
import { toPageRecord } from "../serializer.js";

export const listPages = async () => {
  return withDB((db) => {
    const rows = db.prepare(sql.read.selectPages).all();
    return rows.map(toPageRecord).filter((page) => page.id !== "");
  });
};

export const getPageById = async (id) => {
  return withDB((db) => {
    const row = db.prepare(sql.read.selectPageById).get(id);
    if (!row) {
      return null;
    }
    const page = toPageRecord(row);
    return page.id === "" ? null : page;
  });
};
