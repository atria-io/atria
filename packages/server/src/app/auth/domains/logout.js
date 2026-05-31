import * as db from "@atria/db";
import * as security from "../security.js";

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

export const routes = (app) => {
  app.post("/auth/logout", async (req, res) => {
    if (!security.trusted(req)) {
      res.statusCode = 403;
      res.end();
      return;
    }

    const sessionId = readSession(req);
    if (sessionId) {
      await db.auth.deleteSessionById(sessionId);
    }

    res.statusCode = 204;
    res.setHeader("Set-Cookie", security.clearSessionCookie(req));
    res.end();
  });
};
