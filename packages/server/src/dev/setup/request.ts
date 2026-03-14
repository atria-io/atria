import type { ServerResponse } from "node:http";
import type { SiteTarget } from "../types.js";
import { MIME_TYPES } from "../constants.js";
import { respondWithDefaultNotFound } from "../http/errors.js";
import type { OwnerSetupState } from "./types.js";

const SETUP_STATUS_PATH = "/api/setup/status";

export const isSetupStatusRequest = (requestUrl: URL): boolean =>
  requestUrl.pathname === SETUP_STATUS_PATH;

export const handleSetupStatusRequest = (
  requestUrl: URL,
  response: ServerResponse,
  siteTarget: SiteTarget,
  ownerSetupState: OwnerSetupState
): boolean => {
  if (!isSetupStatusRequest(requestUrl)) {
    return false;
  }

  if (siteTarget !== "admin") {
    respondWithDefaultNotFound(response);
    return true;
  }

  response.writeHead(200, { "content-type": MIME_TYPES[".json"] });
  response.end(
    JSON.stringify({
      pending: ownerSetupState.pending,
      preferredAuthMethod: ownerSetupState.preferredAuthMethod
    })
  );
  return true;
};
