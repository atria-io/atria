import { promises as fs } from "node:fs";
import path from "node:path";
import type { ServerResponse } from "node:http";
import {
  DEFAULT_NOT_FOUND_TEXT,
  DEFAULT_PUBLIC_UNAVAILABLE_TEXT,
  MIME_TYPES
} from "../constants.js";

export const respondWithPublicNotFound = async (
  response: ServerResponse,
  publicDir: string
): Promise<void> => {
  const notFoundPagePath = path.join(publicDir, "404.html");
  try {
    const notFoundPage = await fs.readFile(notFoundPagePath);
    response.writeHead(404, { "content-type": MIME_TYPES[".html"] });
    response.end(notFoundPage);
    return;
  } catch {
    // Fall back to plain text when production/public/404.html is unavailable.
  }

  response.writeHead(404, { "content-type": MIME_TYPES[".txt"] });
  response.end(DEFAULT_NOT_FOUND_TEXT);
};

export const respondWithPublicUnavailable = (response: ServerResponse): void => {
  response.writeHead(503, {
    "content-type": MIME_TYPES[".txt"],
    "retry-after": "60"
  });
  response.end(DEFAULT_PUBLIC_UNAVAILABLE_TEXT);
};
