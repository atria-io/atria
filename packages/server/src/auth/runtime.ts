import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { DEFAULT_AUTH_BROKER_ORIGIN, type AuthMethod } from "@atria/shared";
import { parseCookies, serializeCookie } from "./cookies.js";
import { hashSecret, verifySecret } from "./hash.js";
import {
  buildOAuthAuthorizationUrl,
  createOAuthStateId,
  getOAuthProfileFromCode,
  listConfiguredOAuthProviders
} from "./oauth.js";
import { createDbAuthStore, type AuthStore } from "./store.js";
import type { OAuthProfile, OAuthProviderId, OAuthState } from "./types.js";
import { validateLoginCredentials, validateRegisterCredentials } from "./validation.js";

const SESSION_COOKIE_NAME = "atria_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;
const SESSION_PRUNE_INTERVAL_MS = 60 * 1000;

interface CreateAuthRuntimeOptions {
  projectRoot: string;
  adminPort: number;
  projectId: string;
}

interface OwnerSetupState {
  pending: boolean;
  preferredAuthMethod: AuthMethod | null;
}

export interface AuthRuntime {
  handleRequest: (
    request: IncomingMessage,
    response: ServerResponse,
    requestUrl: URL
  ) => Promise<boolean>;
  hasUsers: () => Promise<boolean>;
  getOwnerSetupState: () => Promise<OwnerSetupState>;
  getSession: (request: IncomingMessage) => Promise<SessionResult>;
  close: () => Promise<void>;
}

interface SessionResult {
  authenticated: boolean;
  user:
    | {
        id: string;
        email: string | null;
        name: string | null;
        avatarUrl: string | null;
      }
    | null;
}

interface BrokerExchangePayload {
  projectId: string;
  provider: OAuthProviderId;
  user: {
    providerUserId: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
  };
}

interface BrokerConfirmPayload {
  code: string;
  projectId: string;
}

const isOAuthProviderId = (value: string): value is OAuthProviderId =>
  value === "google" || value === "github";

const parseProviderFromPath = (pathname: string, prefix: string): OAuthProviderId | null => {
  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const provider = pathname.slice(prefix.length).replace(/^\/+/, "").split("/")[0] ?? "";
  return isOAuthProviderId(provider) ? provider : null;
};

const parseConsentMode = (value: string | null): "auto" | "required" => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized || normalized === "auto") {
    return "auto";
  }

  if (normalized === "required") {
    return "required";
  }

  throw new Error("Invalid consent.");
};

const isOAuthOwnerMismatchError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const errorCode = (error as { code?: unknown }).code;
  return errorCode === "OAUTH_OWNER_MISMATCH";
};

const writeOwnerMismatchResponse = (response: ServerResponse): void => {
  writeJson(response, 403, {
    ok: false,
    error: "Account is not authorized for this Back Office.",
    reason: "owner_mismatch"
  });
};

const writeJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
};

const writeRedirect = (response: ServerResponse, location: string, cookieHeader?: string): void => {
  response.writeHead(302, cookieHeader ? { location, "set-cookie": cookieHeader } : { location });
  response.end();
};

const makeSessionId = (): string => randomBytes(32).toString("hex");

const nowMs = (): number => Date.now();

const getOrigin = (adminPort: number): string =>
  process.env.ATRIA_AUTH_ORIGIN?.trim() || `http://localhost:${adminPort}`;

const getProviderCallbackUrl = (provider: OAuthProviderId, adminPort: number): string =>
  `${getOrigin(adminPort)}/api/auth/callback/${provider}`;

const getBrokerOrigin = (): string | null => {
  const configured = process.env.ATRIA_AUTH_BROKER_ORIGIN?.trim();
  if (configured) {
    const lowered = configured.toLowerCase();
    if (lowered === "off" || lowered === "local" || lowered === "false") {
      return null;
    }
    return configured;
  }

  return DEFAULT_AUTH_BROKER_ORIGIN;
};

const readRequestSessionId = (request: IncomingMessage): string | null => {
  const cookies = parseCookies(request.headers);
  return cookies[SESSION_COOKIE_NAME] ?? null;
};

const clearSessionCookie = (): string =>
  serializeCookie(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 0
  });

const createSessionCookie = (sessionId: string): string =>
  serializeCookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "Lax",
    maxAge: SESSION_MAX_AGE_SECONDS
  });

const createSessionResult = async (
  store: AuthStore,
  request: IncomingMessage,
  pruneExpiredSessions: () => Promise<void>
): Promise<SessionResult> => {
  const sessionId = readRequestSessionId(request);
  if (!sessionId) {
    return { authenticated: false, user: null };
  }

  await pruneExpiredSessions();

  const session = await store.getSessionById(sessionId);
  if (!session) {
    return { authenticated: false, user: null };
  }

  if (Date.parse(session.expiresAt) <= nowMs()) {
    await store.deleteSessionById(session.id);
    return { authenticated: false, user: null };
  }

  const user = await store.getUserById(session.userId);
  if (!user) {
    await store.deleteSessionById(session.id);
    return { authenticated: false, user: null };
  }

  const ownerUser = await store.getFirstUser();
  if (!ownerUser || ownerUser.id !== user.id) {
    await store.deleteSessionById(session.id);
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl
    }
  };
};

const parseJsonBody = async (request: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body) as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });

const toBrokerProviders = (payload: unknown): OAuthProviderId[] => {
  if (typeof payload !== "object" || payload === null || !("providers" in payload)) {
    return [];
  }

  const providers = (payload as { providers?: unknown }).providers;
  if (!Array.isArray(providers)) {
    return [];
  }

  return providers.filter((entry): entry is OAuthProviderId =>
    typeof entry === "string" ? isOAuthProviderId(entry) : false
  );
};

const listBrokerProviders = async (brokerOrigin: string): Promise<OAuthProviderId[]> => {
  try {
    const response = await fetch(`${brokerOrigin}/oauth/providers`, {
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as unknown;
    return toBrokerProviders(payload);
  } catch {
    return [];
  }
};

const parseBrokerExchangePayload = (payload: unknown): BrokerExchangePayload | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const typedPayload = payload as {
    ok?: unknown;
    project_id?: unknown;
    provider?: unknown;
    user?: {
      providerUserId?: unknown;
      provider_user_id?: unknown;
      email?: unknown;
      name?: unknown;
      avatarUrl?: unknown;
      avatar_url?: unknown;
      emailVerified?: unknown;
      email_verified?: unknown;
    };
  };

  if (typedPayload.ok !== true) {
    return null;
  }

  const projectId =
    typeof typedPayload.project_id === "string" ? typedPayload.project_id.trim() : "";
  if (!projectId) {
    return null;
  }

  if (typeof typedPayload.provider !== "string" || !isOAuthProviderId(typedPayload.provider)) {
    return null;
  }

  const user = typedPayload.user;
  if (!user) {
    return null;
  }

  const providerUserId =
    typeof user.providerUserId === "string"
      ? user.providerUserId
      : typeof user.provider_user_id === "string"
        ? user.provider_user_id
        : null;
  if (!providerUserId || providerUserId.length === 0) {
    return null;
  }

  const avatarUrl =
    typeof user.avatarUrl === "string"
      ? user.avatarUrl
      : typeof user.avatar_url === "string"
        ? user.avatar_url
        : null;

  const emailVerified = user.emailVerified === true || user.email_verified === true;

  return {
    projectId,
    provider: typedPayload.provider,
    user: {
      providerUserId,
      email: typeof user.email === "string" ? user.email : null,
      name: typeof user.name === "string" ? user.name : null,
      avatarUrl,
      emailVerified
    }
  };
};

const parseBrokerConfirmPayload = (payload: unknown): BrokerConfirmPayload | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const typedPayload = payload as {
    ok?: unknown;
    code?: unknown;
    project_id?: unknown;
  };

  if (typedPayload.ok !== true) {
    return null;
  }

  if (typeof typedPayload.code !== "string" || typedPayload.code.length === 0) {
    return null;
  }

  if (typeof typedPayload.project_id !== "string" || typedPayload.project_id.length === 0) {
    return null;
  }

  return {
    code: typedPayload.code,
    projectId: typedPayload.project_id
  };
};

const exchangeBrokerCode = async (
  brokerOrigin: string,
  code: string,
  projectId: string
): Promise<OAuthProfile> => {
  const exchangeUrl = new URL("/oauth/exchange", brokerOrigin);
  exchangeUrl.searchParams.set("code", code);
  exchangeUrl.searchParams.set("project_id", projectId);

  const response = await fetch(exchangeUrl.toString(), {
    method: "GET",
    headers: {
      accept: "application/json"
    }
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  const parsed = parseBrokerExchangePayload(payload);
  if (!response.ok || !parsed || parsed.projectId !== projectId) {
    const errorMessage =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: unknown }).error
        : null;
    throw new Error(
      `Broker code exchange failed${typeof errorMessage === "string" ? `: ${errorMessage}` : "."}`
    );
  }

  return {
    provider: parsed.provider,
    providerUserId: parsed.user.providerUserId,
    email: parsed.user.email,
    name: parsed.user.name,
    avatarUrl: parsed.user.avatarUrl,
    emailVerified: parsed.user.emailVerified
  };
};

const confirmBrokerConsentToken = async (
  brokerOrigin: string,
  consentToken: string,
  projectId: string
): Promise<string> => {
  const confirmUrl = new URL("/oauth/confirm", brokerOrigin);
  confirmUrl.searchParams.set("consent_token", consentToken);

  const response = await fetch(confirmUrl.toString(), {
    method: "GET",
    headers: {
      accept: "application/json"
    }
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  const parsed = parseBrokerConfirmPayload(payload);
  if (!response.ok || !parsed || parsed.projectId !== projectId) {
    const errorMessage =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: unknown }).error
        : null;
    throw new Error(
      `Broker consent confirmation failed${typeof errorMessage === "string" ? `: ${errorMessage}` : "."}`
    );
  }

  return parsed.code;
};

export const createAuthRuntime = (options: CreateAuthRuntimeOptions): AuthRuntime => {
  if (!options.projectId.trim()) {
    throw new Error("Project ID is required for OAuth broker flows.");
  }

  const store = createDbAuthStore(options.projectRoot);
  const oauthStates = new Map<string, OAuthState>();
  let lastExpiredSessionCleanupAt = 0;

  const pruneExpiredSessionsIfNeeded = async (): Promise<void> => {
    const now = nowMs();
    if (now - lastExpiredSessionCleanupAt < SESSION_PRUNE_INTERVAL_MS) {
      return;
    }

    lastExpiredSessionCleanupAt = now;
    await store.deleteExpiredSessions(new Date(now).toISOString());
  };

  const issueSession = async (userId: string): Promise<string> => {
    await pruneExpiredSessionsIfNeeded();

    const sessionId = makeSessionId();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(nowMs() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
    await store.createSession({
      id: sessionId,
      userId,
      createdAt,
      expiresAt
    });
    return sessionId;
  };

  const consumeState = (stateId: string): OAuthState | null => {
    const existingState = oauthStates.get(stateId);
    if (!existingState) {
      return null;
    }

    oauthStates.delete(stateId);
    if (Date.parse(existingState.expiresAt) <= nowMs()) {
      return null;
    }

    return existingState;
  };

  const handleStart = async (
    provider: OAuthProviderId,
    response: ServerResponse,
    requestUrl: URL
  ): Promise<void> => {
    const nextPath = requestUrl.searchParams.get("next");
    const redirectPath = nextPath && nextPath.startsWith("/") ? nextPath : "/";
    const mode = requestUrl.searchParams.get("mode");
    const returnPath = mode === "login" ? "/" : mode === "create" ? "/create" : "/setup";
    const returnTo = new URL(returnPath, getOrigin(options.adminPort));
    returnTo.searchParams.set("provider", provider);
    if (redirectPath !== "/") {
      returnTo.searchParams.set("next", redirectPath);
    }

    let consentMode: "auto" | "required";
    try {
      consentMode = parseConsentMode(requestUrl.searchParams.get("consent"));
    } catch (error) {
      writeJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid consent."
      });
      return;
    }

    const brokerOrigin = getBrokerOrigin();
    if (brokerOrigin) {
      const brokerProviders = await listBrokerProviders(brokerOrigin);
      if (brokerProviders.includes(provider)) {
        const brokerStartUrl = new URL(`/v1/auth/login/${provider}`, brokerOrigin);
        brokerStartUrl.searchParams.set("origin", returnTo.toString());
        if (consentMode === "required") {
          brokerStartUrl.searchParams.set("consent", "required");
        }
        brokerStartUrl.searchParams.set("projectId", options.projectId);
        writeRedirect(response, brokerStartUrl.toString());
        return;
      }
    }

    const configuredProviders = listConfiguredOAuthProviders();
    if (!configuredProviders.includes(provider)) {
      writeJson(response, 400, {
        ok: false,
        error: `OAuth provider "${provider}" is not configured.`
      });
      return;
    }

    const stateId = createOAuthStateId();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(nowMs() + OAUTH_STATE_MAX_AGE_MS).toISOString();

    oauthStates.set(stateId, {
      id: stateId,
      provider,
      createdAt,
      expiresAt,
      redirectPath
    });

    const callbackUrl = getProviderCallbackUrl(provider, options.adminPort);
    const authorizationUrl = buildOAuthAuthorizationUrl(provider, callbackUrl, stateId);
    writeRedirect(response, authorizationUrl);
  };

  const handleCallback = async (
    provider: OAuthProviderId,
    response: ServerResponse,
    requestUrl: URL
  ): Promise<void> => {
    const code = requestUrl.searchParams.get("code");
    const stateId = requestUrl.searchParams.get("state");
    if (!code || !stateId) {
      writeJson(response, 400, {
        ok: false,
        error: "Missing OAuth callback parameters."
      });
      return;
    }

    const state = consumeState(stateId);
    if (!state || state.provider !== provider) {
      writeJson(response, 400, {
        ok: false,
        error: "Invalid or expired OAuth state."
      });
      return;
    }

    try {
      const callbackUrl = getProviderCallbackUrl(provider, options.adminPort);
      const profile = await getOAuthProfileFromCode(provider, code, callbackUrl);
      const user = await store.upsertOAuthProfile(profile);
      await store.clearPreferredAuthMethod();
      const sessionId = await issueSession(user.id);

      writeRedirect(response, state.redirectPath || "/", createSessionCookie(sessionId));
    } catch (error) {
      if (isOAuthOwnerMismatchError(error)) {
        writeOwnerMismatchResponse(response);
        return;
      }

      writeJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "OAuth callback failed."
      });
    }
  };

  const handleBrokerExchange = async (
    request: IncomingMessage,
    response: ServerResponse,
    requestUrl: URL
  ): Promise<void> => {
    const brokerOrigin = getBrokerOrigin();
    if (!brokerOrigin) {
      writeJson(response, 400, {
        ok: false,
        error: "OAuth broker is disabled."
      });
      return;
    }

    let code = requestUrl.searchParams.get("code");
    if (!code && request.method === "POST") {
      const payload = await parseJsonBody(request);
      const bodyCode = payload.code;
      code = typeof bodyCode === "string" ? bodyCode : null;
    }

    if (!code) {
      writeJson(response, 400, {
        ok: false,
        error: "Missing broker code."
      });
      return;
    }

    try {
      const profile = await exchangeBrokerCode(brokerOrigin, code, options.projectId);
      const user = await store.upsertOAuthProfile(profile);
      await store.clearPreferredAuthMethod();
      const sessionId = await issueSession(user.id);

      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "set-cookie": createSessionCookie(sessionId)
      });
      response.end(
        JSON.stringify({
          ok: true,
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl
          }
        })
      );
    } catch (error) {
      if (isOAuthOwnerMismatchError(error)) {
        writeOwnerMismatchResponse(response);
        return;
      }

      writeJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Broker exchange failed."
      });
    }
  };

  const handleBrokerConfirm = async (
    request: IncomingMessage,
    response: ServerResponse,
    requestUrl: URL
  ): Promise<void> => {
    const brokerOrigin = getBrokerOrigin();
    if (!brokerOrigin) {
      writeJson(response, 400, {
        ok: false,
        error: "OAuth broker is disabled."
      });
      return;
    }

    let consentToken = requestUrl.searchParams.get("consent_token");
    if (!consentToken && request.method === "POST") {
      const payload = await parseJsonBody(request);
      const bodyToken = payload.consentToken ?? payload.consent_token;
      consentToken = typeof bodyToken === "string" ? bodyToken : null;
    }

    if (!consentToken) {
      writeJson(response, 400, {
        ok: false,
        error: "Missing broker consent token."
      });
      return;
    }

    try {
      const brokerCode = await confirmBrokerConsentToken(brokerOrigin, consentToken, options.projectId);
      const profile = await exchangeBrokerCode(brokerOrigin, brokerCode, options.projectId);
      const user = await store.upsertOAuthProfile(profile);
      await store.clearPreferredAuthMethod();
      const sessionId = await issueSession(user.id);

      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "set-cookie": createSessionCookie(sessionId)
      });
      response.end(
        JSON.stringify({
          ok: true,
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl
          }
        })
      );
    } catch (error) {
      if (isOAuthOwnerMismatchError(error)) {
        writeOwnerMismatchResponse(response);
        return;
      }

      writeJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Broker consent failed."
      });
    }
  };

  const parseRequestPayload = async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<Record<string, unknown> | null> => {
    try {
      return await parseJsonBody(request);
    } catch (error) {
      writeJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid JSON body."
      });
      return null;
    }
  };

  const respondAuthenticated = async (
    response: ServerResponse,
    user: {
      id: string;
      email: string | null;
      name: string | null;
      avatarUrl: string | null;
    }
  ): Promise<void> => {
    const sessionId = await issueSession(user.id);
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": createSessionCookie(sessionId)
    });
    response.end(
      JSON.stringify({
        ok: true,
        authenticated: true,
        user
      })
    );
  };

  const handleEmailRegister = async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    const payload = await parseRequestPayload(request, response);
    if (!payload) {
      return;
    }

    const validation = validateRegisterCredentials(payload);
    if (!validation.ok) {
      writeJson(response, 400, {
        ok: false,
        error: validation.error
      });
      return;
    }

    try {
      const passwordHash = await hashSecret(validation.value.password);
      const registration = await store.registerOwnerWithPassword({
        email: validation.value.email,
        passwordHash,
        name: validation.value.name
      });

      if (!registration.ok) {
        const errorMessage =
          registration.reason === "owner_exists"
            ? "Owner account already exists."
            : "Email is already in use.";

        writeJson(response, 409, {
          ok: false,
          error: errorMessage,
          reason: registration.reason
        });
        return;
      }

      await store.clearPreferredAuthMethod();
      await respondAuthenticated(response, {
        id: registration.user.id,
        email: registration.user.email,
        name: registration.user.name,
        avatarUrl: registration.user.avatarUrl
      });
    } catch (error) {
      writeJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Could not create owner account."
      });
    }
  };

  const handleEmailLogin = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const payload = await parseRequestPayload(request, response);
    if (!payload) {
      return;
    }

    const validation = validateLoginCredentials(payload);
    if (!validation.ok) {
      writeJson(response, 400, {
        ok: false,
        error: validation.error
      });
      return;
    }

    try {
      const userWithPassword = await store.getUserWithPasswordByEmail(validation.value.email);
      if (!userWithPassword) {
        writeJson(response, 401, {
          ok: false,
          error: "Invalid email or password."
        });
        return;
      }

      const isValidPassword = await verifySecret(
        validation.value.password,
        userWithPassword.passwordHash
      );

      if (!isValidPassword) {
        writeJson(response, 401, {
          ok: false,
          error: "Invalid email or password."
        });
        return;
      }

      const ownerUser = await store.getFirstUser();
      if (!ownerUser || ownerUser.id !== userWithPassword.user.id) {
        writeOwnerMismatchResponse(response);
        return;
      }

      await respondAuthenticated(response, userWithPassword.user);
    } catch (error) {
      writeJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Could not complete sign in."
      });
    }
  };

  return {
    hasUsers: (): Promise<boolean> => store.hasUsers(),

    getOwnerSetupState: (): Promise<OwnerSetupState> => store.getOwnerSetupState(),

    getSession: (request: IncomingMessage): Promise<SessionResult> =>
      createSessionResult(store, request, pruneExpiredSessionsIfNeeded),

    close: async (): Promise<void> => {
      await store.close();
    },

    handleRequest: async (
      request: IncomingMessage,
      response: ServerResponse,
      requestUrl: URL
    ): Promise<boolean> => {
      const pathname = requestUrl.pathname;
      if (!pathname.startsWith("/api/auth/")) {
        return false;
      }

      if (pathname === "/api/auth/providers") {
        const localProviders = listConfiguredOAuthProviders();
        const brokerOrigin = getBrokerOrigin();

        const providers = new Set<string>(["email", ...localProviders]);

        if (brokerOrigin) {
          const brokerProviders = await listBrokerProviders(brokerOrigin);
          for (const provider of brokerProviders) {
            providers.add(provider);
          }
        }

        writeJson(response, 200, {
          ok: true,
          providers: [...providers]
        });
        return true;
      }

      if (pathname === "/api/auth/session") {
        writeJson(response, 200, await createSessionResult(store, request, pruneExpiredSessionsIfNeeded));
        return true;
      }

      if (pathname === "/api/auth/logout") {
        const sessionId = readRequestSessionId(request);
        if (sessionId) {
          await store.deleteSessionById(sessionId);
        }
        response.writeHead(204, {
          "set-cookie": clearSessionCookie()
        });
        response.end();
        return true;
      }

      if (pathname === "/api/auth/email/register") {
        if (request.method !== "POST") {
          writeJson(response, 405, {
            ok: false,
            error: "Method not allowed."
          });
          return true;
        }

        await handleEmailRegister(request, response);
        return true;
      }

      if (pathname === "/api/auth/email/login") {
        if (request.method !== "POST") {
          writeJson(response, 405, {
            ok: false,
            error: "Method not allowed."
          });
          return true;
        }

        await handleEmailLogin(request, response);
        return true;
      }

      if (pathname === "/api/auth/broker/exchange") {
        await handleBrokerExchange(request, response, requestUrl);
        return true;
      }

      if (pathname === "/api/auth/broker/confirm") {
        await handleBrokerConfirm(request, response, requestUrl);
        return true;
      }

      const startProvider = parseProviderFromPath(pathname, "/api/auth/start/");
      if (startProvider) {
        await handleStart(startProvider, response, requestUrl);
        return true;
      }

      const callbackProvider = parseProviderFromPath(pathname, "/api/auth/callback/");
      if (callbackProvider) {
        await handleCallback(callbackProvider, response, requestUrl);
        return true;
      }

      writeJson(response, 404, {
        ok: false,
        error: "Auth endpoint not found."
      });
      return true;
    }
  };
};
