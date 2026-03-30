import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { createSession, openDatabase } from "@atria/db";
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

const redirectToLoginWithOAuthFailure = (response: ServerResponse): void => {
  response.statusCode = 302;
  response.setHeader("Set-Cookie", "atria_login_error=oauth_failed; Path=/; Max-Age=30");
  response.setHeader("Location", "/login");
  response.end();
};

const toStringValue = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const toNullableString = (value: unknown): string | null => {
  const normalized = toStringValue(value);
  return normalized === "" ? null : normalized;
};
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

interface BrokerExchangeProfile {
  provider: BrokerProvider;
  providerUserId: string;
  projectId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
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

const parseBrokerExchangeProfile = (
  payload: unknown,
  expectedProjectId: string
): BrokerExchangeProfile | null => {
  const root = readObject(payload);
  if (!root) {
    return null;
  }

  const providerRaw = toStringValue(root.provider).toLowerCase();
  if (!isSupportedProvider(providerRaw)) {
    return null;
  }

  const projectId = toStringValue(root.project_id ?? root.projectId);
  if (projectId === "" || projectId !== expectedProjectId) {
    return null;
  }

  const user = readObject(root.user);
  if (!user) {
    return null;
  }

  const providerUserId = toStringValue(user.providerUserId ?? user.provider_user_id);
  if (providerUserId === "") {
    return null;
  }

  return {
    provider: providerRaw,
    providerUserId,
    projectId,
    email: toNullableString(user.email),
    name: toNullableString(user.name),
    avatarUrl: toNullableString(user.avatarUrl ?? user.avatar_url),
  };
};

const exchangeBrokerCode = async (
  brokerCode: string,
  projectId: string
): Promise<{ status: "ok" | "rejected" | "failed"; profile: BrokerExchangeProfile | null }> => {
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
        profile: null,
      };
    }

    const rawPayload = (await brokerResponse.json()) as unknown;
    const profile = parseBrokerExchangeProfile(rawPayload, projectId);
    return profile ? { status: "ok", profile } : { status: "failed", profile: null };
  } catch {
    return { status: "failed", profile: null };
  }
};

interface SessionResult {
  status: "ok" | "failed" | "no-user";
  sessionId: string;
}

const findUserIdByEmail = (database: Awaited<ReturnType<typeof openDatabase>>, email: string): string | null => {
  if (!database) {
    return null;
  }

  try {
    const row = database.prepare("SELECT id AS id FROM atria_users WHERE email = ? LIMIT 1").get(email) as
      | { id?: unknown }
      | undefined;
    const userId = toStringValue(row?.id);
    return userId === "" ? null : userId;
  } catch {
    return null;
  }
};

const findLinkedUserId = (
  database: Awaited<ReturnType<typeof openDatabase>>,
  profile: BrokerExchangeProfile
): string | null => {
  if (!database) {
    return null;
  }

  try {
    const row = database
      .prepare("SELECT user_id AS user_id FROM atria_identities WHERE provider = ? AND provider_user_id = ? LIMIT 1")
      .get(profile.provider, profile.providerUserId) as { user_id?: unknown } | undefined;
    const userId = toStringValue(row?.user_id);
    return userId === "" ? null : userId;
  } catch {
    return null;
  }
};

const createOAuthOwnerUser = (
  database: Awaited<ReturnType<typeof openDatabase>>,
  profile: BrokerExchangeProfile
): string | null => {
  if (!database || !profile.email) {
    return null;
  }

  const userId = randomUUID();
  const now = new Date().toISOString();
  const attempts: Array<{ sql: string; args: unknown[] }> = [
    {
      sql: "INSERT INTO atria_users (id, email, role, is_owner, name, avatar_url, created_at, updated_at) VALUES (?, ?, 'owner', 1, ?, ?, ?, ?)",
      args: [userId, profile.email, profile.name, profile.avatarUrl, now, now],
    },
    {
      sql: "INSERT INTO atria_users (id, email, role, is_owner, name, avatar_url) VALUES (?, ?, 'owner', 1, ?, ?)",
      args: [userId, profile.email, profile.name, profile.avatarUrl],
    },
    {
      sql: "INSERT INTO atria_users (id, email, role, is_owner) VALUES (?, ?, 'owner', 1)",
      args: [userId, profile.email],
    },
    {
      sql: "INSERT INTO atria_users (id, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [userId, profile.email, profile.name, profile.avatarUrl, now, now],
    },
    {
      sql: "INSERT INTO atria_users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)",
      args: [userId, profile.email, profile.name, profile.avatarUrl],
    },
    {
      sql: "INSERT INTO atria_users (id, email) VALUES (?, ?)",
      args: [userId, profile.email],
    },
  ];

  for (const attempt of attempts) {
    try {
      database.prepare(attempt.sql).run(...attempt.args);
      return userId;
    } catch {
      continue;
    }
  }

  return null;
};

const updateUserFromProfile = (
  database: Awaited<ReturnType<typeof openDatabase>>,
  userId: string,
  profile: BrokerExchangeProfile
): void => {
  if (!database) {
    return;
  }

  const now = new Date().toISOString();
  const attempts: Array<{ sql: string; args: unknown[] }> = [
    {
      sql: "UPDATE atria_users SET email = COALESCE(?, email), name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), updated_at = ? WHERE id = ?",
      args: [profile.email, profile.name, profile.avatarUrl, now, userId],
    },
    {
      sql: "UPDATE atria_users SET email = COALESCE(?, email), name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url) WHERE id = ?",
      args: [profile.email, profile.name, profile.avatarUrl, userId],
    },
    {
      sql: "UPDATE atria_users SET email = COALESCE(?, email) WHERE id = ?",
      args: [profile.email, userId],
    },
  ];

  for (const attempt of attempts) {
    try {
      database.prepare(attempt.sql).run(...attempt.args);
      return;
    } catch {
      continue;
    }
  }
};

const upsertIdentity = (
  database: Awaited<ReturnType<typeof openDatabase>>,
  userId: string,
  profile: BrokerExchangeProfile
): void => {
  if (!database) {
    return;
  }

  const now = new Date().toISOString();
  const updateAttempts: Array<{ sql: string; args: unknown[] }> = [
    {
      sql: "UPDATE atria_identities SET user_id = ?, email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE provider = ? AND provider_user_id = ?",
      args: [userId, profile.email, profile.name, profile.avatarUrl, now, profile.provider, profile.providerUserId],
    },
    {
      sql: "UPDATE atria_identities SET user_id = ?, email = ?, name = ?, avatar_url = ? WHERE provider = ? AND provider_user_id = ?",
      args: [userId, profile.email, profile.name, profile.avatarUrl, profile.provider, profile.providerUserId],
    },
  ];

  for (const attempt of updateAttempts) {
    try {
      database.prepare(attempt.sql).run(...attempt.args);
      break;
    } catch {
      continue;
    }
  }

  const insertAttempts: Array<{ sql: string; args: unknown[] }> = [
    {
      sql: "INSERT INTO atria_identities (provider, provider_user_id, user_id, email, name, avatar_url, linked_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        profile.provider,
        profile.providerUserId,
        userId,
        profile.email,
        profile.name,
        profile.avatarUrl,
        now,
        now,
      ],
    },
    {
      sql: "INSERT OR REPLACE INTO atria_identities (provider, provider_user_id, user_id, email, name, avatar_url, linked_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        profile.provider,
        profile.providerUserId,
        userId,
        profile.email,
        profile.name,
        profile.avatarUrl,
        now,
        now,
      ],
    },
  ];

  for (const attempt of insertAttempts) {
    try {
      database.prepare(attempt.sql).run(...attempt.args);
      return;
    } catch {
      continue;
    }
  }
};

const resolveOAuthUserId = async (
  profile: BrokerExchangeProfile,
  mode: "login" | "create"
): Promise<string | null> => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const ownerUserId = await getBrokerUserId();
    const linkedUserId = findLinkedUserId(database, profile);
    let userId = linkedUserId;

    if (mode === "login") {
      if (!userId) {
        return null;
      }
      updateUserFromProfile(database, userId, profile);
      return userId;
    }

    if (!userId && profile.email) {
      userId = findUserIdByEmail(database, profile.email);
    }

    if (!userId) {
      if (ownerUserId) {
        return null;
      }

      userId = createOAuthOwnerUser(database, profile);
    }

    if (!userId) {
      return null;
    }

    updateUserFromProfile(database, userId, profile);
    upsertIdentity(database, userId, profile);
    return userId;
  } finally {
    database.close();
  }
};

const createSessionFromBrokerExchange = async (profile: BrokerExchangeProfile | null): Promise<SessionResult> => {
  if (!profile) {
    return { status: "no-user", sessionId: "" };
  }

  const userId = await resolveOAuthUserId(profile, "create");
  if (!userId) {
    return { status: "no-user", sessionId: "" };
  }

  const session = await createSession(userId);
  if (!session) {
    return { status: "failed", sessionId: "" };
  }

  return { status: "ok", sessionId: session.id };
};

const createSessionFromLinkedProvider = async (provider: BrokerProvider): Promise<SessionResult> => {
  const database = await openDatabase();
  if (!database) {
    return { status: "failed", sessionId: "" };
  }

  try {
    let userId: string | null = null;
    try {
      const row = database
        .prepare("SELECT user_id AS user_id FROM atria_identities WHERE provider = ? LIMIT 1")
        .get(provider) as { user_id?: unknown } | undefined;
      userId = toNullableString(row?.user_id);
    } catch {
      userId = null;
    }

    if (!userId) {
      return { status: "no-user", sessionId: "" };
    }

    const session = await createSession(userId);
    if (!session) {
      return { status: "failed", sessionId: "" };
    }

    return { status: "ok", sessionId: session.id };
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

  const sessionResult = await createSessionFromBrokerExchange(exchangeResult.profile);
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

const getCleanTargetPath = (nextPath: string): string => {
  if (nextPath !== "/") {
    return nextPath;
  }

  return "/";
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
  const nextPath = getSafeNextPath(requestUrl);
  const returnTo = new URL(`/api/auth/callback/${provider}`, `${protocol}://${host}`);
  returnTo.searchParams.set("mode", "create");
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

export const sendProviderLoginStart = async (
  _request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  const sessionResult = await createSessionFromLinkedProvider(provider);
  if (sessionResult.status === "no-user") {
    redirectToLoginWithOAuthFailure(response);
    return;
  }

  if (sessionResult.status !== "ok") {
    redirectToLoginWithOAuthFailure(response);
    return;
  }

  response.statusCode = 302;
  response.setHeader("Set-Cookie", `session=${sessionResult.sessionId}; Path=/; HttpOnly`);
  response.setHeader("Location", "/");
  response.end();
};

export const sendBrokerProviderCallback = async (
  request: IncomingMessage,
  response: ServerResponse,
  provider: BrokerProvider
): Promise<void> => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const mode = toStringValue(requestUrl.searchParams.get("mode"));
  if (mode !== "create") {
    writeJson(response, 400, { ok: false, error: "Invalid OAuth callback mode." });
    return;
  }

  const nextPath = getSafeNextPath(requestUrl);
  const returnPath = "/create";

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

  const sessionResult = await createSessionFromBrokerExchange(exchangeResult.profile);
  if (sessionResult.status === "no-user") {
    response.statusCode = 302;
    response.setHeader("Location", "/?oauth_error=broker-login-failed");
    response.end();
    return;
  }

  if (sessionResult.status !== "ok") {
    response.statusCode = 401;
    response.end("Session creation failed.");
    return;
  }

  response.statusCode = 302;
  response.setHeader("Set-Cookie", `session=${sessionResult.sessionId}; Path=/; HttpOnly`);
  response.setHeader("Location", getCleanTargetPath(nextPath));
  response.end();
};
