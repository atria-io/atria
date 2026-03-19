import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ATRIA_DATABASE_FILE,
  cleanEnvValue,
  isPostgresConnectionString
} from "@atria/shared";
import type {
  DatabaseSource,
  ResolvedDatabaseConnection
} from "../database.js";


const resolveSqliteFilePath = (projectRoot: string, connectionString: string): string => {
  if (connectionString === ":memory:") {
    return ":memory:";
  }

  const normalized = connectionString.toLowerCase();
  if (normalized.startsWith("file:")) {
    return fileURLToPath(new URL(connectionString));
  }

  if (normalized.startsWith("sqlite://")) {
    const valueWithoutProtocol = connectionString.slice("sqlite://".length);
    const pathPart = valueWithoutProtocol.split("?")[0] ?? "";

    if (pathPart.length === 0) {
      throw new Error("Invalid sqlite connection string: missing path.");
    }

    if (path.isAbsolute(pathPart)) {
      return path.normalize(pathPart);
    }

    return path.resolve(projectRoot, pathPart);
  }

  if (connectionString.includes("://")) {
    throw new Error(
      `Unsupported database protocol in connection string: ${connectionString}`
    );
  }

  return path.resolve(projectRoot, connectionString);
};

const resolveConnectionFromEnv = (
  projectRoot: string,
  source: DatabaseSource,
  connectionString: string
): ResolvedDatabaseConnection => {
  if (isPostgresConnectionString(connectionString)) {
    return {
      source,
      driver: "postgresql",
      connectionString,
      sqliteFilePath: null,
      usesFallback: false
    };
  }

  return {
    source,
    driver: "sqlite",
    connectionString,
    sqliteFilePath: resolveSqliteFilePath(projectRoot, connectionString),
    usesFallback: false
  };
};

/**
 * Resolves the effective database connection for a project.
 *
 * @param {string} projectRoot
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {ResolvedDatabaseConnection}
 */
export const resolveDatabaseConnection = (
  projectRoot: string,
  env: NodeJS.ProcessEnv = process.env
): ResolvedDatabaseConnection => {
  const preferred = cleanEnvValue(env.ATRIA_DATABASE_URL);
  if (preferred) {
    return resolveConnectionFromEnv(projectRoot, "atria_database_url", preferred);
  }

  const compatibility = cleanEnvValue(env.DATABASE_URL);
  if (compatibility) {
    return resolveConnectionFromEnv(projectRoot, "database_url", compatibility);
  }

  const localPath = path.join(projectRoot, ATRIA_DATABASE_FILE);
  return {
    source: "local_fallback",
    driver: "sqlite",
    connectionString: pathToFileURL(localPath).toString(),
    sqliteFilePath: localPath,
    usesFallback: true
  };
};
