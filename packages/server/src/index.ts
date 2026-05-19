import type { Server } from "node:http";

// @ts-ignore
import { startServer as startServerImpl } from "./http/server.js";

export interface startServerOptions {
  host?: string;
  port?: number;
}

export const startServer = startServerImpl as (
  options?: startServerOptions
) => Promise<Server>;
