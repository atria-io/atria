import type { IncomingMessage, ServerResponse } from "node:http";
import { sendNotFound } from "./modules/admin/admin.controller.js";
import { handleAdminRoutes } from "./modules/admin/admin.routes.js";
import { handleAuthRoutes } from "./modules/auth/auth.routes.js";
import { handleBrokerRoutes } from "./modules/broker/broker.routes.js";

export const routeRequest = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  if (await handleAuthRoutes(request, response)) {
    return;
  }

  if (await handleAdminRoutes(request, response)) {
    return;
  }

  if (await handleBrokerRoutes(request, response)) {
    return;
  }

  sendNotFound(response);
};
