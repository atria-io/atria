import type { IncomingMessage, ServerResponse } from "node:http";
import { sendBrokerConfirm, sendBrokerProviderCallback } from "./adapter.js";

export const handleBrokerRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "GET" && pathname === "/api/auth/callback/google") {
    await sendBrokerProviderCallback(request, response, "google");
    return true;
  }

  if (request.method === "GET" && pathname === "/api/auth/callback/github") {
    await sendBrokerProviderCallback(request, response, "github");
    return true;
  }

  if (request.method === "POST" && pathname === "/api/auth/broker/consent") {
    await sendBrokerConfirm(request, response);
    return true;
  }

  return false;
};
