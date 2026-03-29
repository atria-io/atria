import type { IncomingMessage, ServerResponse } from "node:http";
import { createSession, openDatabase } from "@atria/db";
import { resolveBrokerOrigin } from "./broker.config.js";
import type {
  BrokerConfirmPayload,
  BrokerConsentPlaceholderResponse,
  BrokerExchangeResult,
  BrokerProvider,
} from "./broker.types.js";

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
const isSupportedProvider = (provider: string): provider is BrokerProvider =>
  provider === "google" || provider === "github";

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

export const sendBrokerConfirm = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const payload = await readJsonBody(request);
  const provider = toStringValue(payload?.provider).toLowerCase();
  const projectId = toStringValue(payload?.project_id);
  const brokerConsentToken = toStringValue(payload?.broker_consent_token);
  const brokerCode = toStringValue(payload?.broker_code);

  if (!isSupportedProvider(provider) || projectId === "" || (brokerConsentToken === "" && brokerCode === "")) {
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

const getRedirectUrl = (pathname: string, params: URLSearchParams): string => {
  const query = params.toString();
  return query === "" ? pathname : `${pathname}?${query}`;
};

const getNormalizedCodeParam = (value: unknown): string => {
  return toStringValue(value);
};

const readObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
};

const normalizeBrokerExchangeResult = (
  payload: unknown,
  fallbackProvider: BrokerProvider
): BrokerExchangeResult | null => {
  const root = readObject(payload);
  if (!root) {
    return null;
  }

  const nested = readObject(root.data);
  const source = nested ?? root;

  const providerValue = toStringValue(source.provider ?? root.provider).toLowerCase();
  const provider = isSupportedProvider(providerValue) ? providerValue : fallbackProvider;
  const projectId = toStringValue(source.project_id ?? source.projectId ?? root.project_id ?? root.projectId);
  const brokerConsentToken = toStringValue(
    source.broker_consent_token ??
      source.brokerConsentToken ??
      root.broker_consent_token ??
      root.brokerConsentToken
  );
  const brokerCode = getNormalizedCodeParam(
    source.broker_code ?? source.brokerCode ?? root.broker_code ?? root.brokerCode
  );

  if (projectId === "" || (brokerConsentToken === "" && brokerCode === "")) {
    return null;
  }

  return { provider, projectId, brokerConsentToken, brokerCode };
};

const exchangeBrokerCallback = async (
  request: IncomingMessage,
  provider: BrokerProvider
): Promise<BrokerExchangeResult | null> => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const brokerExchangeUrl = new URL("/api/auth/broker/exchange", resolveBrokerOrigin());
  const exchangeParams = new URLSearchParams(requestUrl.searchParams);
  exchangeParams.set("provider", provider);
  brokerExchangeUrl.search = exchangeParams.toString();

  const brokerResponse = await fetch(brokerExchangeUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!brokerResponse.ok) {
    return null;
  }

  const payload = (await brokerResponse.json()) as unknown;
  return normalizeBrokerExchangeResult(payload, provider);
};

export const sendBrokerProviderEntry = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const callbackParams = new URLSearchParams(requestUrl.searchParams);
  callbackParams.set("provider", provider);

  response.statusCode = 302;
  response.setHeader("Location", getRedirectUrl(`/broker/callback/${provider}`, callbackParams));
  response.end();
};

export const sendBrokerProviderCallback = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  const exchangeResult = await exchangeBrokerCallback(request, provider);
  if (!exchangeResult) {
    response.statusCode = 502;
    response.end();
    return;
  }

  const redirectParams = new URLSearchParams();

  redirectParams.set("screen", "broker-consent");
  redirectParams.set("provider", exchangeResult.provider);
  redirectParams.set("project_id", exchangeResult.projectId);
  if (exchangeResult.brokerConsentToken !== "") {
    redirectParams.set("broker_consent_token", exchangeResult.brokerConsentToken);
  }
  if (exchangeResult.brokerCode !== "") {
    redirectParams.set("broker_code", exchangeResult.brokerCode);
  }

  response.statusCode = 302;
  response.setHeader("Location", getRedirectUrl("/", redirectParams));
  response.end();
};
