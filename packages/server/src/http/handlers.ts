import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAdminRoutes } from "../runtime/admin/routes.js";
import { handleAuthRoutes } from "../runtime/auth/routes.js";
import { handlePagesRoutes } from "../runtime/domains/pages/routes.js";

export const handleServerRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  if (await handleAdminRoutes(request, response)) {
    return true;
  }

  if (await handleAuthRoutes(request, response)) {
    return true;
  }

  if (await handlePagesRoutes(request, response)) {
    return true;
  }

  return false;
};
