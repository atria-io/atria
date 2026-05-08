import type { AppState } from "@/system/appState.js";
import type { User, State } from "@/runtime/studio/types.js";
import { resolveDashboardState } from "./domains/dashboard/resolveDashboardState.js";
import { resolvePagesState } from "./domains/pages/resolvePagesState.js";
import { resolveSettingsState } from "./domains/settings/resolveSettingsState.js";

const resolveStudioScreenFromLocation = (
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

  const resolvedScreen =
    resolvePagesState(pathname) ??
    resolveSettingsState(pathname) ??
    resolveDashboardState(pathname);

  return resolvedScreen ?? "dashboard";
};

export const resolveState = (basePath: string, user: User): AppState => {
  return {
    realm: "studio",
    screen: resolveStudioScreenFromLocation(basePath),
    user,
  };
};
