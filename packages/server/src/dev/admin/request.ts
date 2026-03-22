import type { IncomingMessage, ServerResponse } from "node:http";
import {
  AUTH_ROUTE_QUERY_KEY,
  parseAuthMethod,
  parseAuthRouteView,
  type AuthRouteView,
  type OwnerSetupState
} from "@atria/shared";
import type { AuthRuntime } from "../../auth/runtime.js";
import { MIME_TYPES } from "../constants.js";
import { buildAuthLocation } from "./routing.js";
import { respondWithBadRequest, respondWithDefaultNotFound } from "../http/errors.js";
import { resolveRequestFile } from "../static/resolver.js";
import { sendFileResponse } from "../static/sender.js";
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

const parseAuthRouteQuery = (requestUrl: URL): AuthRouteView | null =>
  parseAuthRouteView(requestUrl.searchParams.get(AUTH_ROUTE_QUERY_KEY));

const buildPathWithRouteQuery = (
  requestUrl: URL,
  pathname: string,
  routeQuery: AuthRouteView | null
): string => {
  const params = new URLSearchParams(requestUrl.searchParams);
  if (routeQuery === null) {
    params.delete(AUTH_ROUTE_QUERY_KEY);
  } else {
    params.set(AUTH_ROUTE_QUERY_KEY, routeQuery);
  }

  const query = params.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
};

const decodePathname = (encodedPathname: string): string | null => {
  try {
    return decodeURIComponent(encodedPathname);
  } catch {
    return null;
  }
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
  const queryProvider = parseAuthMethod(requestUrl.searchParams.get("provider"));
  const nextPath = getSafeNextPath(requestUrl);
  const routeQuery = parseAuthRouteQuery(requestUrl);
  const isCreateRoute = normalizedPath === "/create";
  const isLegacyCreateEmailRoute = normalizedPath === "/create/email";
  const isLoginRoute = normalizedPath === "/login";
  const isLegacyPrivacyRoute = normalizedPath === "/privacy";
  const isLegacyNeedHelpRoute = normalizedPath === "/need-help";

  if (ownerSetupState.pending) {
    if (normalizedPath === "/" || isLoginRoute) {
      if (routeQuery) {
        redirect(response, buildPathWithRouteQuery(requestUrl, "/create", routeQuery));
      } else {
        redirect(response, buildAuthLocation("create", queryProvider, nextPath));
      }
      return;
    }

    if (isLegacyCreateEmailRoute) {
      redirect(response, buildPathWithRouteQuery(requestUrl, "/create", "email"));
      return;
    }

    if (isLegacyPrivacyRoute) {
      redirect(response, buildPathWithRouteQuery(requestUrl, "/create", "privacy"));
      return;
    }

    if (isLegacyNeedHelpRoute) {
      redirect(response, buildPathWithRouteQuery(requestUrl, "/create", "need-help"));
      return;
    }
  } else {
    if (isCreateRoute || isLegacyCreateEmailRoute) {
      if (routeQuery === "privacy" || routeQuery === "need-help") {
        redirect(response, buildPathWithRouteQuery(requestUrl, "/login", routeQuery));
      } else {
        redirect(response, buildAuthLocation("login", queryProvider, nextPath));
      }
      return;
    }

    if (isLoginRoute && adminSession.authenticated) {
      redirect(response, "/");
      return;
    }

    if (isLoginRoute && !adminSession.authenticated) {
      if (routeQuery !== "privacy" && routeQuery !== "need-help") {
        redirect(response, buildAuthLocation("login", queryProvider, nextPath));
        return;
      }
    }

    if (normalizedPath === "/" && !adminSession.authenticated) {
      if (routeQuery === "privacy" || routeQuery === "need-help") {
        redirect(response, buildPathWithRouteQuery(requestUrl, "/login", routeQuery));
        return;
      }
    }

    if (isLegacyPrivacyRoute) {
      redirect(
        response,
        adminSession.authenticated
          ? "/"
          : buildPathWithRouteQuery(requestUrl, "/login", "privacy")
      );
      return;
    }

    if (isLegacyNeedHelpRoute) {
      redirect(
        response,
        adminSession.authenticated
          ? "/"
          : buildPathWithRouteQuery(requestUrl, "/login", "need-help")
      );
      return;
    }
  }

  if (normalizedPath === "/setup" && !requestUrl.searchParams.get("broker_code") && adminSession.authenticated) {
    const mode = ownerSetupState.pending ? "create" : "login";
    redirect(response, buildAuthLocation(mode, queryProvider, nextPath));
    return;
  }

  const adminAssetPath = resolveAdminAssetPath(requestUrl.pathname);
  if (adminAssetPath) {
    const decodedAssetPath = decodePathname(adminAssetPath);
    if (decodedAssetPath === null) {
      respondWithBadRequest(response);
      return;
    }

    const adminTarget = await resolveRequestFile(
      adminDistDir,
      decodedAssetPath,
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

  const decodedPathname = decodePathname(requestUrl.pathname);
  if (decodedPathname === null) {
    respondWithBadRequest(response);
    return;
  }

  const targetFile = await resolveRequestFile(
    runtimeDir,
    decodedPathname,
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
