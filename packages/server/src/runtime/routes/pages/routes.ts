import type { IncomingMessage, ServerResponse } from "node:http";
import type { CreatePageInput, UpdatePageInput } from "./types.js";
import {
  resolveFoldersRoute,
  resolvePageCreate,
  resolvePageDelete,
  resolvePageGet,
  resolvePagePatch,
  resolvePageRouteRoute,
  resolvePagesList,
  resolvePublicationRoute,
  resolveVersionRoute,
} from "./ops.js";
import { readPathParts } from "./path.js";

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const readJSONBody = async <T>(request: IncomingMessage): Promise<T | null> => {
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

export const handlePagesRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const parts = readPathParts(request);
  if (parts[0] !== "api" || parts[1] !== "pages") {
    return false;
  }

  if (request.method === "GET" && parts.length === 2) {
    writeJson(response, 200, { items: await resolvePagesList() });
    return true;
  }

  if (request.method === "POST" && parts.length === 2) {
    const result = await resolvePageCreate(await readJSONBody<CreatePageInput>(request));
    if (result.status === "invalid_payload") {
      response.statusCode = 400;
      response.end();
      return true;
    }

    if (result.status === "conflict") {
      response.statusCode = 409;
      response.end();
      return true;
    }

    writeJson(response, 201, result.payload);
    return true;
  }

  const uuid = parts[2];
  if (uuid) {
    if (request.method === "GET" && parts.length === 3) {
      const result = await resolvePageGet(uuid);
      if (result.status !== "ok") {
        response.statusCode = result.status === "invalid_id" ? 400 : 404;
        response.end();
        return true;
      }

      writeJson(response, 200, result.payload);
      return true;
    }

    if (request.method === "PATCH" && parts.length === 3) {
      const result = await resolvePagePatch(uuid, await readJSONBody<UpdatePageInput>(request));
      if (result.status !== "ok") {
        response.statusCode = result.status === "invalid_payload" ? 400 : 404;
        response.end();
        return true;
      }

      writeJson(response, 200, result.payload);
      return true;
    }

    if (request.method === "DELETE" && parts.length === 3) {
      const deleted = await resolvePageDelete(uuid);
      if (!deleted) {
        response.statusCode = 404;
        response.end();
        return true;
      }

      response.statusCode = 204;
      response.end();
      return true;
    }
  }

  if (await resolvePublicationRoute()) {
    return true;
  }

  if (await resolveVersionRoute()) {
    return true;
  }

  if (await resolvePageRouteRoute()) {
    return true;
  }

  if (await resolveFoldersRoute()) {
    return true;
  }

  return false;
};
