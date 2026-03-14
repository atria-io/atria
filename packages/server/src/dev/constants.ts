export const DEV_PUBLIC_HOST = "localhost";
export const DEV_STUDIO_HOST = "studio.localhost";

export const ADMIN_ASSET_PREFIX = "/.atria/admin/";
export const LEGACY_ADMIN_ASSET_PREFIX = "/.atria/studio/";
export const I18N_API_PREFIX = "/api/admin/i18n";

export const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

export const DEFAULT_NOT_FOUND_TEXT = "404: The requested page was not found.";
export const DEFAULT_PUBLIC_UNAVAILABLE_TEXT = "503: Public site output is not published yet.";
export const DEFAULT_INTERNAL_SERVER_ERROR_TEXT = "500: Internal server error.";
// Keep this switch isolated so LIVE unpublished<->published behavior is easy to remove later.
export const ENABLE_LIVE_PUBLISH_TRANSITION = true;

export const PUBLIC_HOST_ALIASES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
export const STUDIO_HOST_ALIASES = new Set(["studio.localhost"]);
