import path from "node:path";
import { createRequire } from "node:module";
import { ADMIN_ASSET_PREFIX, LEGACY_ADMIN_ASSET_PREFIX } from "../constants.js";

const require = createRequire(import.meta.url);
const COMPAT_ADMIN_ASSET_PREFIXES = [LEGACY_ADMIN_ASSET_PREFIX, "/.atria/studio/"] as const;

export const resolveAdminDistDir = (): string => {
  try {
    const adminEntryPath = require.resolve("@atria/admin/app.js");
    return path.dirname(adminEntryPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error("Admin assets are unavailable. Ensure @atria/admin is installed. (" + message + ")");
  }
};

export const resolveAdminAssetPath = (requestPath: string): string | null => {
  if (requestPath.startsWith(ADMIN_ASSET_PREFIX)) {
    const relativePath = requestPath.slice(ADMIN_ASSET_PREFIX.length);
    return relativePath.length === 0 ? "/app.js" : `/${relativePath}`;
  }

  for (const legacyPrefix of COMPAT_ADMIN_ASSET_PREFIXES) {
    if (requestPath.startsWith(legacyPrefix)) {
      const relativePath = requestPath.slice(legacyPrefix.length);
      return relativePath.length === 0 ? "/app.js" : `/${relativePath}`;
    }
  }

  return null;
};
