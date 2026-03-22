export type AuthRouteView = "email" | "privacy" | "need-help";

/**
 * Canonical query key used to resolve auth sub-views in URL state.
 */
export const AUTH_ROUTE_QUERY_KEY = "view";

/**
 * Parses URL `view` values for auth route navigation.
 *
 * @param {unknown} value
 * @returns {AuthRouteView | null}
 */
export const parseAuthRouteView = (value: unknown): AuthRouteView | null => {
  if (value === "email" || value === "privacy" || value === "need-help") {
    return value;
  }

  return null;
};
