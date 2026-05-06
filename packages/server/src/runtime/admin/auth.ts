import type { BootPayload } from "./types.js";
import {
  getBootUser,
  getOwnerState,
  getSessionById,
  initializeDatabase,
} from "./db.js";

export const resolveBootState = async (
  sessionId: string | null
): Promise<BootPayload> => {
  const ownerState = await getOwnerState();
  if (ownerState === "setup") {
    return { state: "setup" };
  }

  if (ownerState === "create") {
    return { state: "create" };
  }

  if (!sessionId) {
    return { state: "sign-in" };
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return { state: "sign-in" };
  }

  const user = await getBootUser(session.userId);
  if (!user) {
    return { state: "sign-in" };
  }

  return { state: "authenticated", user };
};

export const runAdminSetup = async (): Promise<boolean> => {
  return initializeDatabase();
};
