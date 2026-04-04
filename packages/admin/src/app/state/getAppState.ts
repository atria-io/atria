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

const isBootstrapState = (value: unknown): value is BootstrapState => {
  return (
    value === "setup" ||
    value === "create" ||
    value === "login" ||
    value === "broker-consent" ||
    value === "authenticated"
  );
};

export const resolveAppStateFromPayload = (payload: Partial<AppStatePayload>): AppState => {
  if (isBootstrapState(payload.state)) {
    if (payload.state !== "authenticated") {
      return { realm: "auth", screen: payload.state };
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

    return { realm: "auth", screen: "login" };
  }

  return { realm: "auth", screen: "setup" };
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

  if (!isBootstrapState(payload.state)) {
    return { realm: "critical", screen: "server-down" };
  }

  return resolveAppStateFromPayload(payload);
};

export const getAppState = async (_basePath: string): Promise<AppState> => {
  const response = await fetch("/api/state", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Bootstrap request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<AppStatePayload>;
  return resolveAppStateFromPayload(payload);
};
