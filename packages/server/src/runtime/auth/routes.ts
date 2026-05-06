import type { IncomingMessage, ServerResponse } from "node:http";
import { handleBrokerRoutes } from "./views/broker/routes.js";
import { handleCreateViewRoutes } from "./views/create/adapter.js";
import { handleLoginViewRoutes } from "./views/login/adapter.js";
import { handleLogoutViewRoutes } from "./views/logout/adapter.js";

const getStartMode = (
  request: IncomingMessage
): "sign-in" | "create" => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const mode = requestUrl.searchParams.get("mode");
  return mode === "create" ? "create" : "sign-in";
};

export const handleAuthRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const startMode = getStartMode(request);

  if (await handleLoginViewRoutes(request, response, pathname, startMode)) {
    return true;
  }

  if (await handleCreateViewRoutes(request, response, pathname, startMode)) {
    return true;
  }

  if (await handleBrokerRoutes(request, response)) {
    return true;
  }

  if (await handleLogoutViewRoutes(request, response, pathname)) {
    return true;
  }

  return false;
};
