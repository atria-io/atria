import type { ServerResponse } from "node:http";
import { MIME_TYPES } from "../constants.js";
import { respondWithBadRequest, respondWithDefaultNotFound } from "../http/errors.js";
import { isRootPublicPath } from "./routing.js";
import {
  respondWithPublicNotFound,
  respondWithPublicUnavailable
} from "./responses.js";
import { resolveRequestFile } from "../static/resolver.js";
import { sendFileResponse } from "../static/sender.js";

interface HandlePublicRequestOptions {
  requestUrl: URL;
  response: ServerResponse;
  publicDir: string;
  publicOutputPublished: boolean;
}

const decodePathname = (encodedPathname: string): string | null => {
  try {
    return decodeURIComponent(encodedPathname);
  } catch {
    return null;
  }
};

/**
 * Handles public-site requests served during local development.
 *
 * @param {HandlePublicRequestOptions} options
 * @returns {Promise<void>}
 */
export const handlePublicRequest = async (options: HandlePublicRequestOptions): Promise<void> => {
  const { requestUrl, response, publicDir, publicOutputPublished } = options;

  if (!publicOutputPublished) {
    (isRootPublicPath(requestUrl.pathname) ? respondWithPublicUnavailable : respondWithDefaultNotFound)(
      response
    );
    return;
  }

  const decodedPathname = decodePathname(requestUrl.pathname);
  if (decodedPathname === null) {
    respondWithBadRequest(response);
    return;
  }

  const targetFile = await resolveRequestFile(publicDir, decodedPathname, "strict");

  if (targetFile.type === "forbidden") {
    response.writeHead(403, { "content-type": MIME_TYPES[".txt"] });
    response.end("Forbidden");
    return;
  }

  if (targetFile.type === "not-found") {
    await respondWithPublicNotFound(response, publicDir);
    return;
  }

  await sendFileResponse(response, targetFile.filePath);
};
