import type { IncomingHttpHeaders } from "node:http";

interface CookieOptions {
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

export const parseCookies = (headers: IncomingHttpHeaders): Record<string, string> => {
  const raw = headers.cookie;
  if (!raw) {
    return {};
  }

  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .reduce<Record<string, string>>((cookies, entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex <= 0) {
        return cookies;
      }

      const name = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
};

export const serializeCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
): string => {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  parts.push(`Path=${options.path ?? "/"}`);

  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};
