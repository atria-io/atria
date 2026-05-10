import type { BootPayload } from "./types.js";
import {
  getBootUser,
  getOwnerState,
  getSessionById,
  initializeDatabase,
} from "./db.js";
import { resolveFrontendUrl } from "./config.js";

export const resolveBootState = async (
  sessionId: string | null
): Promise<BootPayload> => {
  const frontendUrl = await resolveFrontendUrl();
  const ownerState = await getOwnerState();
  if (ownerState === "setup") {
    return { state: "setup", frontendUrl };
  }

  if (ownerState === "create") {
    return { state: "create", frontendUrl };
  }

  if (!sessionId) {
    return { state: "sign-in", frontendUrl };
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return { state: "sign-in", frontendUrl };
  }

  const user = await getBootUser(session.userId);
  if (!user) {
    return { state: "sign-in", frontendUrl };
  }

  return { state: "authenticated", user, frontendUrl };
};

export const runAdminSetup = async (): Promise<boolean> => {
  return initializeDatabase();
};
