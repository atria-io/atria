import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAuthLogin, sendAuthLogout } from "./auth.controller.js";

export const handleAuthRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  if (request.method !== "POST") {
    return false;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (pathname === "/auth/login") {
    await sendAuthLogin(request, response);
    return true;
  }

  if (pathname === "/auth/logout") {
    await sendAuthLogout(request, response);
    return true;
  }

  return false;
};
