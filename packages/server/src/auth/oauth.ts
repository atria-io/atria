import { randomBytes } from "node:crypto";
import type { OAuthProfile, OAuthProviderId } from "./types.js";

interface OAuthProviderConfig {
  id: OAuthProviderId;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
}

interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface OAuthTokenResponse {
  accessToken: string;
}

interface GitHubEmailEntry {
  email?: unknown;
  primary?: unknown;
  verified?: unknown;
}

const PROVIDERS: Record<OAuthProviderId, OAuthProviderConfig> = {
  github: {
    id: "github",
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    scopes: ["read:user", "user:email"]
  },
  google: {
    id: "google",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "profile", "email"]
  }
};

const hasProviderConfig = (provider: OAuthProviderId): boolean => {
  if (provider === "github") {
    return Boolean(process.env.ATRIA_AUTH_GITHUB_CLIENT_ID && process.env.ATRIA_AUTH_GITHUB_CLIENT_SECRET);
  }

  return Boolean(process.env.ATRIA_AUTH_GOOGLE_CLIENT_ID && process.env.ATRIA_AUTH_GOOGLE_CLIENT_SECRET);
};

const getOAuthClientConfig = (
  provider: OAuthProviderId,
  callbackUrl: string
): OAuthClientConfig | null => {
  if (provider === "github") {
    const clientId = process.env.ATRIA_AUTH_GITHUB_CLIENT_ID;
    const clientSecret = process.env.ATRIA_AUTH_GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return null;
    }
    return { clientId, clientSecret, callbackUrl };
  }

  const clientId = process.env.ATRIA_AUTH_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.ATRIA_AUTH_GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret, callbackUrl };
};

const toJson = async (response: Response): Promise<Record<string, unknown>> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON response from OAuth provider: ${text}`);
  }
};

const exchangeCodeForAccessToken = async (
  provider: OAuthProviderId,
  code: string,
  callbackUrl: string
): Promise<OAuthTokenResponse> => {
  const providerConfig = PROVIDERS[provider];
  const clientConfig = getOAuthClientConfig(provider, callbackUrl);
  if (!providerConfig || !clientConfig) {
    throw new Error(`OAuth provider "${provider}" is not configured.`);
  }

  const body = new URLSearchParams({
    client_id: clientConfig.clientId,
    client_secret: clientConfig.clientSecret,
    code,
    redirect_uri: clientConfig.callbackUrl,
    grant_type: "authorization_code"
  });

  const tokenResponse = await fetch(providerConfig.tokenEndpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  const tokenPayload = await toJson(tokenResponse);
  const accessToken = typeof tokenPayload.access_token === "string" ? tokenPayload.access_token : null;

  if (!tokenResponse.ok || !accessToken) {
    const errorDescription =
      typeof tokenPayload.error_description === "string"
        ? tokenPayload.error_description
        : typeof tokenPayload.error === "string"
          ? tokenPayload.error
          : tokenResponse.statusText;
    throw new Error(`OAuth token exchange failed (${provider}): ${errorDescription}`);
  }

  return { accessToken };
};

const toGitHubEmailEntry = (value: unknown): GitHubEmailEntry | null =>
  typeof value === "object" && value !== null ? (value as GitHubEmailEntry) : null;

const getGitHubEmailValue = (entry: GitHubEmailEntry | null): string | null =>
  entry && typeof entry.email === "string" ? entry.email : null;

const isGitHubEmailVerified = (entry: GitHubEmailEntry | null): boolean =>
  Boolean(entry && entry.verified === true && typeof entry.email === "string");

const isGitHubEmailPrimaryAndVerified = (entry: GitHubEmailEntry | null): boolean =>
  Boolean(
    entry &&
      entry.primary === true &&
      entry.verified === true &&
      typeof entry.email === "string"
  );

const fetchGitHubProfile = async (accessToken: string): Promise<OAuthProfile> => {
  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      "user-agent": "atria-dev-server",
      accept: "application/vnd.github+json"
    }
  });
  const profilePayload = await toJson(profileResponse);
  if (!profileResponse.ok) {
    throw new Error(`GitHub profile request failed: ${profileResponse.statusText}`);
  }

  const githubUserId =
    typeof profilePayload.id === "number"
      ? String(profilePayload.id)
      : typeof profilePayload.id === "string"
        ? profilePayload.id
        : null;
  if (!githubUserId) {
    throw new Error("GitHub profile did not return a valid user id.");
  }

  let email = typeof profilePayload.email === "string" ? profilePayload.email : null;
  let emailVerified = false;

  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      "user-agent": "atria-dev-server",
      accept: "application/vnd.github+json"
    }
  });

  if (emailResponse.ok) {
    const emailPayload = (await toJson(emailResponse)) as unknown;
    if (Array.isArray(emailPayload)) {
      const entries = emailPayload
        .map((entry) => toGitHubEmailEntry(entry))
        .filter((entry): entry is GitHubEmailEntry => entry !== null);

      const verifiedPrimary = entries.find((entry) => isGitHubEmailPrimaryAndVerified(entry)) ?? null;
      const verifiedAny = entries.find((entry) => isGitHubEmailVerified(entry)) ?? null;
      const firstAny = entries.find((entry) => typeof entry.email === "string") ?? null;

      const verifiedPrimaryEmail = getGitHubEmailValue(verifiedPrimary);
      const verifiedAnyEmail = getGitHubEmailValue(verifiedAny);
      const firstAnyEmail = getGitHubEmailValue(firstAny);

      if (verifiedPrimaryEmail) {
        email = verifiedPrimaryEmail;
        emailVerified = true;
      } else if (verifiedAnyEmail) {
        email = verifiedAnyEmail;
        emailVerified = true;
      } else if (!email && firstAnyEmail) {
        email = firstAnyEmail;
      }

      if (email && !emailVerified) {
        const normalizedEmail = email.toLowerCase();
        const matchingVerified = entries.find((entry) => {
          if (!isGitHubEmailVerified(entry)) {
            return false;
          }

          const entryEmail = getGitHubEmailValue(entry);
          return entryEmail ? entryEmail.toLowerCase() === normalizedEmail : false;
        });

        emailVerified = matchingVerified !== undefined;
      }
    }
  }

  return {
    provider: "github",
    providerUserId: githubUserId,
    email,
    emailVerified,
    name: typeof profilePayload.name === "string" ? profilePayload.name : null,
    avatarUrl: typeof profilePayload.avatar_url === "string" ? profilePayload.avatar_url : null
  };
};

const fetchGoogleProfile = async (accessToken: string): Promise<OAuthProfile> => {
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json"
    }
  });
  const profilePayload = await toJson(profileResponse);
  if (!profileResponse.ok) {
    throw new Error(`Google profile request failed: ${profileResponse.statusText}`);
  }

  const googleUserId = typeof profilePayload.sub === "string" ? profilePayload.sub : null;
  if (!googleUserId) {
    throw new Error("Google profile did not return a valid user id.");
  }

  const email = typeof profilePayload.email === "string" ? profilePayload.email : null;
  const emailVerified = email !== null && profilePayload.email_verified === true;

  return {
    provider: "google",
    providerUserId: googleUserId,
    email,
    emailVerified,
    name: typeof profilePayload.name === "string" ? profilePayload.name : null,
    avatarUrl: typeof profilePayload.picture === "string" ? profilePayload.picture : null
  };
};

export const listConfiguredOAuthProviders = (): OAuthProviderId[] =>
  (Object.keys(PROVIDERS) as OAuthProviderId[]).filter((provider) => hasProviderConfig(provider));

export const buildOAuthAuthorizationUrl = (
  provider: OAuthProviderId,
  callbackUrl: string,
  stateId: string
): string => {
  const providerConfig = PROVIDERS[provider];
  const clientConfig = getOAuthClientConfig(provider, callbackUrl);
  if (!providerConfig || !clientConfig) {
    throw new Error(`OAuth provider "${provider}" is not configured.`);
  }

  const query = new URLSearchParams({
    client_id: clientConfig.clientId,
    redirect_uri: clientConfig.callbackUrl,
    response_type: "code",
    scope: providerConfig.scopes.join(" "),
    state: stateId
  });

  if (provider === "google") {
    query.set("access_type", "offline");
    query.set("prompt", "consent");
  }

  return `${providerConfig.authorizationEndpoint}?${query.toString()}`;
};

export const getOAuthProfileFromCode = async (
  provider: OAuthProviderId,
  code: string,
  callbackUrl: string
): Promise<OAuthProfile> => {
  const token = await exchangeCodeForAccessToken(provider, code, callbackUrl);
  if (provider === "github") {
    return fetchGitHubProfile(token.accessToken);
  }

  return fetchGoogleProfile(token.accessToken);
};

export const createOAuthStateId = (): string => randomBytes(24).toString("hex");
