import type { IncomingMessage, ServerResponse } from "node:http";
import { getOwnerSetupState, getSessionById, initializeDatabase, openDatabase } from "@atria/db";
import type { AdminBootstrapResponse, AdminBootstrapUserSummary } from "./admin.types.js";

const toStringValue = (value: unknown): string => (typeof value === "string" ? value : "");

const getSessionIdFromCookie = (request: IncomingMessage): string | null => {
  const rawCookie = request.headers.cookie;
  if (typeof rawCookie !== "string" || rawCookie.trim() === "") {
    return null;
  }

  for (const part of rawCookie.split(";")) {
    const cookie = part.trim();
    if (cookie === "") {
      continue;
    }

    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (name === "session" && value !== "") {
      return value;
    }
  }

  return null;
};

const getUserSummary = async (userId: string): Promise<AdminBootstrapUserSummary | null> => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const statements = [
      "SELECT name AS name, email AS email, avatar_url AS avatarUrl, role AS role FROM atria_users WHERE id = ? LIMIT 1",
      "SELECT name AS name, email AS email, avatarUrl AS avatarUrl, role AS role FROM atria_users WHERE id = ? LIMIT 1",
      "SELECT email AS email, role AS role FROM atria_users WHERE id = ? LIMIT 1",
    ];

    for (const sql of statements) {
      try {
        const row = database.prepare(sql).get(userId) as
          | { name?: unknown; email?: unknown; avatarUrl?: unknown; role?: unknown }
          | undefined;
        if (!row) {
          continue;
        }

        const email = toStringValue(row.email);
        if (email === "") {
          continue;
        }

        const name = toStringValue(row.name) || email;
        const avatarUrl = toStringValue(row.avatarUrl);
        const role = toStringValue(row.role) || "owner";
        return { name, email, avatarUrl, role };
      } catch {
        continue;
      }
    }

    return null;
  } finally {
    database.close();
  }
};

const getAdminBootstrapState = async (request: IncomingMessage): Promise<AdminBootstrapResponse> => {
  const ownerState = await getOwnerSetupState();
  if (ownerState === "setup") {
    return { state: "setup" };
  }

  if (ownerState === "create") {
    return { state: "create" };
  }

  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) {
    return { state: "login" };
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return { state: "login" };
  }

  const user = await getUserSummary(session.userId);
  if (!user) {
    return { state: "login" };
  }

  return { state: "authenticated", user };
};

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const sendAdminBootstrap = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  writeJson(response, 200, await getAdminBootstrapState(request));
};

export const sendAdminSetup = async (response: ServerResponse): Promise<void> => {
  const isInitialized = await initializeDatabase();
  if (!isInitialized) {
    response.statusCode = 400;
    response.end();
    return;
  }

  response.statusCode = 204;
  response.end();
};

export const sendNotFound = (response: ServerResponse): void => {
  writeJson(response, 404, { error: "Not Found" });
};
