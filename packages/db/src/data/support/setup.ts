import { withDatabase } from "../../system/withDatabase.js";
import { AUTH_DDL } from "../../data/slices/auth/ddlApi.js";

const COMPONENTS_DDL = [
  ...AUTH_DDL,
] as const;

export const ensureComponentsDDL = async (): Promise<boolean> => {
  return withDatabase(false, (database) => {
    try {
      for (const statement of COMPONENTS_DDL) {
        database.prepare(statement).run();
      }
      return true;
    } catch {
      return false;
    }
  });
};
