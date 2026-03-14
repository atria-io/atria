import path from "node:path";
import type { AuthMethod } from "@atria/shared";

type AuthRouteMode = "create" | "login";

export const buildAuthLocation = (
  mode: AuthRouteMode,
  preferredAuthMethod: AuthMethod | null,
  nextPath?: string
): string => {
  const pathName = mode === "create" ? "/create" : "/login";
  const query = new URLSearchParams();

  if (preferredAuthMethod) {
    query.set("provider", preferredAuthMethod);
  }

  if (nextPath && nextPath.startsWith("/")) {
    query.set("next", nextPath);
  }

  const queryString = query.toString();
  return queryString.length > 0 ? pathName + "?" + queryString : pathName;
};

export const shouldRedirectAdminToAuth = (requestPath: string): boolean => {
  const normalizedPath = requestPath.replace(/\/+$/, "") || "/";
  if (
    normalizedPath === "/setup" ||
    normalizedPath === "/create" ||
    normalizedPath === "/login" ||
    normalizedPath === "/api/setup/status" ||
    normalizedPath === "/api/health"
  ) {
    return false;
  }

  if (normalizedPath === "/" || normalizedPath === "/index.html") {
    return true;
  }

  if (normalizedPath.startsWith("/api/")) {
    return false;
  }

  return path.extname(normalizedPath).length === 0;
};
