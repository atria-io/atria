import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveBootState, runAdminSetup } from "./auth.js";

const writeJSON = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const getSessionIdFromCookie = (
  request: IncomingMessage
): string | null => {
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

export const sendAdminBootstrap = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const state = await resolveBootState(getSessionIdFromCookie(request));
  writeJSON(response, 200, state);
};

export const sendAdminSetup = async (
  response: ServerResponse
): Promise<void> => {
  const ok = await runAdminSetup();
  if (!ok) {
    response.statusCode = 400;
    response.end();
    return;
  }

  response.statusCode = 204;
  response.end();
};
