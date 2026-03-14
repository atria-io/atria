import type { AuthMethod } from "@atria/shared";
import type {
  DatabaseOAuthProfile,
  DatabaseOwnerSetupState
} from "./auth/types.js";

export interface DatabaseUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseUserWithPassword {
  user: DatabaseUser;
  passwordHash: string;
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

export interface ResolvedDatabaseConnection {
  source: DatabaseSource;
  driver: DatabaseDriver;
  connectionString: string;
  sqliteFilePath: string | null;
  usesFallback: boolean;
}

export interface OpenAtriaDatabaseOptions {
  env?: NodeJS.ProcessEnv;
}

export interface AtriaDatabase {
  getConnectionInfo: () => ResolvedDatabaseConnection;
  close: () => Promise<void>;
  hasUsers: () => Promise<boolean>;
  getOwnerSetupState: () => Promise<DatabaseOwnerSetupState>;
  setPreferredAuthMethod: (authMethod: AuthMethod | null) => Promise<void>;
  clearPreferredAuthMethod: () => Promise<void>;
  getUserById: (userId: string) => Promise<DatabaseUser | null>;
  getUserWithPasswordByEmail: (email: string) => Promise<DatabaseUserWithPassword | null>;
  registerOwnerWithPassword: (input: {
    email: string;
    passwordHash: string;
    name: string | null;
  }) => Promise<DatabaseOwnerRegistrationResult>;
  upsertOAuthProfile: (profile: DatabaseOAuthProfile) => Promise<DatabaseUser>;
}
