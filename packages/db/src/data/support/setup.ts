import { withDatabase } from "../../system/withDatabase.js";
import { AUTH_DDL } from "../../data/slices/auth/ddl.api.js";
import { DOCUMENTS_DDL } from "../../data/slices/pages/ddl.api.js";

const COMPONENTS_DDL = [
  ...AUTH_DDL,
  ...DOCUMENTS_DDL,
] as const;

export const ensureComponentsDDL = async (): Promise<boolean> => {
  return withDatabase(false, (database) => {
    try {
      for (const statement of COMPONENTS_DDL) {
        database.prepare(statement).run();
      }
      ensureUserNameColumns(database);
      ensureDocumentColumns(database);
      return true;
    } catch {
      return false;
    }
  });
};

const ensureUserNameColumns = (
  database: {
    prepare: (sql: string) => {
      all: (...args: unknown[]) => unknown;
      run: (...args: unknown[]) => unknown;
    };
  }
): void => {
  const rows = database.prepare("PRAGMA table_info(users)").all() as
    | Array<{ name?: unknown }>
    | undefined;

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

const ensureDocumentColumns = (
  database: {
    prepare: (sql: string) => {
      all: (...args: unknown[]) => unknown;
      run: (...args: unknown[]) => unknown;
    };
  }
): void => {
  const rows = database.prepare("PRAGMA table_info(documents)").all() as
    | Array<{ name?: unknown }>
    | undefined;

  const names = new Set(
    (rows ?? [])
      .map((row) => (typeof row.name === "string" ? row.name : ""))
      .filter((value) => value !== "")
  );

  if (!names.has("type")) {
    database.prepare("ALTER TABLE documents ADD COLUMN type TEXT NOT NULL DEFAULT 'page'").run();
  }

  if (!names.has("published_at")) {
    database.prepare("ALTER TABLE documents ADD COLUMN published_at TEXT").run();
  }
};
