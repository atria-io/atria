import type { State } from "@/runtime/domains/studio/types.js";

export const resolveSettingsState = (pathname: string): State | null => {
  if (pathname === "/settings") {
    return "settings";
  }

  return null;
};
