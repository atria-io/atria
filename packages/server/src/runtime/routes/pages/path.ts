import type { IncomingMessage } from "node:http";

export const readPathParts = (request: IncomingMessage): string[] => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  return pathname.split("/").filter((part) => part !== "");
};
