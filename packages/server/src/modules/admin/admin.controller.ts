import type { ServerResponse } from "node:http";
import type { AdminBootstrapResponse } from "./admin.types.js";

const getAdminBootstrapState = (): AdminBootstrapResponse => ({ state: "create" });

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const sendAdminBootstrap = (response: ServerResponse): void => {
  writeJson(response, 200, getAdminBootstrapState());
};

export const sendNotFound = (response: ServerResponse): void => {
  writeJson(response, 404, { error: "Not Found" });
};
