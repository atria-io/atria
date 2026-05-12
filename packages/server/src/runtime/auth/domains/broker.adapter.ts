import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveBrokerOrigin, resolveBrokerProjectId } from "./broker.config.js";
import { resolveBrokerCodeToSession, resolveBrokerConfirm } from "./broker.logic.js";
import type {
  BrokerConfirmPayload,
  BrokerConfirmErrorResponse,
  BrokerProvider,
} from "./broker.types.js";
import {
  allowAuthRequest,
  buildTransientCookie,
  buildSessionCookie,
  isTrustedOrigin,
} from "../security.js";

const writeJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const writeBrokerConfirmError = (
  response: ServerResponse,
  statusCode: number,
  error: BrokerConfirmErrorResponse["error"]
): void => {
  writeJson(
    response,
    statusCode,
    { ok: false, error } satisfies BrokerConfirmErrorResponse
  );
};

const writeGenericBrokerFailure = (
  response: ServerResponse,
  statusCode: number
): void => {
  writeBrokerConfirmError(response, statusCode, {
    code: "session_creation_failed",
    title: "Authentication failed",
    message: "Unable to complete authentication.",
    retryable: statusCode >= 500,
    backToSignIn: true,
  });
};

const sendOAuthFailureRedirect = (
  request: IncomingMessage,
  response: ServerResponse,
  location: string
): void => {
  response.statusCode = 302;
  response.setHeader("Set-Cookie", buildTransientCookie(request, "atria_signin_error", "oauth_failed", 30));
  response.setHeader("Location", location);
  response.end();
};

const toStringValue = (
  value: unknown
): string =>
  typeof value === "string" ? value.trim() : "";

const isSupportedProvider = (
  provider: string
): provider is BrokerProvider =>
  provider === "google" || provider === "github";

const readJSONBody = async (
  request: IncomingMessage
): Promise<BrokerConfirmPayload | null> => {
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

const getSignInFailureReturnPath = (
  request: IncomingMessage
): string => {
  const rawReferer = toStringValue(request.headers.referer);
  if (rawReferer === "") {
    return "/";
  }

  try {
    const referer = new URL(rawReferer);
    const host = toStringValue(request.headers.host);
    if (host !== "" && referer.host !== host) {
      return "/";
    }
    return `${referer.pathname}${referer.search}${referer.hash}`;
  } catch {
    return "/";
  }
};

export const sendBrokerConfirm = async (
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  if (!isTrustedOrigin(request)) {
    response.statusCode = 403;
    response.end();
    return;
  }

  if (!allowAuthRequest(request, "auth:broker-consent")) {
    response.statusCode = 429;
    response.end();
    return;
  }

  const payload = await readJSONBody(request);
  const provider = toStringValue(payload?.provider).toLowerCase();
  const projectId = toStringValue(payload?.project_id);
  const brokerConsentToken = toStringValue(payload?.broker_consent_token);
  const brokerCode = toStringValue(payload?.broker_code);

  const outcome = await resolveBrokerConfirm({
    isSupportedProvider: isSupportedProvider(provider),
    projectId,
    brokerConsentToken,
    brokerCode,
  });

  if (outcome.status === "ok") {
    response.statusCode = 204;
    response.setHeader("Set-Cookie", buildSessionCookie(request, outcome.sessionId));
    response.end();
    return;
  }

  if (outcome.code === "invalid_payload") {
    writeGenericBrokerFailure(response, 400);
    return;
  }

  if (outcome.code === "consent_rejected") {
    writeGenericBrokerFailure(response, 401);
    return;
  }

  if (outcome.code === "broker_confirm_failed") {
    writeGenericBrokerFailure(response, 502);
    return;
  }

  if (outcome.code === "no_user_available") {
    writeGenericBrokerFailure(response, 401);
    return;
  }

  writeGenericBrokerFailure(response, 401);
};

const getRequestProtocol = (
  request: IncomingMessage
): string => {
  const forwardedProto = toStringValue(request.headers["x-forwarded-proto"]);
  if (forwardedProto !== "") {
    return forwardedProto.split(",")[0]?.trim() || "http";
  }

  return "http";
};

const getRequestHost = (
  request: IncomingMessage
): string => {
  const forwardedHost = toStringValue(request.headers["x-forwarded-host"]);
  if (forwardedHost !== "") {
    return forwardedHost.split(",")[0]?.trim() || "localhost";
  }

  const hostHeader = toStringValue(request.headers.host);
  return hostHeader === "" ? "localhost" : hostHeader;
};

const getSafeNextPath = (
  requestUrl: URL
): string => {
  const nextPath = toStringValue(requestUrl.searchParams.get("next"));
  return nextPath.startsWith("/") ? nextPath : "/";
};

const parseConsentMode = (
  requestUrl: URL
): "auto" | "required" => {
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

const sendBrokerProviderStart = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider,
  mode: "create" | "sign-in"
): Promise<void> => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const protocol = getRequestProtocol(request);
  const host = getRequestHost(request);
  const nextPath = getSafeNextPath(requestUrl);
  const returnTo = new URL(`/api/auth/callback/${provider}`, `${protocol}://${host}`);
  returnTo.searchParams.set("mode", mode);
  if (nextPath !== "/") {
    returnTo.searchParams.set("next", nextPath);
  }

  const projectIdFromQuery = toStringValue(
    requestUrl.searchParams.get("project_id") ??
      requestUrl.searchParams.get("projectId")
  );
  const projectId =
    projectIdFromQuery !== ""
      ? projectIdFromQuery
      : await resolveBrokerProjectId();
  if (projectId === "") {
    writeJson(response, 500, { error: "Missing projectId." });
    return;
  }

  let consentMode: "auto" | "required" = "auto";
  if (mode === "create") {
    try {
      consentMode = parseConsentMode(requestUrl);
    } catch (error) {
      writeJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid consent.",
      });
      return;
    }
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

export const sendBrokerProviderEntry = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  return sendBrokerProviderStart(request, response, provider, "create");
};

export const sendProviderSignInStart = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  return sendBrokerProviderStart(request, response, provider, "sign-in");
};

export const sendBrokerProviderCallback = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const mode = toStringValue(requestUrl.searchParams.get("mode"));
  if (mode !== "create" && mode !== "sign-in") {
    writeJson(response, 400, {
      ok: false,
      error: "Invalid OAuth callback mode.",
    });
    return;
  }

  const nextPath = getSafeNextPath(requestUrl);
  const callbackProviderRaw = toStringValue(
    requestUrl.searchParams.get("provider")
  ).toLowerCase();
  const callbackProvider = isSupportedProvider(callbackProviderRaw)
    ? callbackProviderRaw
    : provider;
  const projectId = toStringValue(requestUrl.searchParams.get("project_id"));
  const brokerConsentToken = toStringValue(
    requestUrl.searchParams.get("broker_consent_token")
  );
  const brokerCode = toStringValue(
    requestUrl.searchParams.get("broker_code") ??
      requestUrl.searchParams.get("code")
  );

  if (projectId === "") {
    response.statusCode = 400;
    response.end("Missing project_id.");
    return;
  }

  if (brokerCode !== "") {
    const sessionResult = await resolveBrokerCodeToSession(brokerCode, projectId);
    if (sessionResult.status !== "ok") {
      sendOAuthFailureRedirect(request, response, getSignInFailureReturnPath(request));
      return;
    }

    response.statusCode = 302;
    response.setHeader("Set-Cookie", buildSessionCookie(request, sessionResult.sessionId));
    response.setHeader("Location", nextPath === "/" ? "/" : nextPath);
    response.end();
    return;
  }

  if (brokerConsentToken !== "" && mode === "create") {
    const redirectParams = new URLSearchParams();
    redirectParams.set("screen", "consent");
    redirectParams.set("provider", callbackProvider);
    redirectParams.set("project_id", projectId);
    redirectParams.set("code", brokerConsentToken);
    if (nextPath !== "/") {
      redirectParams.set("next", nextPath);
    }

    const consentPath = mode === "create" ? "/create" : "/";
    response.statusCode = 302;
    response.setHeader("Location", `${consentPath}?${redirectParams.toString()}`);
    response.end();
    return;
  }

  sendOAuthFailureRedirect(request, response, getSignInFailureReturnPath(request));
};
