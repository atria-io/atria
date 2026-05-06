import type { IncomingMessage, ServerResponse } from "node:http";
import { handleServerRoutes } from "./handlers.js";
import { sendNotFound } from "./errors.js";

export const routeRequest = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  if (await handleServerRoutes(request, response)) {
    return;
  }

  sendNotFound(response);
};
