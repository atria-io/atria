import * as db from "@atria/db";
import { frontendUrl } from "./config.js";
import { getAuthUser } from "./db.js";

const dbEnoent = (error) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("code" in error && error.code === "ENOENT") {
    return true;
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message.includes("ENOENT");
  }

  return false;
};

const getSessionIdFromCookie = (req) => {
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

export const bootstrap = async (req, res) => {
  let ownerState;
  try {
    ownerState = await db.auth.getOwnerState();
  } catch (error) {
    if (dbEnoent(error)) {
      res.json({ state: "setup" });
      return;
    }
    throw error;
  }

  if (ownerState === "setup") {
    res.json({ state: "setup" });
    return;
  }

  if (ownerState === "create") {
    res.json({ state: "create" });
    return;
  }

  const sessionId = getSessionIdFromCookie(req);
  if (!sessionId) {
    res.json({ state: "sign-in" });
    return;
  }

  let session;
  try {
    session = await db.auth.getSessionById(sessionId);
  } catch (error) {
    if (dbEnoent(error)) {
      res.json({ state: "setup" });
      return;
    }
    throw error;
  }
  if (!session) {
    res.json({ state: "sign-in" });
    return;
  }

  let user;
  try {
    user = await getAuthUser(session.userId);
  } catch (error) {
    if (dbEnoent(error)) {
      res.json({ state: "setup" });
      return;
    }
    throw error;
  }
  if (!user) {
    res.json({ state: "sign-in" });
    return;
  }

  res.json({
    state: "authenticated",
    user,
    frontendUrl: await frontendUrl(),
  });
};

export const setup = async (res) => {
  const ok = await db.bootDB();
  res.statusCode = ok ? 204 : 400;
  res.end();
};
