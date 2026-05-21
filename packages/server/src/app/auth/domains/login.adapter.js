import * as crypto from "node:crypto";
import * as db from "@atria/db";
import * as security from "../security.js";
import { oauth } from "./broker.adapter.js";
import { json } from "@atria/server/json.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LENGTH = 256;
const PROVIDERS = ["google", "github"];

const parseEmail = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : null;
};

const parsePassword = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_PASSWORD_LENGTH) {
    return null;
  }

  return normalized;
};

const verifyPassword = (storedPassword, providedPassword) => {
  if (!storedPassword.startsWith("scrypt$")) {
    return storedPassword === providedPassword;
  }

  const [algorithm, salt, storedHashHex] = storedPassword.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHashHex) {
    return false;
  }

  try {
    const providedHash = crypto.scryptSync(providedPassword, salt, 64);
    const storedHash = Buffer.from(storedHashHex, "hex");
    return providedHash.length === storedHash.length && crypto.timingSafeEqual(providedHash, storedHash);
  } catch {
    return false;
  }
};

export const routes = (app) => {
  for (const provider of PROVIDERS) {
    app.get(`/api/auth/connect/${provider}`, async (req, res, next) => {
      if (req.query?.mode === "create") {
        await next();
        return;
      }

      await oauth(req, res, provider);
    });
  }

  app.post("/auth/sign-in", async (req, res) => {
    if (!security.trusted(req)) {
      res.statusCode = 403;
      res.end();
      return;
    }

    const payload = await json(req);
    const email = parseEmail(payload?.email);
    const password = parsePassword(payload?.password);
    if (!email || !password) {
      res.statusCode = 401;
      res.end();
      return;
    }

    const user = await db.auth.getUserByEmail(email);
    if (!user || !verifyPassword(user.password, password)) {
      res.statusCode = 401;
      res.end();
      return;
    }

    const session = await db.auth.createSession(user.id);
    if (!session) {
      res.statusCode = 401;
      res.end();
      return;
    }

    res.statusCode = 204;
    res.setHeader("Set-Cookie", security.sessionCookie(req, session.id));
    res.end();
  });
};
