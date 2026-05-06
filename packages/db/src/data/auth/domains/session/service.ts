import { randomUUID } from "node:crypto";
import { sql } from "../../queriesApi.js";
import { withDatabase } from "@/system/withDatabase.js";
import { getTimestamp, toString } from "@/data/support/shared.js";
import type { AuthSession } from "../../types.js";

export const createSession = async (
  userId: string
): Promise<AuthSession | null> => {
  return withDatabase<AuthSession | null>(null, (db) => {
    const sessionId = randomUUID();
    const now = getTimestamp();
    const sessionDurationMs = 1000 * 60 * 60 * 24 * 7;
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    try {
      db
        .prepare(sql.session.sessionInsert)
        .run(
          sessionId,
          userId,
          now,
          expiresAt
        );
      return { id: sessionId, userId, expiresAt };
    } catch {
      return null;
    }
  });
};

export const getSessionById = async (
  sessionId: string
): Promise<AuthSession | null> => {
  return withDatabase<AuthSession | null>(null, (db) => {
    try {
      const row = db
        .prepare(sql.session.sessionSelectById)
        .get(sessionId) as
          | { id?: unknown; userId?: unknown; expiresAt?: unknown }
          | undefined;

      const id = toString(row?.id);
      const userId = toString(row?.userId);
      const expiresAt = toString(row?.expiresAt);
      if (!id || !userId || !expiresAt) {
        return null;
      }

      const expiresAtMs = Date.parse(expiresAt);
      if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
        return null;
      }

      return { id, userId, expiresAt };
    } catch {
      return null;
    }
  });
};

export const deleteSessionById = async (
  sessionId: string
): Promise<void> => {
  await withDatabase<void>(undefined, (db) => {
    db
      .prepare(sql.session.sessionDeleteById)
      .run(sessionId);
  });
};
