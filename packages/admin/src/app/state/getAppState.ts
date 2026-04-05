import type { AppState, AppUser, AuthScreen } from "../runtime/runtimeTypes.js";

export interface AppStatePayload {
  state: AuthScreen | "authenticated";
  user?: AppUser;
}

type BootstrapState = AppStatePayload["state"];

export interface InitialBootstrapSnapshot {
  ok: boolean;
  payload?: unknown;
  failed?: "network";
  online?: boolean;
}

const isApiState = (value: unknown): value is BootstrapState => {
  return (
    value === "setup" ||
    value === "create" ||
    value === "login" ||
    value === "broker-consent" ||
    value === "authenticated"
  );
};

const hasBrokerConsentMarker = (): boolean => {
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

const applyAuthUrlOverride = (state: AppState): AppState => {
  if (state.realm === "auth" && hasBrokerConsentMarker()) {
    return { realm: "auth", screen: "broker-consent" };
  }

  return state;
};

export const resolveAppStateFromPayload = (payload: Partial<AppStatePayload>): AppState => {
  if (isApiState(payload.state)) {
    if (payload.state !== "authenticated") {
      return applyAuthUrlOverride({ realm: "auth", screen: payload.state });
    }

    const user = payload.user;
    if (
      user &&
      typeof user.name === "string" &&
      typeof user.email === "string" &&
      typeof user.avatarUrl === "string" &&
      typeof user.role === "string"
    ) {
      return {
        realm: "studio",
        screen: "dashboard",
        user,
      };
    }

    return applyAuthUrlOverride({ realm: "auth", screen: "login" });
  }

  return applyAuthUrlOverride({ realm: "auth", screen: "setup" });
};

export const resolveInitialAppState = (snapshot: InitialBootstrapSnapshot): AppState => {
  if (!snapshot.ok) {
    if (snapshot.failed === "network" && snapshot.online === false) {
      return { realm: "critical", screen: "offline" };
    }

    return { realm: "critical", screen: "server-down" };
  }

  const payload =
    snapshot.payload && typeof snapshot.payload === "object"
      ? (snapshot.payload as Partial<AppStatePayload>)
      : {};

  if (!isApiState(payload.state)) {
    return { realm: "critical", screen: "server-down" };
  }

  return resolveAppStateFromPayload(payload);
};

export const getAppState = async (_basePath: string): Promise<AppState> => {
  const response = await fetch("/api/state", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Api request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<AppStatePayload>;
  return resolveAppStateFromPayload(payload);
};
