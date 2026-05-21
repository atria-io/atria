import * as db from "@atria/db";
import { notFound } from "./errors.js";

const readSession = (req) => {
  const rawCookie = req.headers.cookie;
  if (typeof rawCookie !== "string") {
    return null;
  }

  for (const part of rawCookie.split(";")) {
    const [name, value] = part.trim().split("=");
    if (name === "session" && value) {
      return value.trim();
    }
  }

  return null;
};

const isPublic = (pathname) => {
  return pathname === "/api/state" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/pages" ||
    pathname.startsWith("/api/pages/");
};

export const useSession = (app) => {
  app.use(async (req, res, next) => {
    const pathname = req.path;
    if (!pathname.startsWith("/api/") || isPublic(pathname)) {
      await next();
      return;
    }

    const sessionId = readSession(req);
    if (!sessionId) {
      notFound(res);
      return;
    }

    const session = await db.auth.getSessionById(sessionId);
    if (!session) {
      notFound(res);
      return;
    }

    await next();
  });
};
