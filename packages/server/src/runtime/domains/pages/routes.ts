import type { IncomingMessage, ServerResponse } from "node:http";
import { handleCrudRoutes } from "./parts/crud/adapter.js";
import { handlePublicationRoutes } from "./parts/publication/adapter.js";
import { handleVersionRoutes } from "./parts/versions/adapter.js";
import { handlePageRouteRoutes } from "./parts/routes/adapter.js";
import { handlePageFolderRoutes } from "./parts/folders/adapter.js";
import { readPathParts } from "./path.js";

export const handlePagesRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const parts = readPathParts(request);
  if (parts[0] !== "api" || parts[1] !== "pages") {
    return false;
  }

  if (await handleCrudRoutes(request, response, parts)) {
    return true;
  }

  if (await handlePublicationRoutes(request, response, parts)) {
    return true;
  }

  if (await handleVersionRoutes(request, response, parts)) {
    return true;
  }

  if (await handlePageRouteRoutes(request, response, parts)) {
    return true;
  }

  if (await handlePageFolderRoutes(request, response, parts)) {
    return true;
  }

  return false;
};
