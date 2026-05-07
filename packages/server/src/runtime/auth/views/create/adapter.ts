import type { IncomingMessage, ServerResponse } from "node:http";
import { sendBrokerProviderEntry } from "../../views/broker/adapter.js";
import {
  parseEmail,
  parseFirstName,
  parseLastName,
  parsePassword,
  resolveCreateOwner
} from "./logic.js";
import type { SignInPayload } from "../../types.js";

const readJsonBody = async (
  request: IncomingMessage
): Promise<SignInPayload | null> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8").trim();
  if (rawBody === "") {
    return null;
  }

  try {
    return JSON.parse(rawBody) as SignInPayload;
  } catch {
    return null;
  }
};

export const handleCreateViewRoutes = async (
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  startMode: "sign-in" | "create"
): Promise<boolean> => {
  if (request.method === "GET" && startMode === "create") {
    if (pathname === "/api/auth/connect/google") {
      await sendBrokerProviderEntry(request, response, "google");
      return true;
    }

    if (pathname === "/api/auth/connect/github") {
      await sendBrokerProviderEntry(request, response, "github");
      return true;
    }
  }

  if (request.method === "POST" && pathname === "/auth/create-owner") {
    const payload = await readJsonBody(request);
    const firstName = parseFirstName(payload?.firstName);
    const lastName = parseLastName(payload?.lastName);
    const email = parseEmail(payload?.email);
    const password = parsePassword(payload?.password);

    if (!firstName || !lastName || !email || !password) {
      response.statusCode = 400;
      response.end();
      return true;
    }

    const result = await resolveCreateOwner(firstName, lastName, email, password);
    if (result.status === "ready") {
      response.statusCode = 409;
      response.end();
      return true;
    }

    if (result.status === "setup" || result.status === "failed") {
      response.statusCode = 400;
      response.end();
      return true;
    }

    response.statusCode = 204;
    response.setHeader("Set-Cookie", `session=${result.sessionId}; Path=/; HttpOnly`);
    response.end();
    return true;
  }

  return false;
};
