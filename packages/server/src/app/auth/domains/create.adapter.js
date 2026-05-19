import * as db from "@atria/db";
import { create } from "./broker.adapter.js";
import { sessionCookie, trusted } from "../security.js";
import { readBody } from "@atria/server/body.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LENGTH = 256;
const MAX_NAME_LENGTH = 80;
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

const parseName = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_NAME_LENGTH) {
    return null;
  }

  return normalized;
};

export const routes = (app) => {
  for (const provider of PROVIDERS) {
    app.get(`/api/auth/connect/${provider}`, async (req, res, next) => {
      if (req.query?.mode !== "create") {
        await next();
        return;
      }

      await create(req, res, provider);
    });
  }

  app.post("/auth/create", async (req, res) => {
    if (!trusted(req)) {
      res.statusCode = 403;
      res.end();
      return;
    }

    const payload = await readBody(req);
    const firstName = parseName(payload?.firstName);
    const lastName = parseName(payload?.lastName);
    const email = parseEmail(payload?.email);
    const password = parsePassword(payload?.password);

    if (!firstName || !lastName || !email || !password) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const ownerState = await db.auth.getOwnerState();
    if (ownerState === "ready") {
      res.statusCode = 409;
      res.end();
      return;
    }

    if (ownerState === "setup") {
      res.statusCode = 400;
      res.end();
      return;
    }

    const ownerId = await db.auth.createOwner({
      firstName,
      lastName,
      name: firstName,
      email,
      password,
    });

    if (!ownerId) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const session = await db.auth.createSession(ownerId);
    if (!session) {
      res.statusCode = 400;
      res.end();
      return;
    }

    res.statusCode = 204;
    res.setHeader("Set-Cookie", sessionCookie(req, session.id));
    res.end();
  });
};
