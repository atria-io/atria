import type { AppState, AppUser, AuthScreen } from "../runtime/runtimeTypes.js";

export interface AppStatePayload {
  state: AuthScreen | "authenticated";
  user?: AppUser;
}

export const getAppState = async (_basePath: string): Promise<AppState> => {
  const response = await fetch("/admin/bootstrap", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Bootstrap request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<AppStatePayload>;
  if (
    payload.state === "setup" ||
    payload.state === "create" ||
    payload.state === "login" ||
    payload.state === "broker-consent" ||
    payload.state === "authenticated"
  ) {
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
