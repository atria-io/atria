import type { ServerResponse } from "node:http";
import {
  DEFAULT_INTERNAL_SERVER_ERROR_TEXT,
  DEFAULT_NOT_FOUND_TEXT,
  MIME_TYPES
} from "../constants.js";

export const respondWithDefaultNotFound = (response: ServerResponse): void => {
  response.writeHead(404, { "content-type": MIME_TYPES[".txt"] });
  response.end(DEFAULT_NOT_FOUND_TEXT);
};

export const respondWithInternalServerError = (response: ServerResponse): void => {
  response.writeHead(500, { "content-type": MIME_TYPES[".txt"] });
  response.end(DEFAULT_INTERNAL_SERVER_ERROR_TEXT);
};
