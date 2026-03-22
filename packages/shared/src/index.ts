import path from "node:path";
import type { AtriaConfig } from "./setup/shared.config.js";

export const ATRIA_CONFIG_FILE = "atria.config.json";
export const ATRIA_INTERNAL_DIR = ".atria";
export const ATRIA_RUNTIME_DIR = path.join(ATRIA_INTERNAL_DIR, "runtime");
export const ATRIA_DATA_DIR = path.join(ATRIA_INTERNAL_DIR, "data");
export const ATRIA_DATABASE_FILE = path.join(ATRIA_DATA_DIR, "atria.db");
export const PRODUCTION_DIR = "production";
export const PUBLIC_OUTPUT_DIR = path.join(PRODUCTION_DIR, "public");
export const STUDIO_DIR = path.join(PRODUCTION_DIR, "studio");
export const STUDIO_CONTENT_DIR = path.join(STUDIO_DIR, "content");
export const STUDIO_THEME_DIR = path.join(STUDIO_DIR, "theme");
export const DEFAULT_ADMIN_PORT = 3333;
export const DEFAULT_PUBLIC_PORT = 4444;
export const DEFAULT_DEV_PORT = DEFAULT_ADMIN_PORT;

/**
 * Resolves the runtime directory for a project root.
 *
 * @param {string} projectRoot
 * @returns {string}
 */
export const resolveRuntimeDir = (projectRoot: string): string =>
  path.join(projectRoot, ATRIA_RUNTIME_DIR);

export { DEFAULT_AUTH_BROKER_ORIGIN, parseAuthMethod, type AuthMethod } from "./auth/shared.auth.js";
export {
  AUTH_ROUTE_QUERY_KEY,
  parseAuthRouteView,
  type AuthRouteView
} from "./auth/shared.auth-route.js";
export { parseArgs, type ParsedArgs } from "./client/shared.cli.js";
export {
  cleanEnvValue,
  isPostgresConnectionString,
  loadEnvFile,
  parseDotEnvLine,
  updateEnvFile
} from "./env/shared.env.js";
export { ensureDirectory, pathExists, writeFile, type WriteStatus } from "./io/shared.fs.js";
export { createEnvExampleFile } from "./env/shared.template.js";
export {
  COLOR_SCHEME_STORAGE_KEY,
  READY_EVENT_NAME,
  runtimeAppJs,
  runtimeIndexHtml
} from "./runtime/shared.runtime.js";
export { type OwnerSetupState } from "./setup/shared.setup.js";

export type { AtriaConfig };
