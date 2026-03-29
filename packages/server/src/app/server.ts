import { createServer, type Server } from "node:http";
import { routeRequest } from "./router.js";

export interface StartDevServerOptions {
  host?: string;
  port?: number;
}

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3333;

export const startDevServer = async (options: StartDevServerOptions = {}): Promise<Server> => {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const server = createServer(routeRequest);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return server;
};
