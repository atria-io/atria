import type { IncomingMessage, ServerResponse } from "node:http";
import type { UpdatePageInput } from "../../types.js";
import {
  resolvePageDelete,
  resolvePageGet,
  resolvePagePatch,
  resolvePagePublish,
  resolvePageUnpublish,
  resolvePageVersionGet,
  resolvePageVersionsList,
} from "./logic.js";

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

export const handleEditorRoutes = async (
  request: IncomingMessage,
  response: ServerResponse,
  parts: string[]
): Promise<boolean> => {
  const uuid = parts[2];
  if (!uuid) {
    return false;
  }

  if (request.method === "GET" && parts.length === 3) {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const page = await resolvePageGet(uuid, {
      locale: requestUrl.searchParams.get("locale"),
      versionId: requestUrl.searchParams.get("version"),
    });
    if (!page) {
      writeJson(response, 404, { error: "Page not found" });
      return true;
    }

    writeJson(response, 200, page);
    return true;
  }

  if (request.method === "PATCH" && parts.length === 3) {
    const result = await resolvePagePatch(
      uuid,
      await readJsonBody<UpdatePageInput>(request)
    );

    if (result.status === "invalid_payload") {
      writeJson(response, 400, { error: "Invalid payload" });
      return true;
    }

    if (result.status === "invalid_status") {
      writeJson(response, 400, { error: "Invalid status" });
      return true;
    }

    if (result.status === "not_found") {
      writeJson(response, 404, { error: "Page not found" });
      return true;
    }

    writeJson(response, 200, result.payload);
    return true;
  }

  if (request.method === "DELETE" && parts.length === 3) {
    if (!(await resolvePageDelete(uuid))) {
      writeJson(response, 404, { error: "Page not found" });
      return true;
    }

    writeNoContent(response);
    return true;
  }

  if (request.method === "POST" && parts[3] === "publish" && parts.length === 4) {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const payload = await readJsonBody<{ actor?: string }>(request);
    const published = await resolvePagePublish(uuid, {
      actor: payload?.actor,
      locale: requestUrl.searchParams.get("locale"),
    });
    if (!published) {
      writeJson(response, 404, { error: "Page not found" });
      return true;
    }

    writeJson(response, 200, published);
    return true;
  }

  if (request.method === "POST" && parts[3] === "unpublish" && parts.length === 4) {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const page = await resolvePageUnpublish(uuid, requestUrl.searchParams.get("locale"));
    if (!page) {
      writeJson(response, 404, { error: "Page not found" });
      return true;
    }

    writeJson(response, 200, page);
    return true;
  }

  if (request.method === "GET" && parts[3] === "versions" && parts.length === 4) {
    writeJson(response, 200, { items: await resolvePageVersionsList(uuid) });
    return true;
  }

  if (request.method === "GET" && parts[3] === "versions" && parts.length === 5) {
    const version = await resolvePageVersionGet(uuid, parts[4] ?? "");
    if (!version) {
      writeJson(response, 404, { error: "Version not found" });
      return true;
    }

    writeJson(response, 200, version);
    return true;
  }

  return false;
};
