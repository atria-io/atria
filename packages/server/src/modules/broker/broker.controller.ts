import type { IncomingMessage, ServerResponse } from "node:http";
import { createSession, openDatabase } from "@atria/db";
import type { BrokerConfirmPayload, BrokerConsentPlaceholderResponse } from "./broker.types.js";

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

const toStringValue = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const readJsonBody = async (request: IncomingMessage): Promise<BrokerConfirmPayload | null> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8").trim();
  if (rawBody === "") {
    return null;
  }

  try {
    return JSON.parse(rawBody) as BrokerConfirmPayload;
  } catch {
    return null;
  }
};

const getBrokerUserId = async (): Promise<string | null> => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const statements = [
      "SELECT id AS id FROM atria_users WHERE role = 'owner' LIMIT 1",
      "SELECT id AS id FROM atria_users WHERE is_owner = 1 LIMIT 1",
      "SELECT id AS id FROM atria_users LIMIT 1",
    ];

    for (const sql of statements) {
      try {
        const row = database.prepare(sql).get() as { id?: unknown } | undefined;
        const userId = toStringValue(row?.id);
        if (userId !== "") {
          return userId;
        }
      } catch {
        continue;
      }
    }

    return null;
  } finally {
    database.close();
  }
};

const isSupportedProvider = (provider: string): boolean => provider === "google" || provider === "github";

export const sendBrokerConfirm = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const payload = await readJsonBody(request);
  const provider = toStringValue(payload?.provider).toLowerCase();
  const projectId = toStringValue(payload?.project_id);
  const brokerConsentToken = toStringValue(payload?.broker_consent_token);

  if (!isSupportedProvider(provider) || projectId === "" || brokerConsentToken === "") {
    response.statusCode = 400;
    response.end();
    return;
  }

  const userId = await getBrokerUserId();
  if (!userId) {
    response.statusCode = 401;
    response.end();
    return;
  }

  const session = await createSession(userId);
  if (!session) {
    response.statusCode = 401;
    response.end();
    return;
  }

  response.statusCode = 204;
  response.setHeader("Set-Cookie", `session=${session.id}; Path=/; HttpOnly`);
  response.end();
};
