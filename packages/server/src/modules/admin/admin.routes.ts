import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAdminBootstrap } from "./admin.controller.js";

export const handleAdminRoutes = (request: IncomingMessage, response: ServerResponse): boolean => {
  if (request.method !== "GET") {
    return false;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname !== "/admin/bootstrap") {
    return false;
  }

  sendAdminBootstrap(response);
  return true;
};
