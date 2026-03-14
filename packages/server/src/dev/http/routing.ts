import { PUBLIC_HOST_ALIASES, STUDIO_HOST_ALIASES } from "../constants.js";
import type { SiteTarget } from "../types.js";

export const parseRequestHostname = (hostHeader: string | undefined): string | null => {
  if (!hostHeader) {
    return null;
  }

  const firstHost = hostHeader.split(",")[0]?.trim();
  if (!firstHost) {
    return null;
  }

  try {
    return new URL(`http://${firstHost}`).hostname.toLowerCase();
  } catch {
    return firstHost.replace(/:\d+$/, "").toLowerCase();
  }
};

export const resolveSiteTarget = (hostname: string | null): SiteTarget | null => {
  if (hostname === null || PUBLIC_HOST_ALIASES.has(hostname)) {
    return "public";
  }

  if (STUDIO_HOST_ALIASES.has(hostname)) {
    return "admin";
  }

  return null;
};
