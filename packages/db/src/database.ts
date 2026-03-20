import type { AuthMethod } from "@atria/shared";
import type {
  DatabaseOAuthProfile,
  DatabaseOwnerSetupState
} from "./auth/types.js";

/** Public user shape returned by the database layer. */
export interface DatabaseUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** User shape including password hash, used internally by auth flows. */
export interface DatabaseUserWithPassword {
  user: DatabaseUser;
  passwordHash: string;
}

/** Stored session payload. */
export interface DatabaseSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export type DatabaseOwnerRegistrationFailureReason = "owner_exists" | "email_in_use";

export type DatabaseOwnerRegistrationResult =
  | {
      ok: true;
      user: DatabaseUser;
    }
  | {
      ok: false;
      reason: DatabaseOwnerRegistrationFailureReason;
    };

export type DatabaseDriver = "sqlite" | "postgresql";
export type DatabaseSource = "atria_database_url" | "database_url" | "local_fallback";

/** Database connection details after env resolution. */
export interface ResolvedDatabaseConnection {
  source: DatabaseSource;
  driver: DatabaseDriver;
  connectionString: string;
  sqliteFilePath: string | null;
  usesFallback: boolean;
}

/** Options used when opening a project database. */
export interface OpenAtriaDatabaseOptions {
  env?: NodeJS.ProcessEnv;
}

/** Database interface used by the rest of the monorepo. */
export interface AtriaDatabase {
  getConnectionInfo: () => ResolvedDatabaseConnection;
  close: () => Promise<void>;
  hasUsers: () => Promise<boolean>;
  getOwnerSetupState: () => Promise<DatabaseOwnerSetupState>;
  setPreferredAuthMethod: (authMethod: AuthMethod | null) => Promise<void>;
  clearPreferredAuthMethod: () => Promise<void>;
  getFirstUser: () => Promise<DatabaseUser | null>;
  getUserById: (userId: string) => Promise<DatabaseUser | null>;
  getUserWithPasswordByEmail: (email: string) => Promise<DatabaseUserWithPassword | null>;
  registerOwnerWithPassword: (input: {
    email: string;
    passwordHash: string;
    name: string | null;
  }) => Promise<DatabaseOwnerRegistrationResult>;
  upsertOAuthProfile: (profile: DatabaseOAuthProfile) => Promise<DatabaseUser>;
  getSessionById: (sessionId: string) => Promise<DatabaseSession | null>;
  createSession: (session: DatabaseSession) => Promise<void>;
  deleteSessionById: (sessionId: string) => Promise<void>;
  deleteExpiredSessions: (expiresAtOrBefore: string) => Promise<void>;
}
