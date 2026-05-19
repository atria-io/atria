const asString = (value) => (typeof value === "string" ? value.trim() : "");

const readHost = (req) => {
  const forwardedHost = asString(req.headers["x-forwarded-host"]);
  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim() ?? "";
  }

  return asString(req.headers.host);
};

const proto = (req) => {
  const forwardedProto = asString(req.headers["x-forwarded-proto"]);
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() ?? "http";
  }

  return "http";
};

export const trusted = (req) => {
  const host = readHost(req);
  if (!host) {
    return false;
  }

  const origin = asString(req.headers.origin);
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = asString(req.headers.referer);
  if (!referer) {
    return false;
  }

  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
};

export const sessionCookie = (req, sessionId) => {
  const parts = [`session=${sessionId}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (proto(req) === "https") {
    parts.push("Secure");
  }
  return parts.join("; ");
};

export const clearSessionCookie = (req) => {
  const parts = ["session=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (proto(req) === "https") {
    parts.push("Secure");
  }
  return parts.join("; ");
};

export const transientCookie = (req, name, value, maxAgeSeconds) => {
  const parts = [`${name}=${value}`, "Path=/", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`];
  if (proto(req) === "https") {
    parts.push("Secure");
  }
  return parts.join("; ");
};
