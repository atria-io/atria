import type { IncomingMessage, ServerResponse } from "node:http";
import { handleEditorRoutes } from "./parts/editor/adapter.js";
import { handleRoutesFeatureRoutes } from "./parts/routes/adapter.js";
import { handleFolderRoutes } from "./parts/folder/adapter.js";
import { handleCatalogRoutes } from "./parts/catalog/adapter.js";
import { readPathParts } from "./path.js";

export const handlePagesRoutes = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<boolean> => {
  const parts = readPathParts(request);
  if (parts[0] !== "api" || parts[1] !== "pages") {
    return false;
  }

  if (await handleCatalogRoutes(request, response, parts)) {
    return true;
  }

  if (await handleFolderRoutes(request, response, parts)) {
    return true;
  }

  if (await handleRoutesFeatureRoutes(request, response, parts)) {
    return true;
  }

  if (await handleEditorRoutes(request, response, parts)) {
    return true;
  }

  return false;
};
