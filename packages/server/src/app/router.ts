import type { IncomingMessage, ServerResponse } from "node:http";
import { sendNotFound } from "../modules/admin/admin.controller.js";
import { handleAdminRoutes } from "../modules/admin/admin.routes.js";

export const routeRequest = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  if (await handleAdminRoutes(request, response)) {
    return;
  }

  sendNotFound(response);
};
