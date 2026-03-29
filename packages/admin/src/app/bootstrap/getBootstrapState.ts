export type BootstrapState = "setup" | "create" | "login" | "authenticated";

interface BootstrapPayload {
  state: BootstrapState;
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
      return { state: payload.state };
    }

    return { state: "setup" };
  } catch {
    return { state: "setup" };
  }
};

