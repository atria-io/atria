import type { IncomingMessage } from "node:http";

export const readAuthPathname = (request: IncomingMessage): string => {
  return new URL(request.url ?? "/", "http://localhost").pathname;
};
