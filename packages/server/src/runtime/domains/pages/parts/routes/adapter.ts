import type { IncomingMessage, ServerResponse } from "node:http";

export const handlePageRouteRoutes = async (
  _request: IncomingMessage,
  _response: ServerResponse,
  _parts: string[]
): Promise<boolean> => false;
