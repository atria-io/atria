import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAdminBootstrap } from "./admin.controller.js";

export const handleAdminRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  if (request.method !== "GET") {
    return false;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname !== "/admin/bootstrap") {
    return false;
  }

  await sendAdminBootstrap(request, response);
  return true;
};
