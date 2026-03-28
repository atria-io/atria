import type { ProviderId } from "../../../../../types/auth.js";
import {
  AUTH_ROUTE_QUERY_KEY,
  parseAuthRouteView,
  type AuthRouteView
} from "@atria/shared/auth-route";
import type { AuthScreen } from "./reducer.js";

const LOGIN_PATHNAME = "/login";
const CREATE_PATHNAME = "/create";

const normalizePathname = (pathname: string): string =>
  pathname.replace(/\/+$/, "") || "/";

/**
 * Derives canonical pathname from setup state.
 * Pending setup uses /create; otherwise /login.
 */
export const getCanonicalPathname = (isPendingSetup: boolean): string =>
  isPendingSetup ? CREATE_PATHNAME : LOGIN_PATHNAME;

/**
 * Parses route query parameter to screen.
 * Valid: privacy, need-help, email (only in setup)
 * Invalid or missing: null (will use default)
 */
export const routeQueryToScreen = (
  routeQuery: AuthRouteView | null,
  isPendingSetup: boolean
): AuthScreen | null => {
  if (routeQuery === "privacy") {
    return "privacy";
  }

  if (routeQuery === "need-help") {
    return "help";
  }

  if (routeQuery === "email" && isPendingSetup) {
    return "email";
  }

  return null;
};

/**
 * Derives route query from screen.
 * Provider and email screens return null (canonical).
 * Privacy/help only appear in query if set via navigation.
 */
export const screenToRouteQuery = (screen: AuthScreen): AuthRouteView | null => {
  if (screen === "privacy") {
    return "privacy";
  }

  if (screen === "help") {
    return "need-help";
  }

  if (screen === "email") {
    return "email";
  }

  return null;
};

/**
 * Reads route query from URL.
 * Returns null if missing.
 */
export const readAuthRouteQuery = (): AuthRouteView | null =>
  parseAuthRouteView(
    new URLSearchParams(window.location.search).get(AUTH_ROUTE_QUERY_KEY)
  );

/**
 * Builds pathname + query string from components.
 * If routeQuery is null, removes the query param.
 * Preserves hash.
 */
export const buildPathWithRouteQuery = (
  pathname: string,
  routeQuery: AuthRouteView | null
): string => {
  const params = new URLSearchParams(window.location.search);
  if (routeQuery === null) {
    params.delete(AUTH_ROUTE_QUERY_KEY);
  } else {
    params.set(AUTH_ROUTE_QUERY_KEY, routeQuery);
  }

  const query = params.toString();
  return `${pathname}${query.length > 0 ? `?${query}` : ""}${window.location.hash}`;
};

/**
 * Current full path (pathname + search + hash) for history state.
 */
export const currentPathWithRouteQuery = (): string =>
  `${normalizePathname(window.location.pathname)}${window.location.search}${window.location.hash}`;

/**
 * Synchronizes URL to auth state on startup or popstate.
 * Returns: { isUrlValid, targetPathname, targetScreen }
 * where targetScreen is derived from query or defaults to canonical.
 */
export const syncRouteToAuthState = (options: {
  isPendingSetup: boolean;
  selectedProvider: ProviderId | null;
  currentRouteQuery: AuthRouteView | null;
}): {
  isUrlValid: boolean;
  targetPathname: string;
  targetScreen: AuthScreen;
} => {
  const { isPendingSetup, selectedProvider, currentRouteQuery } = options;
  const normalizedPath = normalizePathname(window.location.pathname);
  const canonicalPathname = getCanonicalPathname(isPendingSetup);

  const isUrlValid = normalizedPath === canonicalPathname;

  const routeScreen = routeQueryToScreen(currentRouteQuery, isPendingSetup);
  const targetScreen = routeScreen || (selectedProvider === "email" ? "email" : "provider");

  return {
    isUrlValid,
    targetPathname: canonicalPathname,
    targetScreen
  };
};

/**
 * Clears broker exchange params after consumption.
 */
export const clearBrokerQueryParams = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete("broker_code");
  url.searchParams.delete("code");
  url.searchParams.delete("broker_consent_token");
  url.searchParams.delete("project_id");
  url.searchParams.delete("provider");

  const query = url.searchParams.toString();
  const nextPath = query.length > 0 ? `${url.pathname}?${query}` : url.pathname;
  window.history.replaceState({}, "", nextPath);
};

/**
 * Normalizes legacy broker_consent_token to code (backward compat).
 */
export const normalizeLegacyBrokerConsentParam = (): void => {
  const url = new URL(window.location.href);
  const legacyToken = url.searchParams.get("broker_consent_token");
  if (!legacyToken || url.searchParams.has("code")) {
    return;
  }

  url.searchParams.set("code", legacyToken);
  url.searchParams.delete("broker_consent_token");

  const query = url.searchParams.toString();
  const nextPath = query.length > 0 ? `${url.pathname}?${query}` : url.pathname;
  window.history.replaceState({}, "", nextPath);
};
