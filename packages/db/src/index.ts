export type {
  OAuthProviderId,
  DatabaseOAuthProfile,
  DatabaseOwnerSetupState
} from "./auth/types.js";

export { AUTH_META_KEYS } from "./auth/keys.js";

export type {
  DatabaseUser,
  DatabaseUserWithPassword,
  DatabaseOwnerRegistrationResult,
  DatabaseOwnerRegistrationFailureReason,
  DatabaseDriver,
  DatabaseSource,
  ResolvedDatabaseConnection,
  OpenAtriaDatabaseOptions,
  AtriaDatabase
} from "./database.js";

export { resolveDatabaseConnection } from "./config/resolve.js";
export { openAtriaDatabase, initializeProjectDatabase } from "./runtime/open.js";
