import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAuthCreateOwner, sendAuthLogin, sendAuthLogout } from "./auth.controller.js";
import { sendBrokerProviderEntry, sendProviderLoginStart } from "../broker/broker.controller.js";

type AuthProvider = "google" | "github";

const getStartMode = (request: IncomingMessage): "login" | "create" => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const mode = requestUrl.searchParams.get("mode");
  return mode === "create" ? "create" : "login";
};

const getProviderFromStartPath = (pathname: string): AuthProvider | null => {
  if (pathname === "/api/auth/start/google") {
    return "google";
  }

  if (pathname === "/api/auth/start/github") {
    return "github";
  }

  return null;
};

const handleProviderStartRoute = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: AuthProvider
): Promise<void> => {
  if (getStartMode(request) === "create") {
    await sendBrokerProviderEntry(request, response, provider);
    return;
  }

  await sendProviderLoginStart(request, response, provider);
};

export const handleAuthRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "GET") {
    const provider = getProviderFromStartPath(pathname);
    if (!provider) {
      return false;
    }

    await handleProviderStartRoute(request, response, provider);
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
