import path from "node:path";
import { createRequire } from "node:module";
import { ADMIN_ASSET_PREFIX, LEGACY_ADMIN_ASSET_PREFIX } from "../constants.js";

const require = createRequire(import.meta.url);

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
  const matchedPrefix = requestPath.startsWith(ADMIN_ASSET_PREFIX)
    ? ADMIN_ASSET_PREFIX
    : requestPath.startsWith(LEGACY_ADMIN_ASSET_PREFIX)
      ? LEGACY_ADMIN_ASSET_PREFIX
      : null;

  if (!matchedPrefix) {
    return null;
  }

  const relativePath = requestPath.slice(matchedPrefix.length);
  if (relativePath.length === 0) {
    return "/app.js";
  }

  return "/" + relativePath;
};
