import * as db from "@atria/db";
import * as security from "../security.js";
import { json } from "@atria/server/json.js";

const BROKER_ORIGIN = "https://api.atrialabs.pt";

const s = (value) => (typeof value === "string" ? value.trim() : "");
const isProvider = (value) => value === "google" || value === "github";

const origin = () => process.env.ATRIA_BROKER_ORIGIN?.trim() || BROKER_ORIGIN;
const projectEnv = () => process.env.ATRIA_PROJECT_ID?.trim();

const redirect = (res, location, cookie) => {
  res.statusCode = 302;
  if (cookie) {
    res.setHeader("Set-Cookie", cookie);
  }
  res.setHeader("Location", location);
  res.end();
};

const next = (req) => {
  const value = s(req.query?.next);
  return value.startsWith("/") ? value : "/";
};

const authError = (res, statusCode) => {
  res.json({
    ok: false,
    error: {
      code: "session_creation_failed",
      title: "Authentication failed",
      message: "Unable to complete authentication.",
      retryable: statusCode >= 500,
      backToSignIn: true,
    },
  }, statusCode);
};

const fetchJson = async (pathname, params) => {
  const url = new URL(pathname, origin());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const payload = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, payload };
  } catch {
    return { ok: false, status: 500, payload: null };
  }
};

const confirmCode = async (projectId, brokerConsentToken, brokerCode) => {
  if (brokerCode) {
    return { status: "ok", code: brokerCode };
  }

  const { ok, status, payload } = await fetchJson("/oauth/confirm", {
    consent_token: brokerConsentToken,
  });

  if (!ok) {
    return { status: status >= 400 && status < 500 ? "rejected" : "failed", code: "" };
  }

  const code = s(payload?.code ?? payload?.broker_code ?? payload?.brokerCode);
  const confirmedProjectId = s(payload?.project_id ?? payload?.projectId);
  if (!code || confirmedProjectId !== projectId || payload?.ok === false || payload?.success === false) {
    return { status: "rejected", code: "" };
  }

  return { status: "ok", code };
};

const exchange = async (brokerCode, projectId) => {
  const { ok, payload } = await fetchJson("/oauth/exchange", {
    code: brokerCode,
    project_id: projectId,
  });

  if (!ok) {
    return null;
  }

  const provider = s(payload?.provider).toLowerCase();
  const providerUserId = s(payload?.user?.providerUserId ?? payload?.user?.provider_user_id);
  const payloadProjectId = s(payload?.project_id ?? payload?.projectId);
  if (!isProvider(provider) || !providerUserId) {
    return null;
  }

  if (payloadProjectId && payloadProjectId !== projectId) {
    return null;
  }

  return {
    provider,
    providerUserId,
    projectId,
    email: s(payload?.user?.email) || null,
    name: s(payload?.user?.name) || null,
    avatarUrl: s(payload?.user?.avatarUrl ?? payload?.user?.avatar_url) || null,
  };
};

const exchangeSignIn = async (brokerCode, projectId) => {
  const params = { code: brokerCode };
  if (projectId) {
    params.project_id = projectId;
  }

  const { ok, payload } = await fetchJson("/oauth/exchange", params);
  if (!ok) {
    return null;
  }

  const provider = s(payload?.provider ?? payload?.user?.provider).toLowerCase();
  const providerUserId = s(
    payload?.user?.providerUserId ??
    payload?.user?.provider_user_id ??
    payload?.provider_user_id ??
    payload?.providerUserId ??
    payload?.user?.id ??
    payload?.id
  );
  if (!isProvider(provider) || !providerUserId) {
    return null;
  }

  return {
    provider,
    providerUserId,
    projectId: projectId || s(payload?.project_id ?? payload?.projectId) || null,
    email: s(payload?.user?.email) || null,
    name: s(payload?.user?.name) || null,
    avatarUrl: s(payload?.user?.avatarUrl ?? payload?.user?.avatar_url) || null,
  };
};

const sessionFromProfile = async (profile) => {
  const ownerUserId = await db.auth.getOwnerId();
  let userId = await db.auth.getIdentityUserId(profile.provider, profile.providerUserId);

  if (!userId && profile.email) {
    userId = await db.auth.getEmailUserId(profile.email);
  }

  if (!userId && !ownerUserId) {
    userId = await db.auth.createOwnerFromOAuth({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
  }

  if (!userId) {
    return null;
  }

  await db.auth.updateUserFromOAuth(userId, {
    provider: profile.provider,
    providerUserId: profile.providerUserId,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
  });

  await db.auth.linkIdentity(userId, {
    provider: profile.provider,
    providerUserId: profile.providerUserId,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
  });

  const session = await db.auth.createSession(userId);
  return session?.id || null;
};

const start = async (req, res, provider, mode) => {
  const protocol = s(req.headers["x-forwarded-proto"]) || "http";
  const host = s(req.headers.host) || "localhost";
  const redirectNext = next(req);

  const returnTo = new URL(`/api/auth/callback/${provider}`, `${protocol}://${host}`);
  returnTo.searchParams.set("mode", mode);
  if (redirectNext !== "/") {
    returnTo.searchParams.set("next", redirectNext);
  }

  const projectId = s(req.query?.project_id || req.query?.projectId) || projectEnv();
  if (mode === "create" && !projectId) {
    res.sendStatus(500);
    return;
  }

  const target = new URL(`/v1/auth/login/${provider}`, origin());
  target.searchParams.set("origin", returnTo.toString());
  if (projectId) {
    target.searchParams.set("projectId", projectId);
  }

  if (mode === "create" && s(req.query?.consent).toLowerCase() === "required") {
    target.searchParams.set("consent", "required");
  }

  redirect(res, target.toString());
};

const confirm = async (req, res) => {
  if (!security.trusted(req)) {
    res.statusCode = 403;
    res.end();
    return;
  }

  const payload = await json(req);
  const provider = s(payload?.provider).toLowerCase();
  const projectId = s(payload?.project_id);
  const brokerConsentToken = s(payload?.broker_consent_token);
  const brokerCode = s(payload?.broker_code);

  if (!isProvider(provider) || !projectId || (!brokerConsentToken && !brokerCode)) {
    authError(res, 400);
    return;
  }

  const confirm = await confirmCode(projectId, brokerConsentToken, brokerCode);
  if (confirm.status !== "ok" || !confirm.code) {
    authError(res, confirm.status === "rejected" ? 401 : 502);
    return;
  }

  const profile = await exchange(confirm.code, projectId);
  if (!profile) {
    authError(res, 502);
    return;
  }

  const sessionId = await sessionFromProfile(profile);
  if (!sessionId) {
    authError(res, 401);
    return;
  }

  res.statusCode = 204;
  res.setHeader("Set-Cookie", security.sessionCookie(req, sessionId));
  res.end();
};

const callback = async (req, res, provider) => {
  const mode = s(req.query?.mode);
  const projectId = s(req.query?.project_id || req.query?.projectId) || projectEnv();
  if (mode !== "create" && mode !== "sign-in") {
    res.statusCode = 400;
    res.end();
    return;
  }

  if (mode === "create" && !projectId) {
    res.statusCode = 400;
    res.end();
    return;
  }

  const redirectNext = next(req);
  const code = mode === "create"
    ? s(req.query?.broker_code || req.query?.code)
    : s(req.query?.broker_code || req.query?.code);

  if (code) {
    const profile = mode === "create"
      ? await exchange(code, projectId)
      : await exchangeSignIn(code, projectId);
    if (!profile) {
      redirect(res, "/", security.transientCookie(req, "atria_signin_error", "oauth_failed", 30));
      return;
    }

    const sessionId = await sessionFromProfile(profile);
    if (!sessionId) {
      redirect(res, "/", security.transientCookie(req, "atria_signin_error", "oauth_failed", 30));
      return;
    }

    redirect(res, redirectNext, security.sessionCookie(req, sessionId));
    return;
  }

  const consentToken = s(req.query?.broker_consent_token);
  if (mode === "create" && consentToken) {
    const params = new URLSearchParams({
      screen: "consent",
      provider,
      project_id: projectId,
      code: consentToken,
    });

    if (redirectNext !== "/") {
      params.set("next", redirectNext);
    }

    redirect(res, `/create?${params.toString()}`);
    return;
  }

  redirect(res, "/", security.transientCookie(req, "atria_signin_error", "oauth_failed", 30));
};

export const create = async (req, res, provider) => {
  await start(req, res, provider, "create");
};

export const oauth = async (req, res, provider) => {
  await start(req, res, provider, "sign-in");
};

export const routes = (app) => {
  app.get("/api/auth/callback/google", async (req, res) => {
    await callback(req, res, "google");
  });

  app.get("/api/auth/callback/github", async (req, res) => {
    await callback(req, res, "github");
  });

  app.post("/api/auth/broker/consent", async (req, res) => {
    await confirm(req, res);
  });
};
