import type { IncomingMessage, ServerResponse } from "node:http";
import type { LoginPayload } from "./auth.types.js";

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

export const sendAdminLogin = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const payload = await readJsonBody(request);
  const email = typeof payload?.email === "string" ? payload.email : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (email !== OWNER_EMAIL || password !== OWNER_PASSWORD) {
    response.statusCode = 401;
    response.end();
    return;
  }

  response.statusCode = 204;
  response.setHeader("Set-Cookie", "session=valid; Path=/; HttpOnly");
  response.end();
};

export const sendAdminLogout = (response: ServerResponse): void => {
  response.statusCode = 204;
  response.setHeader("Set-Cookie", "session=; Path=/; HttpOnly; Max-Age=0");
  response.end();
};

