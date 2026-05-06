import type { IncomingMessage, ServerResponse } from "node:http";
import { resolvePageFolderPatch, resolvePagesFolders } from "./logic.js";

const writeJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const writeNoContent = (response: ServerResponse): void => {
  response.statusCode = 204;
  response.end();
};

const readJsonBody = async <T>(request: IncomingMessage): Promise<T | null> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const source = Buffer.concat(chunks).toString("utf-8").trim();
  if (source === "") {
    return null;
  }

  try {
    return JSON.parse(source) as T;
  } catch {
    return null;
  }
};

export const handleFolderRoutes = async (
  request: IncomingMessage,
  response: ServerResponse,
  parts: string[]
): Promise<boolean> => {
  if (request.method === "GET" && parts[2] === "folders" && parts.length === 3) {
    writeJson(response, 200, await resolvePagesFolders());
    return true;
  }

  const uuid = parts[2];
  if (!uuid) {
    return false;
  }

  if (request.method === "PATCH" && parts[3] === "folder" && parts.length === 4) {
    const payload = await readJsonBody<{ folderId?: string | null }>(request);
    if (!payload) {
      writeJson(response, 400, { error: "Invalid payload" });
      return true;
    }

    const ok = await resolvePageFolderPatch(uuid, payload.folderId);
    if (!ok) {
      writeJson(response, 404, { error: "Page not found" });
      return true;
    }

    writeNoContent(response);
    return true;
  }

  return false;
};
