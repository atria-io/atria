import type { IncomingMessage } from "node:http";

interface RequestBucket {
  count: number;
  resetAt: number;
}

interface IdentityLock {
  failedCount: number;
  lockedUntil: number;
}

const requestBuckets = new Map<string, RequestBucket>();
const identityLocks = new Map<string, IdentityLock>();

const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_ATTEMPTS = 30;
const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MS = 15 * 60_000;

const toStringValue = (value: unknown): string => (
  typeof value === "string" ? value.trim() : ""
);

const readHost = (request: IncomingMessage): string => {
  const forwardedHost = toStringValue(request.headers["x-forwarded-host"]);
  if (forwardedHost !== "") {
    return forwardedHost.split(",")[0]?.trim() ?? "";
  }

  return toStringValue(request.headers.host);
};

const readClientIp = (request: IncomingMessage): string => {
  const forwardedFor = toStringValue(request.headers["x-forwarded-for"]);
  if (forwardedFor !== "") {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.socket.remoteAddress ?? "unknown";
};

const readRequestProtocol = (request: IncomingMessage): string => {
  const forwardedProto = toStringValue(request.headers["x-forwarded-proto"]);
  if (forwardedProto !== "") {
    return forwardedProto.split(",")[0]?.trim() ?? "http";
  }

  return "http";
};

const buildBucketKey = (request: IncomingMessage, scope: string): string => {
  return `${scope}:${readClientIp(request)}`;
};

export const allowAuthRequest = (
  request: IncomingMessage,
  scope: string
): boolean => {
  const key = buildBucketKey(request, scope);
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || now >= current.resetAt) {
    requestBuckets.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return true;
  }

  if (current.count >= AUTH_MAX_ATTEMPTS) {
    return false;
  }

  current.count += 1;
  requestBuckets.set(key, current);
  return true;
};

export const isLoginLocked = (identity: string): boolean => {
  const key = identity.trim().toLowerCase();
  if (key === "") {
    return false;
  }

  const current = identityLocks.get(key);
  if (!current) {
    return false;
  }

  if (Date.now() >= current.lockedUntil) {
    identityLocks.delete(key);
    return false;
  }

  return true;
};

export const markLoginFailure = (identity: string): void => {
  const key = identity.trim().toLowerCase();
  if (key === "") {
    return;
  }

  const now = Date.now();
  const current = identityLocks.get(key);
  if (!current) {
    identityLocks.set(key, { failedCount: 1, lockedUntil: 0 });
    return;
  }

  if (current.lockedUntil > 0 && now >= current.lockedUntil) {
    identityLocks.set(key, { failedCount: 1, lockedUntil: 0 });
    return;
  }

  if (current.lockedUntil > now) {
    return;
  }

  const nextCount = current.failedCount + 1;
  if (nextCount >= LOGIN_LOCK_THRESHOLD) {
    identityLocks.set(key, { failedCount: 0, lockedUntil: now + LOGIN_LOCK_MS });
    return;
  }

  identityLocks.set(key, { failedCount: nextCount, lockedUntil: current.lockedUntil });
};

export const clearLoginFailures = (identity: string): void => {
  const key = identity.trim().toLowerCase();
  if (key === "") {
    return;
  }

  identityLocks.delete(key);
};

export const isTrustedOrigin = (request: IncomingMessage): boolean => {
  const host = readHost(request);
  if (host === "") {
    return false;
  }

  const origin = toStringValue(request.headers.origin);
  if (origin !== "") {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = toStringValue(request.headers.referer);
  if (referer !== "") {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
};

export const buildSessionCookie = (
  request: IncomingMessage,
  sessionId: string
): string => {
  const parts = [
    `session=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (readRequestProtocol(request) === "https") {
    parts.push("Secure");
  }

  return parts.join("; ");
};

export const buildSessionClearCookie = (
  request: IncomingMessage
): string => {
  const parts = [
    "session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (readRequestProtocol(request) === "https") {
    parts.push("Secure");
  }

  return parts.join("; ");
};

export const buildTransientCookie = (
  request: IncomingMessage,
  name: string,
  value: string,
  maxAgeSeconds: number
): string => {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (readRequestProtocol(request) === "https") {
    parts.push("Secure");
  }

  return parts.join("; ");
};
