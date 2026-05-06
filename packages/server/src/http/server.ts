import { createServer, type Server } from "node:http";
import { sendInternalServerError } from "./errors.js";
import { routeRequest } from "./router.js";

export interface StartServerOptions {
  host?: string;
  port?: number;
}

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3333;

export const startServer = async (
  options: StartServerOptions = {}
): Promise<Server> => {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const server = createServer((request, response) => {
    void routeRequest(request, response).catch(() => {
      if (!response.headersSent) {
        sendInternalServerError(response);
        return;
      }

      response.end();
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return server;
};
