import path from "node:path";
import type { AtriaConfig } from "./types.js";

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
export const DEFAULT_DEV_PORT = 3333;

export const resolveRuntimeDir = (projectRoot: string): string =>
  path.join(projectRoot, ATRIA_RUNTIME_DIR);

export { DEFAULT_AUTH_BROKER_ORIGIN, parseAuthMethod, type AuthMethod } from "./auth.js";
export { createEnvExampleFile } from "./templates/env.js";
export {
  COLOR_SCHEME_STORAGE_KEY,
  READY_EVENT_NAME,
  runtimeAppJs,
  runtimeIndexHtml
} from "./templates/runtime.js";

export type { AtriaConfig };
