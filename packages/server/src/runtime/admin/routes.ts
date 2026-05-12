import type { IncomingMessage, ServerResponse } from "node:http";
import { sendAdminBootstrap, sendAdminSetup } from "./adapter.js";

const toStringValue = (value: unknown): string => (
  typeof value === "string" ? value.trim() : ""
);

const isTrustedOrigin = (request: IncomingMessage): boolean => {
  const host = toStringValue(request.headers.host);
  if (host === "") {
    return false;
  }

  const origin = toStringValue(request.headers.origin);
  if (origin !== "") {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = toStringValue(request.headers.referer);
  if (referer !== "") {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
};

export const handleAdminRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (request.method === "GET" && pathname === "/api/state") {
    await sendAdminBootstrap(request, response);
    return true;
  }

  if (request.method === "POST" && pathname === "/admin/setup") {
    if (!isTrustedOrigin(request)) {
      response.statusCode = 403;
      response.end();
      return true;
    }

    await sendAdminSetup(response);
    return true;
  }

  return false;
};
