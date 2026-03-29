import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAuthCreateOwner, sendAuthLogin, sendAuthLogout } from "./auth.controller.js";
import { sendBrokerProviderEntry } from "../broker/broker.controller.js";

export const handleAuthRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "GET" && pathname === "/auth/google") {
    await sendBrokerProviderEntry(request, response, "google");
    return true;
  }

  if (request.method === "GET" && pathname === "/auth/github") {
    await sendBrokerProviderEntry(request, response, "github");
    return true;
  }

  if (request.method !== "POST") {
    return false;
  }

  if (pathname === "/auth/login") {
    await sendAuthLogin(request, response);
    return true;
  }

  if (pathname === "/auth/create-owner") {
    await sendAuthCreateOwner(request, response);
    return true;
  }

  if (pathname === "/auth/logout") {
    await sendAuthLogout(request, response);
    return true;
  }

  return false;
};
