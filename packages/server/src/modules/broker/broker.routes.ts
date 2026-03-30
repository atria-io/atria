import type { IncomingMessage, ServerResponse } from "node:http";
import { sendBrokerConfirm } from "./broker.controller.js";

export const handleBrokerRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "POST" && pathname === "/api/auth/broker/confirm") {
    await sendBrokerConfirm(request, response);
    return true;
  }

  return false;
};
