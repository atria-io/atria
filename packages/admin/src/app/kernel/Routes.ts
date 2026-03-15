import type { AuthMode } from "../../types/auth.js";

export type AdminRouteId = "create" | "login" | "setup" | "home";

export interface AdminRoute {
  id: AdminRouteId;
  authMode: AuthMode | null;
  subtitleKey: string;
  styleFiles: string[];
}

const AUTH_STYLE_FILES = ["styles/modules/auth.css"];
const HOME_STYLE_FILES = ["styles/modules/dashboard.css"];

export const resolveAdminRoute = (pathname: string): AdminRoute => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/create") {
    return {
      id: "create",
      authMode: "create",
      subtitleKey: "shell.subtitle.auth",
      styleFiles: AUTH_STYLE_FILES
    };
  }

  if (normalizedPath === "/login") {
    return {
      id: "login",
      authMode: "login",
      subtitleKey: "shell.subtitle.auth",
      styleFiles: AUTH_STYLE_FILES
    };
  }

  if (normalizedPath === "/setup") {
    return {
      id: "setup",
      authMode: null,
      subtitleKey: "shell.subtitle.auth",
      styleFiles: AUTH_STYLE_FILES
    };
  }

  return {
    id: "home",
    authMode: null,
    subtitleKey: "shell.subtitle.home",
    styleFiles: HOME_STYLE_FILES
  };
};
