import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAdminBootstrap, sendAdminSetup } from "./admin.controller.js";

export const handleAdminRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "GET" && pathname === "/api/state") {
    await sendAdminBootstrap(request, response);
    return true;
  }

  if (request.method === "POST" && pathname === "/admin/setup") {
    await sendAdminSetup(response);
    return true;
  }

  return false;
};
