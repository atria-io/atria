import type { State } from "@/runtime/domains/studio/types.js";

export const resolvePagesState = (pathname: string): State | null => {
  if (pathname === "/pages" || pathname.startsWith("/pages~")) {
    return "pages";
  }

  return null;
};
