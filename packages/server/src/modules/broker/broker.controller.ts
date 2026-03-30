import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { createOwner, createSession, getOwnerSetupState, openDatabase } from "@atria/db";
import { resolveBrokerOrigin, resolveBrokerProjectId } from "./broker.config.js";
import type { BrokerConfirmPayload, BrokerConfirmErrorResponse, BrokerProvider } from "./broker.types.js";

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
  brokerCode: string;
}

const confirmBrokerConsent = async (
  consentToken: string,
  projectId: string
): Promise<BrokerConfirmResult> => {
  try {
    const brokerConfirmUrl = new URL("/oauth/confirm", resolveBrokerOrigin());
    brokerConfirmUrl.searchParams.set("consent_token", consentToken);
    const brokerResponse = await fetch(brokerConfirmUrl, { method: "GET", headers: { Accept: "application/json" } });

    if (!brokerResponse.ok) {
      return {
        status: brokerResponse.status >= 400 && brokerResponse.status < 500 ? "rejected" : "failed",
        brokerCode: "",
      };
    }

    const rawPayload = (await brokerResponse.json()) as unknown;
    if (!rawPayload || typeof rawPayload !== "object") {
      return { status: "failed", brokerCode: "" };
    }

    const root = rawPayload as Record<string, unknown>;
    const explicitFailure = root.ok === false || root.success === false;
    if (explicitFailure) {
      return { status: "rejected", brokerCode: "" };
    }

    const confirmedProjectId = toStringValue(root.project_id ?? root.projectId);
    const brokerCode = toStringValue(root.code ?? root.broker_code ?? root.brokerCode);
    if (confirmedProjectId === "" || confirmedProjectId !== projectId || brokerCode === "") {
      return { status: "failed", brokerCode: "" };
    }

    return { status: "ok", brokerCode };
  } catch {
    return { status: "failed", brokerCode: "" };
  }
};

const readObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
};

const getBrokerExchangeEmail = (payload: unknown): string | null => {
  const root = readObject(payload);
  if (!root) {
    return null;
  }

  const user = readObject(root.user);
  const nested = readObject(root.data);
  const nestedUser = nested ? readObject(nested.user) : null;
  const source = user ?? nestedUser;
  if (!source) {
    return null;
  }

  const email = toStringValue(source.email ?? source.user_email ?? source.userEmail);
  return email === "" ? null : email;
};

const exchangeBrokerCode = async (
  brokerCode: string,
  projectId: string
): Promise<{ status: "ok" | "rejected" | "failed"; email: string | null }> => {
  try {
    const brokerExchangeUrl = new URL("/oauth/exchange", resolveBrokerOrigin());
    brokerExchangeUrl.searchParams.set("code", brokerCode);
    brokerExchangeUrl.searchParams.set("project_id", projectId);
    const brokerResponse = await fetch(brokerExchangeUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!brokerResponse.ok) {
      return {
        status: brokerResponse.status >= 400 && brokerResponse.status < 500 ? "rejected" : "failed",
        email: null,
      };
    }

    const rawPayload = (await brokerResponse.json()) as unknown;
    return { status: "ok", email: getBrokerExchangeEmail(rawPayload) };
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

interface SessionResult {
  status: "ok" | "failed" | "no-user";
  sessionId: string;
}

const createSessionFromBrokerExchange = async (email: string | null): Promise<SessionResult> => {
  const userId = await getBrokerUserId();
  if (!userId) {
    const createdOwnerId = await createBrokerOwnerIfNeeded(email);
    if (!createdOwnerId) {
      return { status: "no-user", sessionId: "" };
    }

    const createdOwnerSession = await createSession(createdOwnerId);
    if (!createdOwnerSession) {
      return { status: "failed", sessionId: "" };
    }

    return { status: "ok", sessionId: createdOwnerSession.id };
  }

  const session = await createSession(userId);
  if (!session) {
    return { status: "failed", sessionId: "" };
  }

  return { status: "ok", sessionId: session.id };
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

  const confirmResult =
    brokerCode !== ""
      ? { status: "ok" as const, brokerCode }
      : await confirmBrokerConsent(brokerConsentToken, projectId);

  if (confirmResult.status !== "ok" || confirmResult.brokerCode === "") {
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

  const exchangeResult = await exchangeBrokerCode(confirmResult.brokerCode, projectId);
  if (exchangeResult.status !== "ok") {
    writeBrokerConfirmError(response, 502, {
      code: "broker_confirm_failed",
      title: "Broker unavailable",
      message: "Could not complete broker exchange.",
      retryable: true,
      backToLogin: false,
    });
    return;
  }

  const sessionResult = await createSessionFromBrokerExchange(exchangeResult.email);
  if (sessionResult.status === "no-user") {
    writeBrokerConfirmError(response, 401, {
      code: "no_user_available",
      title: "No eligible user",
      message: "No local user is available for authenticated session.",
      retryable: false,
      backToLogin: true,
    });
    return;
  }

  if (sessionResult.status !== "ok") {
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
  response.setHeader("Set-Cookie", `session=${sessionResult.sessionId}; Path=/; HttpOnly`);
  response.end();
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

const getSafeNextPath = (requestUrl: URL): string => {
  const nextPath = toStringValue(requestUrl.searchParams.get("next"));
  return nextPath.startsWith("/") ? nextPath : "/";
};

const getStartMode = (requestUrl: URL): "login" | "create" => {
  const mode = toStringValue(requestUrl.searchParams.get("mode"));
  return mode === "create" ? "create" : "login";
};

const getReturnPath = (mode: "login" | "create"): string => {
  return mode === "create" ? "/create" : "/";
};

const getCleanTargetPath = (mode: "login" | "create", nextPath: string): string => {
  if (nextPath !== "/") {
    return nextPath;
  }

  return mode === "create" ? "/" : "/";
};

const parseConsentMode = (requestUrl: URL): "auto" | "required" => {
  const consentRaw =
    toStringValue(requestUrl.searchParams.get("consent")) ||
    toStringValue(requestUrl.searchParams.get("consent_mode")) ||
    toStringValue(requestUrl.searchParams.get("consentMode"));
  const normalized = consentRaw.toLowerCase();
  if (normalized === "" || normalized === "auto") {
    return "auto";
  }

  if (normalized === "required") {
    return "required";
  }

  throw new Error("Invalid consent.");
};

export const sendBrokerProviderEntry = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const protocol = getRequestProtocol(request);
  const host = getRequestHost(request);
  const mode = getStartMode(requestUrl);
  const nextPath = getSafeNextPath(requestUrl);
  const returnTo = new URL(`/api/auth/callback/${provider}`, `${protocol}://${host}`);
  returnTo.searchParams.set("mode", mode);
  if (nextPath !== "/") {
    returnTo.searchParams.set("next", nextPath);
  }

  const projectIdFromQuery = toStringValue(
    requestUrl.searchParams.get("project_id") ?? requestUrl.searchParams.get("projectId")
  );
  const projectId = projectIdFromQuery !== "" ? projectIdFromQuery : await resolveBrokerProjectId();
  if (projectId === "") {
    writeJson(response, 500, { error: "Missing projectId." });
    return;
  }

  let consentMode: "auto" | "required";
  try {
    consentMode = parseConsentMode(requestUrl);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : "Invalid consent." });
    return;
  }

  const authorizationUrl = new URL(`/v1/auth/login/${provider}`, resolveBrokerOrigin());
  authorizationUrl.searchParams.set("origin", returnTo.toString());
  authorizationUrl.searchParams.set("projectId", projectId);
  if (consentMode === "required") {
    authorizationUrl.searchParams.set("consent", "required");
  }

  response.statusCode = 302;
  response.setHeader("Location", authorizationUrl.toString());
  response.end();
};

export const sendBrokerProviderCallback = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const mode = getStartMode(requestUrl);
  const nextPath = getSafeNextPath(requestUrl);
  const returnPath = getReturnPath(mode);

  const callbackProviderRaw = toStringValue(requestUrl.searchParams.get("provider")).toLowerCase();
  const callbackProvider = isSupportedProvider(callbackProviderRaw) ? callbackProviderRaw : provider;
  const projectId = toStringValue(requestUrl.searchParams.get("project_id"));
  const brokerConsentToken = toStringValue(requestUrl.searchParams.get("broker_consent_token"));
  const brokerCode = toStringValue(
    requestUrl.searchParams.get("broker_code") ?? requestUrl.searchParams.get("code")
  );

  if (projectId === "") {
    response.statusCode = 400;
    response.end("Missing project_id.");
    return;
  }

  if (brokerConsentToken !== "") {
    const redirectParams = new URLSearchParams();
    redirectParams.set("screen", "broker-consent");
    redirectParams.set("provider", callbackProvider);
    redirectParams.set("project_id", projectId);
    redirectParams.set("broker_consent_token", brokerConsentToken);
    if (nextPath !== "/") {
      redirectParams.set("next", nextPath);
    }

    response.statusCode = 302;
    response.setHeader("Location", `${returnPath}?${redirectParams.toString()}`);
    response.end();
    return;
  }

  if (brokerCode === "") {
    response.statusCode = 400;
    response.end("Missing broker code.");
    return;
  }

  const exchangeResult = await exchangeBrokerCode(brokerCode, projectId);
  if (exchangeResult.status !== "ok") {
    response.statusCode = 502;
    response.end("Broker exchange failed.");
    return;
  }

  const sessionResult = await createSessionFromBrokerExchange(exchangeResult.email);
  if (sessionResult.status === "no-user") {
    response.statusCode = 401;
    response.end("No eligible user.");
    return;
  }

  if (sessionResult.status !== "ok") {
    response.statusCode = 401;
    response.end("Session creation failed.");
    return;
  }

  response.statusCode = 302;
  response.setHeader("Set-Cookie", `session=${sessionResult.sessionId}; Path=/; HttpOnly`);
  response.setHeader("Location", getCleanTargetPath(mode, nextPath));
  response.end();
};
