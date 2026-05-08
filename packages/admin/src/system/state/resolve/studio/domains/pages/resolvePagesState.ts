import type { State } from "@/runtime/studio/types.js";

export const resolvePagesState = (pathname: string): State | null => {
  if (pathname === "/pages" || pathname.startsWith("/pages;") || pathname.startsWith("/pages:")) {
    return "pages";
  }

  return null;
};
