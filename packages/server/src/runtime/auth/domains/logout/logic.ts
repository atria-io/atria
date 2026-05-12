import { deleteSessionById } from "./db.js";

export const revokeSession = async (
  sessionId: string | null
): Promise<void> => {
  if (!sessionId) {
    return;
  }

  await deleteSessionById(sessionId);
};
