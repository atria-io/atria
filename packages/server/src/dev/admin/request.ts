import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAuthMethod } from "@atria/shared";
import type { AuthRuntime } from "../../auth/runtime.js";
import { MIME_TYPES } from "../constants.js";
import {
  buildAuthLocation,
  shouldRedirectAdminToAuth
} from "./routing.js";
import { respondWithDefaultNotFound } from "../http/errors.js";
import { resolveRequestFile, sendFileResponse } from "../static/index.js";
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

  if (normalizedPath === "/setup" && !requestUrl.searchParams.get("broker_code")) {
    const mode = ownerSetupState.pending ? "create" : "login";
    const queryProvider = parseAuthMethod(requestUrl.searchParams.get("provider"));
    const queryNext = requestUrl.searchParams.get("next");
    const nextPath = queryNext && queryNext.startsWith("/") ? queryNext : undefined;

    response.writeHead(302, {
      location: buildAuthLocation(mode, queryProvider, nextPath)
    });
    response.end();
    return;
  }

  if (shouldRedirectAdminToAuth(requestUrl.pathname)) {
    if (ownerSetupState.pending) {
      response.writeHead(302, {
        location: buildAuthLocation("create", ownerSetupState.preferredAuthMethod)
      });
      response.end();
      return;
    }

    if (!adminSession.authenticated) {
      const nextPath = requestUrl.pathname + requestUrl.search;
      response.writeHead(302, {
        location: buildAuthLocation("login", null, nextPath)
      });
      response.end();
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

  const targetFile = await resolveRequestFile(runtimeDir, decodeURIComponent(requestUrl.pathname), "spa-fallback");

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
