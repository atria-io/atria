import type { ServerResponse } from "node:http";
import type { BrokerConsentPlaceholderResponse } from "./broker.types.js";

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const sendBrokerConsentPlaceholder = async (response: ServerResponse): Promise<void> => {
  const payload: BrokerConsentPlaceholderResponse = {
    status: "placeholder",
    message: "Broker consent endpoint placeholder",
  };

  writeJson(response, 200, payload);
};
