import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAdminLogin, sendAdminLogout } from "./auth.controller.js";

export const handleAuthRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  if (request.method !== "POST") {
    return false;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (pathname === "/admin/login") {
    await sendAdminLogin(request, response);
    return true;
  }

  if (pathname === "/admin/logout") {
    sendAdminLogout(response);
    return true;
  }

  return false;
};

