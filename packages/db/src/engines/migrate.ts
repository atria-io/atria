import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";

type EngineDialect = "sqlite" | "postgres";

const createTableStatement = (
  tableName: string,
  columns: readonly string[]
): string => {
  const definition = columns.map((column) => `  ${column}`).join(",\n");

  return [
    `CREATE TABLE IF NOT EXISTS ${tableName} (`,
    definition,
    ")"
  ].join("\n");
};

const META_COLUMNS = [
  "key TEXT PRIMARY KEY",
  "value TEXT NOT NULL",
  "updated_at TEXT NOT NULL"
] as const;

const USER_COLUMNS = [
  "id TEXT PRIMARY KEY",
  "email TEXT",
  "name TEXT",
  "avatar_url TEXT",
  "created_at TEXT NOT NULL",
  "updated_at TEXT NOT NULL"
] as const;

const USER_CREDENTIAL_COLUMNS_BY_DIALECT: Record<EngineDialect, readonly string[]> = {
  sqlite: [
    "user_id TEXT PRIMARY KEY",
    "password_hash TEXT NOT NULL",
    "created_at TEXT NOT NULL",
    "updated_at TEXT NOT NULL",
    "FOREIGN KEY(user_id) REFERENCES atria_users(id) ON DELETE CASCADE"
  ],
  postgres: [
    "user_id TEXT PRIMARY KEY REFERENCES atria_users(id) ON DELETE CASCADE",
    "password_hash TEXT NOT NULL",
    "created_at TEXT NOT NULL",
    "updated_at TEXT NOT NULL"
  ]
};

const IDENTITY_COLUMNS_BY_DIALECT: Record<EngineDialect, readonly string[]> = {
  sqlite: [
    "provider TEXT NOT NULL",
    "provider_user_id TEXT NOT NULL",
    "user_id TEXT NOT NULL",
    "email TEXT",
    "name TEXT",
    "avatar_url TEXT",
    "linked_at TEXT NOT NULL",
    "updated_at TEXT NOT NULL",
    "PRIMARY KEY(provider, provider_user_id)",
    "FOREIGN KEY(user_id) REFERENCES atria_users(id) ON DELETE CASCADE"
  ],
  postgres: [
    "provider TEXT NOT NULL",
    "provider_user_id TEXT NOT NULL",
    "user_id TEXT NOT NULL REFERENCES atria_users(id) ON DELETE CASCADE",
    "email TEXT",
    "name TEXT",
    "avatar_url TEXT",
    "linked_at TEXT NOT NULL",
    "updated_at TEXT NOT NULL",
    "PRIMARY KEY(provider, provider_user_id)"
  ]
};

const SESSION_COLUMNS_BY_DIALECT: Record<EngineDialect, readonly string[]> = {
  sqlite: [
    "id TEXT PRIMARY KEY",
    "user_id TEXT NOT NULL",
    "created_at TEXT NOT NULL",
    "expires_at TEXT NOT NULL",
    "FOREIGN KEY(user_id) REFERENCES atria_users(id) ON DELETE CASCADE"
  ],
  postgres: [
    "id TEXT PRIMARY KEY",
    "user_id TEXT NOT NULL REFERENCES atria_users(id) ON DELETE CASCADE",
    "created_at TEXT NOT NULL",
    "expires_at TEXT NOT NULL"
  ]
};

const INDEX_STATEMENTS = [
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_atria_users_email_unique ON atria_users(lower(email)) WHERE email IS NOT NULL",
  "CREATE INDEX IF NOT EXISTS idx_atria_identities_user_id ON atria_identities(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_atria_sessions_user_id ON atria_sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_atria_sessions_expires_at ON atria_sessions(expires_at)"
] as const;

const createSchemaStatements = (dialect: EngineDialect): readonly string[] => [
  createTableStatement("atria_meta", META_COLUMNS),
  createTableStatement("atria_users", USER_COLUMNS),
  createTableStatement("atria_user_credentials", USER_CREDENTIAL_COLUMNS_BY_DIALECT[dialect]),
  createTableStatement("atria_identities", IDENTITY_COLUMNS_BY_DIALECT[dialect]),
  createTableStatement("atria_sessions", SESSION_COLUMNS_BY_DIALECT[dialect]),
  ...INDEX_STATEMENTS
];

const SQLITE_SCHEMA_SCRIPT = `${createSchemaStatements("sqlite").join(";\n\n")};`;

export const runSqliteSchemaMigrations = (database: DatabaseSync): void => {
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec(SQLITE_SCHEMA_SCRIPT);
};

export const runPostgresSchemaMigrations = async (pool: Pool): Promise<void> => {
  for (const statement of createSchemaStatements("postgres")) {
    await pool.query(statement);
  }
};
