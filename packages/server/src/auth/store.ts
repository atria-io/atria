import {
  openAtriaDatabase,
  type DatabaseOAuthProfile,
  type DatabaseOwnerRegistrationResult,
  type DatabaseSession,
  type DatabaseUser,
} from "@atria/db";
import type { AuthMethod, OwnerSetupState } from "@atria/shared";
import type { OAuthProfile } from "./types.js";

type AuthUser = Pick<DatabaseUser, "id" | "email" | "name" | "avatarUrl">;

type AuthSession = Pick<DatabaseSession, "id" | "userId" | "createdAt" | "expiresAt">;

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

export const createDbAuthStore = (projectRoot: string): AuthStore => {
  const database = openAtriaDatabase(projectRoot);

  return {
    close: async (): Promise<void> => {
      await database.close();
    },

    hasUsers: async (): Promise<boolean> => database.hasUsers(),

    getFirstUser: async () => {
      return database.getFirstUser();
    },

    getOwnerSetupState: async (): Promise<OwnerSetupState> => database.getOwnerSetupState(),

    setPreferredAuthMethod: async (authMethod: AuthMethod | null): Promise<void> => {
      await database.setPreferredAuthMethod(authMethod);
    },

    clearPreferredAuthMethod: async (): Promise<void> => {
      await database.clearPreferredAuthMethod();
    },

    getUserById: async (userId: string) => {
      return database.getUserById(userId);
    },

    getUserWithPasswordByEmail: async (email: string) => {
      return database.getUserWithPasswordByEmail(email);
    },

    registerOwnerWithPassword: async (input) => database.registerOwnerWithPassword(input),

    upsertOAuthProfile: async (profile: OAuthProfile) => {
      return database.upsertOAuthProfile(toDatabaseProfile(profile));
    },

    getSessionById: async (sessionId: string) => {
      return database.getSessionById(sessionId);
    },

    createSession: async (session: AuthSession) => {
      await database.createSession(session);
    },

    deleteSessionById: async (sessionId: string) => {
      await database.deleteSessionById(sessionId);
    },

    deleteExpiredSessions: async (expiresAtOrBefore: string) => {
      await database.deleteExpiredSessions(expiresAtOrBefore);
    }
  };
};
