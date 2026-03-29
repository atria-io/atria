import type { IncomingMessage, ServerResponse } from "node:http";
import { sendBrokerConsentPlaceholder } from "./broker.controller.js";

export const handleBrokerRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  if (request.method !== "GET") {
    return false;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname !== "/broker/consent") {
    return false;
  }

  await sendBrokerConsentPlaceholder(response);
  return true;
};
