import * as db from "@atria/db";
import type { BrokerProvider } from "./broker.types.js";

export interface BrokerExchangeProfile {
  provider: BrokerProvider;
  providerUserId: string;
  projectId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface SessionResult {
  status: "ok" | "failed" | "no-user";
  sessionId: string;
}

export const createSessionForBrokerProfile = async (
  profile: BrokerExchangeProfile | null
): Promise<SessionResult> => {
  if (!profile) {
    return { status: "no-user", sessionId: "" };
  }

  const ownerUserId = await db.auth.getOwnerId();
  let userId = await db.auth.getIdentityUserId(profile.provider, profile.providerUserId);

  if (!userId && profile.email) {
    userId = await db.auth.getEmailUserId(profile.email);
  }

  if (!userId) {
    if (ownerUserId) {
      return { status: "no-user", sessionId: "" };
    }

    userId = await db.auth.createOwnerFromOAuth({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
  }

  if (!userId) {
    return { status: "no-user", sessionId: "" };
  }

  await db.auth.updateUserFromOAuth(userId, {
    provider: profile.provider,
    providerUserId: profile.providerUserId,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
  });

  await db.auth.linkIdentity(userId, {
    provider: profile.provider,
    providerUserId: profile.providerUserId,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
  });

  const session = await db.auth.createSession(userId);
  if (!session) {
    return { status: "failed", sessionId: "" };
  }

  return { status: "ok", sessionId: session.id };
};

export const createSessionForLinkedProvider = async (
  provider: BrokerProvider
): Promise<SessionResult> => {
  const userId = await db.auth.getProviderUserId(provider);
  if (!userId) {
    return { status: "no-user", sessionId: "" };
  }

  const session = await db.auth.createSession(userId);
  if (!session) {
    return { status: "failed", sessionId: "" };
  }

  return { status: "ok", sessionId: session.id };
};
