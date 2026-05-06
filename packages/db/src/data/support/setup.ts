import { withDatabase } from "../../system/withDatabase.js";
import { AUTH_SCHEMA } from "../auth/schemaApi.js";

const MODULES_SCHEMA = [
  ...AUTH_SCHEMA,
] as const;

export const ensureModulesSchema = async (): Promise<boolean> => {
  return withDatabase(false, (database) => {
    try {
      for (const statement of MODULES_SCHEMA) {
        database.prepare(statement).run();
      }
      return true;
    } catch {
      return false;
    }
  });
};
