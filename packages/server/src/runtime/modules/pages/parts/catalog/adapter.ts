import type { IncomingMessage, ServerResponse } from "node:http";
import type { CreatePageInput } from "../../types.js";
import {
  resolvePageCreate,
  resolvePagesList,
  toNullableString
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

export const handleCatalogRoutes = async (
  request: IncomingMessage,
  response: ServerResponse,
  parts: string[]
): Promise<boolean> => {
  if (request.method === "GET" && parts.length === 2) {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const items = await resolvePagesList({
      locale: toNullableString(requestUrl.searchParams.get("locale")),
      folderId: toNullableString(requestUrl.searchParams.get("folder")),
    });
    writeJson(response, 200, { items });
    return true;
  }

  if (request.method === "POST" && parts.length === 2) {
    const result = await resolvePageCreate(
      await readJsonBody<CreatePageInput>(request)
    );

    if (result.status === "invalid_slug") {
      writeJson(response, 400, { error: "Invalid slug" });
      return true;
    }

    if (result.status === "conflict") {
      writeJson(response, 409, { error: "Could not create page" });
      return true;
    }

    writeJson(response, 201, result.payload);
    return true;
  }

  return false;
};
