import type { Mode, Provider } from "../../types.js";

const readSafeNextPath = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  return next && next.startsWith("/") ? next : "/";
};

export const buildProviderConnectUrl = (
  provider: Provider, mode: Mode
): string => {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (mode === "create") {
    params.set("consent", "required");
  }
  const nextPath = readSafeNextPath();
  if (nextPath !== "/") {
    params.set("next", nextPath);
  }
  return `/api/auth/connect/${provider}?${params.toString()}`;
};

export const startOAuthRedirect = (
  provider: Provider, mode: Mode
): void => {
  const target = buildProviderConnectUrl(provider, mode);
  window.setTimeout(() => {
    window.location.href = target;
  }, 220);
};
