import type { ApiClient } from "../../../../state/api.client.js";
import { resolveBasePathUrl } from "../../../../state/api.client.js";
import type {
  AuthMode,
  AuthUser,
  ProviderId,
  ProvidersPayload,
  SessionPayload,
  SetupStatus
} from "../../../../types/auth.js";

export interface AuthBootstrapState {
  setupStatus: SetupStatus;
  providers: ProviderId[];
  session: SessionPayload;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface EmailAuthResult {
  ok: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  reason: string | null;
}

const sanitizeProviders = (providersPayload: ProvidersPayload | null): ProviderId[] => {
  if (!Array.isArray(providersPayload?.providers)) {
    return [];
  }

  return providersPayload.providers.filter(
    (provider): provider is ProviderId =>
      provider === "google" || provider === "github" || provider === "email"
  );
};

/**
 * Auth bootstrap read model for admin startup.
 * Missing or invalid backend payloads are normalized to safe
 * defaults so hooks can keep a single state shape.
 *
 * @param {ApiClient} apiClient
 * @returns {Promise<AuthBootstrapState>}
 */
export const loadAuthBootstrapState = async (apiClient: ApiClient): Promise<AuthBootstrapState> => {
  const [setupStatus, providersPayload, sessionPayload] = await Promise.all([
    apiClient.getJson<SetupStatus>("/api/setup/status"),
    apiClient.getJson<ProvidersPayload>("/api/auth/providers"),
    apiClient.getJson<SessionPayload>("/api/auth/session")
  ]);

  return {
    setupStatus: setupStatus ?? { pending: true, preferredAuthMethod: null },
    providers: sanitizeProviders(providersPayload),
    session: sessionPayload ?? { authenticated: false, user: null }
  };
};

export const exchangeBrokerCode = async (
  basePath: string,
  brokerCode: string
): Promise<EmailAuthResult> =>
  postBrokerAuth(basePath, "/api/auth/broker/exchange", { code: brokerCode });

export const confirmBrokerConsent = async (
  basePath: string,
  code: string
): Promise<EmailAuthResult> =>
  postBrokerAuth(basePath, "/api/auth/broker/confirm", { code });

/**
 * Runtime parser for email/broker auth responses where backend shape may drift.
 * Unknown payloads collapse to a non-authenticated result without throwing.
 *
 * @param {unknown} payload
 * @returns {EmailAuthResult}
 */
const parseEmailAuthResult = (payload: unknown): EmailAuthResult => {
  if (typeof payload !== "object" || payload === null) {
    return {
      ok: false,
      authenticated: false,
      user: null,
      error: null,
      reason: null
    };
  }

  const result = payload as {
    ok?: unknown;
    authenticated?: unknown;
    user?: unknown;
    error?: unknown;
    reason?: unknown;
  };

  const user = typeof result.user === "object" && result.user !== null ? (result.user as AuthUser) : null;

  return {
    ok: result.ok === true,
    authenticated: result.authenticated === true,
    user,
    error: typeof result.error === "string" ? result.error : null,
    reason: typeof result.reason === "string" ? result.reason : null
  };
};

const postEmailAuth = async (
  basePath: string,
  routePath: string,
  body: Record<string, string>
): Promise<EmailAuthResult> => {
  try {
    const response = await fetch(resolveBasePathUrl(basePath, routePath), {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(body)
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    return parseEmailAuthResult(payload);
  } catch {
    return {
      ok: false,
      authenticated: false,
      user: null,
      error: null,
      reason: null
    };
  }
};

const postBrokerAuth = async (
  basePath: string,
  routePath: string,
  body: Record<string, string>
): Promise<EmailAuthResult> => {
  try {
    const response = await fetch(resolveBasePathUrl(basePath, routePath), {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(body)
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    return parseEmailAuthResult(payload);
  } catch {
    return {
      ok: false,
      authenticated: false,
      user: null,
      error: null,
      reason: null
    };
  }
};

export const registerWithEmail = (
  basePath: string,
  input: RegisterInput
): Promise<EmailAuthResult> =>
  postEmailAuth(basePath, "/api/auth/email/register", {
    email: input.email,
    password: input.password,
    name: input.name
  });

export const loginWithEmail = (basePath: string, input: LoginInput): Promise<EmailAuthResult> =>
  postEmailAuth(basePath, "/api/auth/email/login", {
    email: input.email,
    password: input.password
  });

/**
 * OAuth kickoff URL contract shared with provider buttons and redirect hook.
 * `next` is only forwarded when it differs from root to keep callback URLs stable.
 *
 * @param {string} basePath
 * @param {ProviderId} provider
 * @param {AuthMode} mode
 * @param {string} nextPath
 * @returns {string}
 */
export const buildOAuthStartUrl = (
  basePath: string,
  provider: ProviderId,
  mode: AuthMode,
  nextPath: string
): string => {
  const query = new URLSearchParams();
  query.set("mode", mode);

  if (nextPath !== "/") {
    query.set("next", nextPath);
  }

  return `${resolveBasePathUrl(basePath, `api/auth/start/${provider}`)}?${query.toString()}`;
};
