import type { IncomingMessage, ServerResponse } from "node:http";
import { revokeSession } from "./logic.js";

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

export const handleLogoutViewRoutes = async (
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string
): Promise<boolean> => {
  if (request.method !== "POST" || pathname !== "/auth/logout") {
    return false;
  }

  await revokeSession(getSessionIdFromCookie(request));

  response.statusCode = 204;
  response.setHeader("Set-Cookie", "session=; Path=/; HttpOnly; Max-Age=0");
  response.end();
  return true;
};
