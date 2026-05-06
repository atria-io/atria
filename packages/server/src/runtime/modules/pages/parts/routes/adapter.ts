import type { IncomingMessage, ServerResponse } from "node:http";
import { resolvePageRouteRecord } from "./logic.js";

const writeJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const handleRoutesFeatureRoutes = async (
  request: IncomingMessage,
  response: ServerResponse,
  parts: string[]
): Promise<boolean> => {
  if (request.method !== "GET" || parts[2] !== "routes" || parts.length !== 4) {
    return false;
  }

  const pageUuid = parts[3];
  if (!pageUuid) {
    return false;
  }

  const record = await resolvePageRouteRecord(pageUuid);
  if (!record) {
    writeJson(response, 404, { error: "Page not found" });
    return true;
  }

  writeJson(response, 200, record);
  return true;
};
