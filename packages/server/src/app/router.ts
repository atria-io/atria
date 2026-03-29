import type { IncomingMessage, ServerResponse } from "node:http";
import { sendNotFound } from "../modules/admin/admin.controller.js";
import { handleAdminRoutes } from "../modules/admin/admin.routes.js";

interface LoginPayload {
  email?: string;
  password?: string;
}

const OWNER_EMAIL = "owner@atria.local";
const OWNER_PASSWORD = "owner";

const readJsonBody = async (request: IncomingMessage): Promise<LoginPayload | null> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8").trim();
  if (rawBody === "") {
    return null;
  }

  try {
    return JSON.parse(rawBody) as LoginPayload;
  } catch {
    return null;
  }
};

const handleAuthRoutes = async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
  if (request.method !== "POST") {
    return false;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/admin/login") {
    const payload = await readJsonBody(request);
    const email = typeof payload?.email === "string" ? payload.email : "";
    const password = typeof payload?.password === "string" ? payload.password : "";

    if (email !== OWNER_EMAIL || password !== OWNER_PASSWORD) {
      response.statusCode = 401;
      response.end();
      return true;
    }

    response.statusCode = 204;
    response.setHeader("Set-Cookie", "session=valid; Path=/; HttpOnly");
    response.end();
    return true;
  }

  if (pathname === "/admin/logout") {
    response.statusCode = 204;
    response.setHeader("Set-Cookie", "session=; Path=/; HttpOnly; Max-Age=0");
    response.end();
    return true;
  }

  return false;
};

export const routeRequest = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  if (await handleAuthRoutes(request, response)) {
    return;
  }

  if (await handleAdminRoutes(request, response)) {
    return;
  }

  sendNotFound(response);
};
