import type { IncomingMessage, ServerResponse } from "node:http";
import { scryptSync, timingSafeEqual } from "node:crypto";
import {
  createOwner,
  createSession,
  deleteSessionById,
  getOwnerSetupState,
  getUserByEmail,
} from "@atria/db";
import type { LoginPayload } from "./auth.types.js";

const verifyPassword = (storedPassword: string, providedPassword: string): boolean => {
  if (!storedPassword.startsWith("scrypt$")) {
    return storedPassword === providedPassword;
  }

  const parts = storedPassword.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const salt = parts[1];
  const storedHashHex = parts[2];

  if (salt === "" || storedHashHex === "") {
    return false;
  }

  try {
    const providedHash = scryptSync(providedPassword, salt, 64);
    const storedHash = Buffer.from(storedHashHex, "hex");

    if (providedHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(providedHash, storedHash);
  } catch {
    return false;
  }
};

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

const getSessionIdFromCookie = (request: IncomingMessage): string | null => {
  const rawCookie = request.headers.cookie;
  if (typeof rawCookie !== "string" || rawCookie.trim() === "") {
    return null;
  }

  for (const part of rawCookie.split(";")) {
    const cookie = part.trim();
    if (cookie === "") {
      continue;
    }

    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (name === "session" && value !== "") {
      return value;
    }
  }

  return null;
};

export const sendAuthLogin = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const payload = await readJsonBody(request);
  const email = typeof payload?.email === "string" ? payload.email : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(user.password, password)) {
    response.statusCode = 401;
    response.end();
    return;
  }

  const session = await createSession(user.id);
  if (!session) {
    response.statusCode = 401;
    response.end();
    return;
  }

  response.statusCode = 204;
  response.setHeader("Set-Cookie", `session=${session.id}; Path=/; HttpOnly`);
  response.end();
};

export const sendAuthCreateOwner = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const payload = await readJsonBody(request);
  const email = typeof payload?.email === "string" ? payload.email : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  const ownerState = await getOwnerSetupState();
  if (ownerState === "ready") {
    response.statusCode = 409;
    response.end();
    return;
  }

  if (ownerState === "setup") {
    response.statusCode = 400;
    response.end();
    return;
  }

  const ownerId = await createOwner({ email, password });
  if (!ownerId) {
    response.statusCode = 400;
    response.end();
    return;
  }

  const session = await createSession(ownerId);
  if (!session) {
    response.statusCode = 400;
    response.end();
    return;
  }

  response.statusCode = 204;
  response.setHeader("Set-Cookie", `session=${session.id}; Path=/; HttpOnly`);
  response.end();
};

export const sendAuthLogout = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const sessionId = getSessionIdFromCookie(request);
  if (sessionId) {
    await deleteSessionById(sessionId);
  }

  response.statusCode = 204;
  response.setHeader("Set-Cookie", "session=; Path=/; HttpOnly; Max-Age=0");
  response.end();
};
