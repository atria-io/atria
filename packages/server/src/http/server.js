import { createServer } from "node:http";
import * as db from "@atria/db";
import { createApp } from "../app.js";
import { routes } from "../app/routes.js";
import { internalError, notFound } from "./errors.js";
import { useSession } from "./session.js";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3333;

export const startServer = async (options = {}) => {
  await db.bootDB();

  const app = createApp();
  useSession(app);
  routes(app);

  app.use(async (_req, res) => {
    notFound(res);
  });

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  const server = createServer((req, res) => {
    void app.handle(req, res).catch(() => {
      if (!res.headersSent) {
        internalError(res);
        return;
      }
      res.end();
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  return server;
};
