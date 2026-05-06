import type { IncomingMessage, ServerResponse } from "node:http";
import { sendProviderSignInStart } from "../../views/broker/adapter.js";
import { parseEmail, parsePassword, resolveSignIn } from "./logic.js";
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

export const handleLoginViewRoutes = async (
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  startMode: "sign-in" | "create"
): Promise<boolean> => {
  if (request.method === "GET" && startMode === "sign-in") {
    if (pathname === "/api/auth/start/google") {
      await sendProviderSignInStart(request, response, "google");
      return true;
    }

    if (pathname === "/api/auth/start/github") {
      await sendProviderSignInStart(request, response, "github");
      return true;
    }
  }

  if (request.method === "POST" && pathname === "/auth/sign-in") {
    const payload = await readJsonBody(request);
    const email = parseEmail(payload?.email);
    const password = parsePassword(payload?.password);

    if (!email || !password) {
      response.statusCode = 401;
      response.end();
      return true;
    }

    const result = await resolveSignIn(email, password);
    if (result.status !== "ok") {
      response.statusCode = 401;
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
