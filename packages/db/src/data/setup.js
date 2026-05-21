import { withDB } from "../system/with.js";
import { AUTH_DDL } from "./auth/ddl.api.js";
import { PAGES_DDL } from "./pages/ddl.api.js";

const SCHEMA_DDL = [
  ...AUTH_DDL,
  ...PAGES_DDL,
];

const applyDDL = (database) => {
  for (const statement of SCHEMA_DDL) {
    database.prepare(statement).run();
  }
};

export const ensureComponentsDDL = async () => {
  return withDB((database) => {
    applyDDL(database);
    return true;
  });
};
