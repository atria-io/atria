export { openDatabase } from "./client/openDatabase.js";
export {
  initializeAuthPersistence as initializeDatabase,
  ensureAuthSchema,
  getOwnerSetupState,
  createOwner,
  getUserByEmail,
  createSession,
  getSessionById,
  deleteSessionById,
  getOwnerUserId,
  getUserIdByIdentity,
  getUserIdByEmail,
  createOwnerFromOAuthProfile,
  updateUserFromOAuthProfile,
  linkIdentityToUser,
  getLinkedUserIdByProvider,
} from "./modules/auth/auth.repository.js";
export type {
  OwnerSetupState,
  AuthOwnerInput,
  AuthUser,
  AuthSession,
  AuthOAuthProfileInput,
  AuthOAuthProvider,
} from "./modules/auth/auth.types.js";
