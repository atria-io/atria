import type { State } from "@/runtime/studio/types.js";

export const resolveDashboardState = (pathname: string): State | null => {
  if (pathname === "/") {
    return "dashboard";
  }

  return null;
};
