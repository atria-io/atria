import type { IncomingMessage, ServerResponse } from "node:http";
import { sendBrokerConfirm, sendBrokerConsentPlaceholder } from "./broker.controller.js";

export const handleBrokerRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "GET" && pathname === "/broker/consent") {
    await sendBrokerConsentPlaceholder(response);
    return true;
  }

  if (request.method === "POST" && pathname === "/broker/confirm") {
    await sendBrokerConfirm(request, response);
    return true;
  }

  return false;
};
