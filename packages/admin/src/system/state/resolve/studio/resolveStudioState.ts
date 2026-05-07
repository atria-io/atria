import type { AppState } from "@/system/appState.js";
import type { User, State } from "@/runtime/studio/types.js";

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

  if (pathname === "/pages") {
    return "pages";
  }

  if (pathname === "/settings") {
    return "settings";
  }

  return "dashboard";
};

export const resolveState = (basePath: string, user: User): AppState => {
  return {
    realm: "studio",
    screen: resolveStudioScreenFromLocation(basePath),
    user,
  };
};
