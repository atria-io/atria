/**
 * Route lookup used by shell + style loading.
 * Returned `id` and `styleFiles` must stay in sync because
 * UI chrome and CSS are resolved from this object.
 *
 * @param {string} pathname
 * @returns {AdminRoute}
 */

export type AdminRouteId = "create" | "login" | "setup" | "home";

export const resolveAdminRoute = (pathname: string): AdminRouteId => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/create") return "create";
  if (normalizedPath === "/login") return "login";
  if (normalizedPath === "/setup") return "setup";

  return "home";
};
