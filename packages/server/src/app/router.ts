import type { IncomingMessage, ServerResponse } from "node:http";
import { sendNotFound } from "../modules/admin/admin.controller.js";
import { handleAdminRoutes } from "../modules/admin/admin.routes.js";

export const routeRequest = (request: IncomingMessage, response: ServerResponse): void => {
  if (handleAdminRoutes(request, response)) {
    return;
  }

  sendNotFound(response);
};
