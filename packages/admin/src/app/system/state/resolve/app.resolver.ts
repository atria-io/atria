import type { AppState } from "../../state/app.state.js";
import type { State as AuthState } from "@/app/realms/auth/model/auth.types.js";
import type { State as CriticalState } from "@/app/realms/critical/model/critical.types.js";
import type { User, State as StudioState } from "@/app/realms/studio/model/studio.types.js";
import type { BootPayload, BootSnapshot } from "../boot.types.js";
import { isBootState, isBootUser } from "../boot.types.js";

const hasBrokerConsentQueryMarker = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URL(window.location.href).searchParams;
  const screen = params.get("screen");
  if (screen === "broker-consent" || screen === "consent") {
    return true;
  }

  return (
    params.get("code") !== null ||
    params.get("broker_consent_token") !== null ||
    params.get("broker_code") !== null
  );
};

const resolveAuthState = (screen: AuthState): AppState => {
  if (hasBrokerConsentQueryMarker()) {
    return { realm: "auth", screen: "broker-consent" };
  }

  return { realm: "auth", screen };
};

const resolveCriticalState = (screen: CriticalState): AppState => {
  return { realm: "critical", screen };
};

const resolveDashboardState = (pathname: string): StudioState | null => {
  if (pathname === "") {
    return "dashboard";
  }

  return null;
};

const resolvePagesState = (pathname: string): StudioState | null => {
  if (pathname === "/pages" || pathname.startsWith("/pages:")) {
    return "pages";
  }

  return null;
};

const resolveThemeState = (pathname: string): StudioState | null => {
  if (pathname === "/theme" || pathname.startsWith("/theme/")) {
    return "theme";
  }

  return null;
};

const resolveSettingsState = (pathname: string): StudioState | null => {
  if (pathname === "/settings") {
    return "settings";
  }

  return null;
};

const resolveStudioScreenState = (basePath: string): StudioState => {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  const rawPathname = window.location.pathname;
  const pathname = normalizedBasePath && rawPathname.startsWith(normalizedBasePath)
    ? rawPathname.slice(normalizedBasePath.length) || "/"
    : rawPathname;

  if (pathname === "/") {
    const nextPathname = `${normalizedBasePath}/pages` || "/pages";
    const nextUrl = `${nextPathname}${window.location.search}${window.location.hash}`;
    if (window.location.pathname !== nextPathname) {
      window.history.replaceState({}, "", nextUrl);
    }
    return "pages";
  }

  const resolvedScreen =
    resolvePagesState(pathname) ??
    resolveThemeState(pathname) ??
    resolveSettingsState(pathname) ??
    resolveDashboardState(pathname);

  return resolvedScreen ?? "pages";
};

const resolveStudioState = (basePath: string, user: User): AppState => {
  return {
    realm: "studio",
    screen: resolveStudioScreenState(basePath),
    user,
  };
};

export const resolveAppState = (
  payload: Partial<BootPayload>,
  basePath: string
): AppState => {
  if (!isBootState(payload.state)) {
    throw new Error("Invalid bootstrap state");
  }

  if (payload.state !== "authenticated") {
    return resolveAuthState(payload.state);
  }

  if (!isBootUser(payload.user)) {
    throw new Error("Invalid authenticated bootstrap payload");
  }

  return resolveStudioState(basePath, payload.user);
};

export const resolveBootState = (
  snapshot: BootSnapshot,
  basePath = "/"
): AppState => {
  if (!snapshot.ok) {
    if (snapshot.failed === "network" && snapshot.online === false) {
      return resolveCriticalState("offline");
    }

    return resolveCriticalState("server-down");
  }

  const payload: Partial<BootPayload> =
    snapshot.payload && typeof snapshot.payload === "object"
      ? (snapshot.payload as Partial<BootPayload>)
      : {};

  if (!isBootState(payload.state)) {
    return resolveCriticalState("server-down");
  }

  if (payload.state === "authenticated" && !isBootUser(payload.user)) {
    return resolveCriticalState("server-down");
  }

  return resolveAppState(payload, basePath);
};
