import {
  openAtriaDatabase,
  type DatabaseOAuthProfile,
  type DatabaseOwnerRegistrationResult,
  type DatabaseSession,
  type DatabaseUser,
} from "@atria/db";
import type { AuthMethod } from "@atria/shared";
import type { OAuthProfile } from "./types.js";

interface OwnerSetupState {
  pending: boolean;
  preferredAuthMethod: AuthMethod | null;
}

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthStore {
  close: () => Promise<void>;
  hasUsers: () => Promise<boolean>;
  getFirstUser: () => Promise<AuthUser | null>;
  getOwnerSetupState: () => Promise<OwnerSetupState>;
  setPreferredAuthMethod: (authMethod: AuthMethod | null) => Promise<void>;
  clearPreferredAuthMethod: () => Promise<void>;
  getUserById: (userId: string) => Promise<AuthUser | null>;
  getUserWithPasswordByEmail: (email: string) => Promise<{
    user: AuthUser;
    passwordHash: string;
  } | null>;
  registerOwnerWithPassword: (input: {
    email: string;
    passwordHash: string;
    name: string | null;
  }) => Promise<DatabaseOwnerRegistrationResult>;
  upsertOAuthProfile: (profile: OAuthProfile) => Promise<AuthUser>;
  getSessionById: (sessionId: string) => Promise<AuthSession | null>;
  createSession: (session: AuthSession) => Promise<void>;
  deleteSessionById: (sessionId: string) => Promise<void>;
  deleteExpiredSessions: (expiresAtOrBefore: string) => Promise<void>;
}

const toDatabaseProfile = (profile: OAuthProfile): DatabaseOAuthProfile => ({
  provider: profile.provider,
  providerUserId: profile.providerUserId,
  email: profile.email,
  emailVerified: profile.emailVerified,
  name: profile.name,
  avatarUrl: profile.avatarUrl
});

const mapUser = (user: Pick<DatabaseUser, "id" | "email" | "name" | "avatarUrl">): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl
});

const mapSession = (
  session: Pick<DatabaseSession, "id" | "userId" | "createdAt" | "expiresAt">
): AuthSession => ({
  id: session.id,
  userId: session.userId,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt
});

export const createDbAuthStore = (projectRoot: string): AuthStore => {
  const database = openAtriaDatabase(projectRoot);

  return {
    close: async (): Promise<void> => {
      await database.close();
    },

    hasUsers: async (): Promise<boolean> => database.hasUsers(),

    getFirstUser: async () => {
      const user = await database.getFirstUser();
      return user ? mapUser(user) : null;
    },

    getOwnerSetupState: async (): Promise<OwnerSetupState> => database.getOwnerSetupState(),

    setPreferredAuthMethod: async (authMethod: AuthMethod | null): Promise<void> => {
      await database.setPreferredAuthMethod(authMethod);
    },

    clearPreferredAuthMethod: async (): Promise<void> => {
      await database.clearPreferredAuthMethod();
    },

    getUserById: async (userId: string) => {
      const user = await database.getUserById(userId);
      return user ? mapUser(user) : null;
    },

    getUserWithPasswordByEmail: async (email: string) => {
      const user = await database.getUserWithPasswordByEmail(email);
      return user ? { user: mapUser(user.user), passwordHash: user.passwordHash } : null;
    },

    registerOwnerWithPassword: async (input) => database.registerOwnerWithPassword(input),

    upsertOAuthProfile: async (profile: OAuthProfile) => {
      const user = await database.upsertOAuthProfile(toDatabaseProfile(profile));
      return mapUser(user);
    },

    getSessionById: async (sessionId: string) => {
      const session = await database.getSessionById(sessionId);
      return session ? mapSession(session) : null;
    },

    createSession: async (session: AuthSession) => {
      await database.createSession(mapSession(session));
    },

    deleteSessionById: async (sessionId: string) => {
      await database.deleteSessionById(sessionId);
    },

    deleteExpiredSessions: async (expiresAtOrBefore: string) => {
      await database.deleteExpiredSessions(expiresAtOrBefore);
    }
  };
};
