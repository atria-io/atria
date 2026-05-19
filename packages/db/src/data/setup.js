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

const ensureLegacy = (database) => {
  ensureUserNames(database);
  ensureDocColumns(database);
};

const ensureUserNames = (database) => {
  const rows = database.prepare("PRAGMA table_info(users)").all();
  const names = new Set(
    (rows ?? [])
      .map((row) => (typeof row.name === "string" ? row.name : ""))
      .filter((value) => value !== "")
  );

  if (!names.has("first_name")) {
    database.prepare("ALTER TABLE users ADD COLUMN first_name TEXT").run();
  }

  if (!names.has("last_name")) {
    database.prepare("ALTER TABLE users ADD COLUMN last_name TEXT").run();
  }
};

const ensureDocColumns = (database) => {
  const rows = database.prepare("PRAGMA table_info(documents)").all();
  const names = new Set(
    (rows ?? [])
      .map((row) => (typeof row.name === "string" ? row.name : ""))
      .filter((value) => value !== "")
  );

  if (!names.has("type")) {
    database
      .prepare("ALTER TABLE documents ADD COLUMN type TEXT NOT NULL DEFAULT 'page'")
      .run();
  }

  if (!names.has("published_at")) {
    database.prepare("ALTER TABLE documents ADD COLUMN published_at TEXT").run();
  }
};

export const ensureComponentsDDL = async () => {
  return withDB((database) => {
    applyDDL(database);
    ensureLegacy(database);
    return true;
  });
};
