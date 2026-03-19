import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { resolveDatabaseConnection } from "../config/resolve.js";
import { PostgresAtriaDatabase, SqliteAtriaDatabase } from "../engines/driver.js";
import { runSqliteSchemaMigrations } from "../engines/migrate.js";
import type {
  AtriaDatabase,
  OpenAtriaDatabaseOptions,
  ResolvedDatabaseConnection
} from "../database.js";

/**
 * Opens the configured database for a project.
 *
 * @param {string} projectRoot
 * @param {OpenAtriaDatabaseOptions} [options={}]
 * @returns {AtriaDatabase}
 */
export const openAtriaDatabase = (
  projectRoot: string,
  options: OpenAtriaDatabaseOptions = {}
): AtriaDatabase => {
  const connection = resolveDatabaseConnection(projectRoot, options.env);

  if (connection.driver === "sqlite") {
    const sqliteFilePath = connection.sqliteFilePath;
    if (!sqliteFilePath) {
      throw new Error("SQLite connection path is missing.");
    }

    if (sqliteFilePath !== ":memory:") {
      mkdirSync(path.dirname(sqliteFilePath), { recursive: true });
    }

    const database = new DatabaseSync(sqliteFilePath);
    runSqliteSchemaMigrations(database);
    return new SqliteAtriaDatabase(database, connection);
  }

  const pool = new Pool({ connectionString: connection.connectionString });
  return new PostgresAtriaDatabase(pool, connection);
};

/**
 * Opens the project database and runs schema setup when needed.
 *
 * @param {string} projectRoot
 * @param {OpenAtriaDatabaseOptions} [options={}]
 * @returns {Promise<AtriaDatabase>}
 */
export const initializeProjectDatabase = async (
  projectRoot: string,
  options: OpenAtriaDatabaseOptions = {}
): Promise<ResolvedDatabaseConnection> => {
  const database = openAtriaDatabase(projectRoot, options);
  try {
    await database.hasUsers();
    return database.getConnectionInfo();
  } finally {
    await database.close();
  }
};
