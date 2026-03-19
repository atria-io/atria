import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAuthMethod } from "@atria/shared";
import type { AuthRuntime } from "../../auth/runtime.js";
import { MIME_TYPES } from "../constants.js";
import { buildAuthLocation, shouldRedirectAdminToAuth } from "./routing.js";
import { respondWithDefaultNotFound } from "../http/errors.js";
import { resolveRequestFile } from "../static/resolver.js";
import { sendFileResponse } from "../static/sender.js";
import type { OwnerSetupState } from "../setup/types.js";
import { resolveAdminAssetPath } from "./assets.js";
import { handleI18nRequest } from "./i18n.js";

interface HandleAdminRequestOptions {
  request: IncomingMessage;
  response: ServerResponse;
  requestUrl: URL;
  runtimeDir: string;
  adminDistDir: string;
  ownerSetupState: OwnerSetupState;
  authRuntime: AuthRuntime;
}

const respondForbidden = (response: ServerResponse): void => {
  response.writeHead(403, { "content-type": MIME_TYPES[".txt"] });
  response.end("Forbidden");
};

const redirect = (response: ServerResponse, location: string): void => {
  response.writeHead(302, { location });
  response.end();
};

const getSafeNextPath = (requestUrl: URL): string | undefined => {
  const nextPath = requestUrl.searchParams.get("next");
  return nextPath?.startsWith("/") ? nextPath : undefined;
};

/**
 * Handles studio requests, auth redirects, and runtime asset delivery.
 *
 * @param {HandleAdminRequestOptions} options
 * @returns {Promise<void>}
 */
export const handleAdminRequest = async (options: HandleAdminRequestOptions): Promise<void> => {
  const {
    request,
    response,
    requestUrl,
    runtimeDir,
    adminDistDir,
    ownerSetupState,
    authRuntime
  } = options;

  const i18nHandled = await handleI18nRequest(requestUrl, response, adminDistDir);
  if (i18nHandled) {
    return;
  }

  const authHandled = await authRuntime.handleRequest(request, response, requestUrl);
  if (authHandled) {
    return;
  }

  const adminSession = await authRuntime.getSession(request);
  const normalizedPath = requestUrl.pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/create" && !ownerSetupState.pending) {
    const queryProvider = parseAuthMethod(requestUrl.searchParams.get("provider"));
    redirect(response, buildAuthLocation("login", queryProvider, getSafeNextPath(requestUrl)));
    return;
  }

  if (normalizedPath === "/setup" && !requestUrl.searchParams.get("broker_code")) {
    const mode = ownerSetupState.pending ? "create" : "login";
    const queryProvider = parseAuthMethod(requestUrl.searchParams.get("provider"));
    redirect(response, buildAuthLocation(mode, queryProvider, getSafeNextPath(requestUrl)));
    return;
  }

  if (shouldRedirectAdminToAuth(requestUrl.pathname)) {
    if (ownerSetupState.pending) {
      redirect(response, buildAuthLocation("create", ownerSetupState.preferredAuthMethod));
      return;
    }

    if (!adminSession.authenticated) {
      redirect(response, buildAuthLocation("login", null, requestUrl.pathname + requestUrl.search));
      return;
    }
  }

  const adminAssetPath = resolveAdminAssetPath(requestUrl.pathname);
  if (adminAssetPath) {
    const adminTarget = await resolveRequestFile(
      adminDistDir,
      decodeURIComponent(adminAssetPath),
      "strict"
    );

    if (adminTarget.type === "forbidden") {
      respondForbidden(response);
      return;
    }

    if (adminTarget.type === "not-found") {
      respondWithDefaultNotFound(response);
      return;
    }

    await sendFileResponse(response, adminTarget.filePath);
    return;
  }

  const targetFile = await resolveRequestFile(
    runtimeDir,
    decodeURIComponent(requestUrl.pathname),
    "spa-fallback"
  );

  if (targetFile.type === "forbidden") {
    respondForbidden(response);
    return;
  }

  if (targetFile.type === "not-found") {
    respondWithDefaultNotFound(response);
    return;
  }

  await sendFileResponse(response, targetFile.filePath);
};
