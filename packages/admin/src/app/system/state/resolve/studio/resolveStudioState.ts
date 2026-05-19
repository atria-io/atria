import type { AppState } from "@/system/appState.js";
import type { User, State } from "@/runtime/domains/studio/types.js";
import { resolveDashboardState } from "./domains/dashboard/resolveDashboardState.js";
import { resolvePagesState } from "./domains/pages/resolvePagesState.js";
import { resolveSettingsState } from "./domains/settings/resolveSettingsState.js";

const resolveStudioState = (
  basePath: string
): State => {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  const rawPathname = window.location.pathname;
  const pathname = normalizedBasePath && rawPathname.startsWith(normalizedBasePath)
    ? rawPathname.slice(normalizedBasePath.length) || "/"
    : rawPathname;

  if (pathname === "/") {
    const nextPathname = `${normalizedBasePath}/pages` || "/pages";
    const nextUrl = `${nextPathname}${window.location.search}${window.location.hash}`;
    if (window.location.pathname !== nextPathname) {
      window.history.replaceState({}, "", nextUrl);
    }
    return "pages";
  }

  const resolvedScreen =
    resolvePagesState(pathname) ??
    resolveSettingsState(pathname) ??
    resolveDashboardState(pathname);

  return resolvedScreen ?? "pages";
};

export const resolveState = (basePath: string, user: User): AppState => {
  return {
    realm: "studio",
    screen: resolveStudioState(basePath),
    user,
  };
};
