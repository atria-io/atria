import type { ServerResponse } from "node:http";
import type { SiteTarget } from "../types.js";
import { MIME_TYPES } from "../constants.js";
import { respondWithDefaultNotFound } from "../http/errors.js";
import type { OwnerSetupState } from "./types.js";

const SETUP_STATUS_PATH = "/api/setup/status";
const respondJson = (response: ServerResponse, body: unknown): void => {
  response.writeHead(200, { "content-type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(body));
};

/**
 * Checks whether the request targets the local setup status endpoint.
 *
 * @param {URL} requestUrl
 * @returns {boolean}
 */
export const isSetupStatusRequest = (requestUrl: URL): boolean =>
  requestUrl.pathname === SETUP_STATUS_PATH;

/**
 * Responds with the current owner-setup state for the studio app.
 *
 * @param {URL} requestUrl
 * @param {ServerResponse} response
 * @param {SiteTarget} siteTarget
 * @param {OwnerSetupState} ownerSetupState
 * @returns {boolean}
 */
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

  respondJson(response, {
    pending: ownerSetupState.pending,
    preferredAuthMethod: ownerSetupState.preferredAuthMethod
  });
  return true;
};
