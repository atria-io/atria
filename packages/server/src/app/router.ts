import type { IncomingMessage, ServerResponse } from "node:http";
import { sendNotFound } from "../modules/admin/admin.controller.js";
import { handleAdminRoutes } from "../modules/admin/admin.routes.js";

const handleAuthRoutes = (request: IncomingMessage, response: ServerResponse): boolean => {
  if (request.method !== "POST") {
    return false;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname !== "/admin/login") {
    return false;
  }

  response.statusCode = 204;
  response.setHeader("Set-Cookie", "session=valid; Path=/; HttpOnly");
  response.end();
  return true;
};

export const routeRequest = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  if (handleAuthRoutes(request, response)) {
    return;
  }

  if (await handleAdminRoutes(request, response)) {
    return;
  }

  sendNotFound(response);
};
