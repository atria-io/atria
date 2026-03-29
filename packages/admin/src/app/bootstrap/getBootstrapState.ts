export type BootstrapState = "setup" | "create" | "login" | "authenticated";

export interface BootstrapUserSummary {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface BootstrapPayload {
  state: BootstrapState;
  user?: BootstrapUserSummary;
}

export const getBootstrapState = async (_basePath: string): Promise<BootstrapPayload> => {
  try {
    const response = await fetch("/admin/bootstrap", { method: "GET" });

    if (!response.ok) {
      return { state: "setup" };
    }

    const payload = (await response.json()) as Partial<BootstrapPayload>;
    if (
      payload.state === "setup" ||
      payload.state === "create" ||
      payload.state === "login" ||
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
  } catch {
    return { state: "setup" };
  }
};
