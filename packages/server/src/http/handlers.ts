import type { IncomingMessage, ServerResponse } from "node:http";
import * as db from "@atria/db";
import { handleAdminRoutes } from "../runtime/admin/routes.js";
import { handleAuthRoutes } from "../runtime/auth/routes.js";
import { handlePagesRoutes } from "../runtime/domains/pages/routes.js";

const getSessionIdFromCookie = (
  request: IncomingMessage
): string | null => {
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

const isPublicApiPath = (pathname: string): boolean => {
  if (pathname === "/api/state") {
    return true;
  }

  if (pathname.startsWith("/api/auth/")) {
    return true;
  }

  return false;
};

const requiresAuthenticatedSession = (pathname: string): boolean => {
  if (!pathname.startsWith("/api/")) {
    return false;
  }

  return !isPublicApiPath(pathname);
};

export const handleServerRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (requiresAuthenticatedSession(pathname)) {
    const sessionId = getSessionIdFromCookie(request);
    if (!sessionId) {
      response.statusCode = 401;
      response.end();
      return true;
    }

    const session = await db.auth.getSessionById(sessionId);
    if (!session) {
      response.statusCode = 401;
      response.end();
      return true;
    }
  }

  if (await handleAdminRoutes(request, response)) {
    return true;
  }

  if (await handleAuthRoutes(request, response)) {
    return true;
  }

  if (await handlePagesRoutes(request, response)) {
    return true;
  }

  return false;
};
