import * as crypto from "node:crypto";
import { sql } from "../dml.api.js";
import { withDB } from "@/system/with.js";
import { getTimestamp, toString } from "@/data/coerce.js";

export const createSession = async (userId) => {
  return withDB((db) => {
    const sessionId = crypto.randomUUID();
    const now = getTimestamp();
    const sessionDurationMs = 1000 * 60 * 60 * 24 * 7;
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();
    db
      .prepare(sql.session.sessionInsert)
      .run(
        sessionId,
        userId,
        now,
        expiresAt
      );
    return {
      id: sessionId,
      userId,
      expiresAt
    };
  });
};

export const getSessionById = async (sessionId) => {
  return withDB((db) => {
    const row = db
      .prepare(sql.session.sessionSelectById)
      .get(sessionId);
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
  });
};

export const deleteSessionById = async (sessionId) => {
  await withDB((db) => {
    db
      .prepare(sql.session.sessionDeleteById)
      .run(sessionId);
  });
};
