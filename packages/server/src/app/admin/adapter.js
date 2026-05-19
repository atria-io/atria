import * as db from "@atria/db";
import { frontendUrl } from "./config.js";
import { getAuthUser } from "./db.js";

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
  const ownerState = await db.auth.getOwnerState();

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

  const session = await db.auth.getSessionById(sessionId);
  if (!session) {
    res.json({ state: "sign-in" });
    return;
  }

  const user = await getAuthUser(session.userId);
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
