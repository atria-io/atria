import { randomUUID } from "node:crypto";
import { sql } from "../../dml.api.js";
import { withDatabase } from "@/system/withDatabase.js";
import { getTimestamp, toString } from "@/data/support/shared.js";
import type { AuthOAuthProfileInput, AuthOAuthProvider } from "../../types.js";

export const getIdentityUserId = async (
  provider: AuthOAuthProvider,
  providerUserId: string
): Promise<string | null> => {
  return withDatabase<string | null>(null, (db) => {
    try {
      const row = db
        .prepare(sql.identity.selectUserId)
        .get(provider, providerUserId) as
          | { userId?: unknown }
          | undefined;
      return toString(row?.userId);
    } catch {
      return null;
    }
  });
};

export const getEmailUserId = async (
  email: string
): Promise<string | null> => {
  return withDatabase<string | null>(null, (db) => {
    try {
      const row = db
        .prepare(sql.user.userSelectIdByEmail)
        .get(email) as
          | { id?: unknown }
          | undefined;
      return toString(row?.id);
    } catch {
      return null;
    }
  });
};

export const createOwnerFromOAuth = async (
  profile: AuthOAuthProfileInput
): Promise<string | null> => {
  if (!profile.email) {
    return null;
  }

  return withDatabase<string | null>(null, (db) => {
    const userId = randomUUID();
    const now = getTimestamp();

    try {
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
    } catch {
      return null;
    }
  });
};

export const updateUserFromOAuth = async (
  userId: string,
  profile: AuthOAuthProfileInput
): Promise<void> => {
  await withDatabase<void>(undefined, (db) => {
    db
      .prepare(sql.oauth.oauthUpdateUser)
      .run(profile.email, profile.name, profile.avatarUrl, getTimestamp(), userId);
  });
};

export const linkIdentity = async (
  userId: string,
  profile: AuthOAuthProfileInput
): Promise<void> => {
  await withDatabase<void>(undefined, (db) => {
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
