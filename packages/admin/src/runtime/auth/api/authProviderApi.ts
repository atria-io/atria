import type { AuthMode, AuthProvider } from "../AuthTypes.js";

const OAUTH_REDIRECT_DELAY_MS = 220;

const readSafeNextPath = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  return next && next.startsWith("/") ? next : "/";
};

export const buildProviderStartUrl = (provider: AuthProvider, mode: AuthMode): string => {
  const params = new URLSearchParams();
  params.set("mode", mode);
  const nextPath = readSafeNextPath();
  if (nextPath !== "/") {
    params.set("next", nextPath);
  }
  return `/api/auth/start/${provider}?${params.toString()}`;
};

export const startOAuthRedirect = (provider: AuthProvider, mode: AuthMode): void => {
  const target = buildProviderStartUrl(provider, mode);
  window.setTimeout(() => {
    window.location.href = target;
  }, OAUTH_REDIRECT_DELAY_MS);
};
