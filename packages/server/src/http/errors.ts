import type { ServerResponse } from "node:http";

const writeJSON = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const sendHttpError = (
  response: ServerResponse,
  statusCode: number,
  message: string
): void => {
  writeJSON(response, statusCode, { error: message });
};

export const sendNotFound = (
  response: ServerResponse
): void => {
  sendHttpError(response, 404, "Not Found");
};

export const sendInternalServerError = (
  response: ServerResponse
): void => {
  sendHttpError(response, 500, "Internal Server Error");
};
