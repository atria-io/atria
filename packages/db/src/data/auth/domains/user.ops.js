import { sql } from "../dml.api.js";
import { withDB } from "@/system/with.js";
import { toString } from "@/data/coerce.js";

export const getUserByEmail = async (email) => {
  return withDB((db) => {
    const row = db
      .prepare(sql.user.userSelectByEmail)
      .get(email);
    const id = toString(row?.id);
    const rowEmail = toString(row?.email);
    const passwordHash = toString(row?.passwordHash);
    if (!id || !rowEmail || !passwordHash) {
      return null;
    }
    return { id, email: rowEmail, password: passwordHash };
  });
};
