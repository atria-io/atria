import * as crypto from "node:crypto";
import { sql } from "../dml.api.js";
import { withDB } from "@/system/with.js";
import { getTimestamp, toString } from "@/data/coerce.js";

export const getIdentityUserId = async (provider, providerUserId) => {
  return withDB((db) => {
    const row = db
      .prepare(sql.identity.selectUserId)
      .get(provider, providerUserId);
    return toString(row?.userId);
  });
};

export const getEmailUserId = async (email) => {
  return withDB((db) => {
    const row = db
      .prepare(sql.user.userSelectIdByEmail)
      .get(email);
    return toString(row?.id);
  });
};

export const createOwnerFromOAuth = async (profile) => {
  if (!profile.email) {
    return null;
  }
  return withDB((db) => {
    const userId = crypto.randomUUID();
    const now = getTimestamp();
    db
      .prepare(sql.oauth.oauthInsertOwnerUser)
      .run(
        userId,
        profile.email,
        profile.name,
        profile.avatarUrl,
        now,
        now
      );
    return userId;
  });
};

export const updateUserFromOAuth = async (userId, profile) => {
  await withDB((db) => {
    db
      .prepare(sql.oauth.oauthUpdateUser)
      .run(
        profile.email,
        profile.name,
        profile.avatarUrl,
        getTimestamp(),
        userId
      );
  });
};

export const linkIdentity = async (userId, profile) => {
  await withDB((db) => {
    const now = getTimestamp();
    db
      .prepare(sql.identity.upsert)
      .run(
        profile.provider,
        profile.providerUserId,
        userId,
        profile.email,
        profile.name,
        profile.avatarUrl,
        now,
        now
      );
  });
};
