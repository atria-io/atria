import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { createOwner, createSession, getOwnerSetupState, openDatabase } from "@atria/db";
import { resolveBrokerOrigin } from "./broker.config.js";
import type {
  BrokerConfirmPayload,
  BrokerConsentPlaceholderResponse,
  BrokerConfirmErrorResponse,
  BrokerExchangeResult,
  BrokerProvider,
} from "./broker.types.js";

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const writeBrokerConfirmError = (
  response: ServerResponse,
  statusCode: number,
  error: BrokerConfirmErrorResponse["error"]
): void => {
  writeJson(response, statusCode, { ok: false, error } satisfies BrokerConfirmErrorResponse);
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

interface BrokerConfirmResult {
  status: "ok" | "rejected" | "failed";
  email: string | null;
}

const getBrokerConfirmEmail = (payload: Record<string, unknown>): string | null => {
  const nested =
    payload.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : null;
  const source = nested ?? payload;
  const emailCandidates = [
    source.email,
    source.user_email,
    source.userEmail,
    source.owner_email,
    source.ownerEmail,
    payload.email,
    payload.user_email,
    payload.userEmail,
    payload.owner_email,
    payload.ownerEmail,
  ];

  for (const candidate of emailCandidates) {
    const email = toStringValue(candidate);
    if (email !== "") {
      return email;
    }
  }

  return null;
};

const confirmBrokerConsent = async (payload: {
  provider: BrokerProvider;
  project_id: string;
  broker_consent_token: string;
  broker_code: string;
}): Promise<BrokerConfirmResult> => {
  try {
    const brokerConfirmUrl = new URL("/api/auth/broker/confirm", resolveBrokerOrigin());
    const brokerResponse = await fetch(brokerConfirmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!brokerResponse.ok) {
      return {
        status: brokerResponse.status >= 400 && brokerResponse.status < 500 ? "rejected" : "failed",
        email: null,
      };
    }

    const contentType = toStringValue(brokerResponse.headers.get("content-type")).toLowerCase();
    if (!contentType.includes("application/json")) {
      return { status: "ok", email: null };
    }

    const rawPayload = (await brokerResponse.json()) as unknown;
    if (!rawPayload || typeof rawPayload !== "object") {
      return { status: "ok", email: null };
    }

    const root = rawPayload as Record<string, unknown>;
    const nested =
      root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
    const source = nested ?? root;
    const explicitFailure = source.ok === false || source.success === false || root.ok === false;
    if (explicitFailure) {
      return { status: "rejected", email: null };
    }

    return { status: "ok", email: getBrokerConfirmEmail(root) };
  } catch {
    return { status: "failed", email: null };
  }
};

const createBrokerOwnerIfNeeded = async (email: string | null): Promise<string | null> => {
  if (!email) {
    return null;
  }

  const ownerState = await getOwnerSetupState();
  if (ownerState !== "create") {
    return null;
  }

  const password = `broker-owner-${randomUUID()}`;
  return createOwner({ email, password });
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
    writeBrokerConfirmError(response, 400, {
      code: "invalid_payload",
      title: "Invalid consent payload",
      message: "Missing or invalid broker consent fields.",
      retryable: false,
      backToLogin: true,
    });
    return;
  }

  const confirmResult = await confirmBrokerConsent({
    provider,
    project_id: projectId,
    broker_consent_token: brokerConsentToken,
    broker_code: brokerCode,
  });
  if (confirmResult.status !== "ok") {
    if (confirmResult.status === "rejected") {
      writeBrokerConfirmError(response, 401, {
        code: "consent_rejected",
        title: "Consent rejected",
        message: "Broker did not accept this consent request.",
        retryable: true,
        backToLogin: true,
      });
      return;
    }

    writeBrokerConfirmError(response, 502, {
      code: "broker_confirm_failed",
      title: "Broker unavailable",
      message: "Could not confirm consent with broker.",
      retryable: true,
      backToLogin: false,
    });
    return;
  }

  const userId = await getBrokerUserId();
  if (!userId) {
    const createdOwnerId = await createBrokerOwnerIfNeeded(confirmResult.email);
    if (createdOwnerId) {
      const createdOwnerSession = await createSession(createdOwnerId);
      if (!createdOwnerSession) {
        writeBrokerConfirmError(response, 401, {
          code: "session_creation_failed",
          title: "Session failed",
          message: "Could not create authenticated session.",
          retryable: true,
          backToLogin: true,
        });
        return;
      }

      response.statusCode = 204;
      response.setHeader("Set-Cookie", `session=${createdOwnerSession.id}; Path=/; HttpOnly`);
      response.end();
      return;
    }

    writeBrokerConfirmError(response, 401, {
      code: "no_user_available",
      title: "No eligible user",
      message: "No local user is available for authenticated session.",
      retryable: false,
      backToLogin: true,
    });
    return;
  }

  const session = await createSession(userId);
  if (!session) {
    writeBrokerConfirmError(response, 401, {
      code: "session_creation_failed",
      title: "Session failed",
      message: "Could not create authenticated session.",
      retryable: true,
      backToLogin: true,
    });
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

const getRequestProtocol = (request: IncomingMessage): string => {
  const forwardedProto = toStringValue(request.headers["x-forwarded-proto"]);
  if (forwardedProto !== "") {
    return forwardedProto.split(",")[0]?.trim() || "http";
  }

  return "http";
};

const getRequestHost = (request: IncomingMessage): string => {
  const forwardedHost = toStringValue(request.headers["x-forwarded-host"]);
  if (forwardedHost !== "") {
    return forwardedHost.split(",")[0]?.trim() || "localhost";
  }

  const hostHeader = toStringValue(request.headers.host);
  return hostHeader === "" ? "localhost" : hostHeader;
};

const getServerCallbackUrl = (request: IncomingMessage, provider: BrokerProvider): string => {
  const protocol = getRequestProtocol(request);
  const host = getRequestHost(request);
  return `${protocol}://${host}/broker/callback/${provider}`;
};

const getProviderClientId = (provider: BrokerProvider): string => {
  const value =
    provider === "google"
      ? toStringValue(process.env.ATRIA_AUTH_GOOGLE_CLIENT_ID)
      : toStringValue(process.env.ATRIA_AUTH_GITHUB_CLIENT_ID);
  return value;
};

const getStateValue = (provider: BrokerProvider, requestUrl: URL): string => {
  const statePayload = {
    provider,
    project_id: toStringValue(requestUrl.searchParams.get("project_id")),
    return_to:
      toStringValue(requestUrl.searchParams.get("return_to")) ||
      toStringValue(requestUrl.searchParams.get("returnTo")) ||
      "/",
    consent_mode:
      toStringValue(requestUrl.searchParams.get("consent_mode")) ||
      toStringValue(requestUrl.searchParams.get("consentMode")),
    nonce: randomUUID(),
    issued_at: Date.now(),
  };

  return Buffer.from(JSON.stringify(statePayload), "utf-8").toString("base64url");
};

const getProviderAuthorizationUrl = (
  provider: BrokerProvider,
  clientId: string,
  redirectUri: string,
  state: string
): string => {
  if (provider === "github") {
    const githubUrl = new URL("https://github.com/login/oauth/authorize");
    githubUrl.searchParams.set("client_id", clientId);
    githubUrl.searchParams.set("redirect_uri", redirectUri);
    githubUrl.searchParams.set("response_type", "code");
    githubUrl.searchParams.set("scope", "read:user user:email");
    githubUrl.searchParams.set("state", state);
    return githubUrl.toString();
  }

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  return googleUrl.toString();
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
  const callbackUrl = getServerCallbackUrl(request, provider);
  const clientId = getProviderClientId(provider);
  if (clientId === "") {
    response.statusCode = 500;
    response.end();
    return;
  }

  const state = getStateValue(provider, requestUrl);
  const authorizationUrl = getProviderAuthorizationUrl(provider, clientId, callbackUrl, state);
  response.statusCode = 302;
  response.setHeader("Location", authorizationUrl);
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
