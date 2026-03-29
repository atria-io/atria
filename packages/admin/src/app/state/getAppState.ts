export type AppState = "setup" | "create" | "login" | "broker-consent" | "authenticated";

export interface AppUser {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface AppStatePayload {
  state: AppState;
  user?: AppUser;
}

export const getAppState = async (_basePath: string): Promise<AppStatePayload> => {
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
      return { state: payload.state };
    }

    const user = payload.user;
    if (
      user &&
      typeof user.name === "string" &&
      typeof user.email === "string" &&
      typeof user.avatarUrl === "string" &&
      typeof user.role === "string"
    ) {
      return { state: payload.state, user };
    }

    return { state: "login" };
  }

  return { state: "setup" };
};
