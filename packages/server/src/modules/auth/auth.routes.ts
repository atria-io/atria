import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAuthCreateOwner, sendAuthLogin, sendAuthLogout } from "./auth.controller.js";
import { sendBrokerProviderEntry, sendProviderLoginStart } from "../broker/broker.controller.js";

const getStartMode = (request: IncomingMessage): "login" | "create" => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const mode = requestUrl.searchParams.get("mode");
  return mode === "create" ? "create" : "login";
};

export const handleAuthRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "GET" && pathname === "/api/auth/start/google") {
    if (getStartMode(request) === "create") {
      await sendBrokerProviderEntry(request, response, "google");
    } else {
      await sendProviderLoginStart(request, response, "google");
    }
    return true;
  }

  if (request.method === "GET" && pathname === "/api/auth/start/github") {
    if (getStartMode(request) === "create") {
      await sendBrokerProviderEntry(request, response, "github");
    } else {
      await sendProviderLoginStart(request, response, "github");
    }
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
