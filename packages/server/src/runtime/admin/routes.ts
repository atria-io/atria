import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAdminBootstrap, sendAdminSetup } from "./adapter.js";
import { handlePagesRoutes } from "../modules/pages/routes.js";

export const handleAdminRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  if (await handlePagesRoutes(request, response)) {
    return true;
  }

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
