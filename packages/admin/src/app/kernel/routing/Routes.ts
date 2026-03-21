export type AdminRouteId = "create" | "login" | "setup" | "home";

export interface AdminRoute {
  id: AdminRouteId;
  subtitleKey: string;
  styleFiles: string[];
}

export const AUTH_ROUTE_STYLE_FILES = ["styles/modules/auth.css"];
const HOME_STYLE_FILES = ["styles/modules/dashboard.css"];
const AUTH_ROUTE = { subtitleKey: "shell.subtitle.auth",
  styleFiles: AUTH_ROUTE_STYLE_FILES };
const HOME_ROUTE: AdminRoute = {
  id: "home",
  subtitleKey: "shell.subtitle.home",
  styleFiles: HOME_STYLE_FILES
};

/**
 * Route lookup used by shell + style loading.
 * Returned `id` and `styleFiles` must stay in sync because
 * UI chrome and CSS are resolved from this object.
 *
 * @param {string} pathname
 * @returns {AdminRoute}
 */
export const resolveAdminRoute = (pathname: string): AdminRoute => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/create") {
    return { id: "create", ...AUTH_ROUTE };
  }

  if (normalizedPath === "/login") {
    return { id: "login", ...AUTH_ROUTE };
  }

  if (normalizedPath === "/setup") {
    return { id: "setup", ...AUTH_ROUTE };
  }

  return HOME_ROUTE;
};
