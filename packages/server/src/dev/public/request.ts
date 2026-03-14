import type { ServerResponse } from "node:http";
import { MIME_TYPES } from "../constants.js";
import { respondWithDefaultNotFound } from "../http/errors.js";
import { isRootPublicPath } from "./routing.js";
import {
  respondWithPublicNotFound,
  respondWithPublicUnavailable
} from "./responses.js";
import { resolveRequestFile, sendFileResponse } from "../static/index.js";

interface HandlePublicRequestOptions {
  requestUrl: URL;
  response: ServerResponse;
  publicDir: string;
  publicOutputPublished: boolean;
}

export const handlePublicRequest = async (options: HandlePublicRequestOptions): Promise<void> => {
  const { requestUrl, response, publicDir, publicOutputPublished } = options;

  if (!publicOutputPublished) {
    if (isRootPublicPath(requestUrl.pathname)) {
      respondWithPublicUnavailable(response);
    } else {
      respondWithDefaultNotFound(response);
    }
    return;
  }

  const targetFile = await resolveRequestFile(publicDir, decodeURIComponent(requestUrl.pathname), "strict");

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
