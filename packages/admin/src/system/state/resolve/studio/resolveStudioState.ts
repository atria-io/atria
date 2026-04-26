import type { AppState } from "@/system/runtimeTypes.js";
import type { AppUser, StudioState } from "@/runtime/studio/StudioTypes.js";

const resolveStudioScreenFromLocation = (basePath: string): StudioState => {
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

export const resolveStudioState = (basePath: string, user: AppUser): AppState => {
  return {
    realm: "studio",
    screen: resolveStudioScreenFromLocation(basePath),
    user,
  };
};
