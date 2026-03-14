import { promises as fs } from "node:fs";
import path from "node:path";
import type { ServerResponse } from "node:http";
import { I18N_API_PREFIX, MIME_TYPES } from "../constants.js";
import { isInsideDirectory } from "../static/index.js";

const isValidLocaleId = (value: string): boolean => /^[a-zA-Z0-9_-]+$/.test(value);

const listLocales = async (adminDistDir: string): Promise<string[]> => {
  const localesDir = path.join(adminDistDir, "locales");

  try {
    const entries = await fs.readdir(localesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name.replace(/\.json$/, ""))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
};

export const handleI18nRequest = async (
  requestUrl: URL,
  response: ServerResponse,
  adminDistDir: string
): Promise<boolean> => {
  if (!requestUrl.pathname.startsWith(I18N_API_PREFIX)) {
    return false;
  }

  const suffix = requestUrl.pathname.slice(I18N_API_PREFIX.length).replace(/^\/+/, "");
  if (suffix.length === 0) {
    const locales = await listLocales(adminDistDir);
    response.writeHead(200, { "content-type": MIME_TYPES[".json"] });
    response.end(
      JSON.stringify({
        ok: true,
        locales
      })
    );
    return true;
  }

  const localeId = suffix.split("/")[0] ?? "";
  if (!isValidLocaleId(localeId)) {
    response.writeHead(400, { "content-type": MIME_TYPES[".json"] });
    response.end(
      JSON.stringify({
        ok: false,
        error: "Invalid locale id."
      })
    );
    return true;
  }

  const localesDir = path.join(adminDistDir, "locales");
  const localeFilePath = path.join(localesDir, `${localeId}.json`);

  if (!isInsideDirectory(localesDir, localeFilePath)) {
    response.writeHead(403, { "content-type": MIME_TYPES[".txt"] });
    response.end("Forbidden");
    return true;
  }

  try {
    const localeBuffer = await fs.readFile(localeFilePath);
    response.writeHead(200, { "content-type": MIME_TYPES[".json"] });
    response.end(localeBuffer);
  } catch {
    response.writeHead(404, { "content-type": MIME_TYPES[".json"] });
    response.end(
      JSON.stringify({
        ok: false,
        error: "Locale not found."
      })
    );
  }

  return true;
};
