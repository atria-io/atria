import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { openDatabase, initializeDatabase as initializeDatabaseFile } from "../../client/openDatabase.js";
import { AUTH_SCHEMA_STATEMENTS, authQueries } from "./auth.queries.js";
import type {
  AuthOAuthProvider,
  AuthOAuthProfileInput,
  AuthOwnerInput,
  AuthSession,
  AuthUser,
  OwnerSetupState,
} from "./auth.types.js";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
type AuthDatabase = NonNullable<Awaited<ReturnType<typeof openDatabase>>>;

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
};

const toCount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const getTimestamp = (): string => new Date().toISOString();

const withDatabase = async <T>(
  fallbackValue: T,
  run: (database: AuthDatabase) => T | Promise<T>
): Promise<T> => {
  const database = await openDatabase();
  if (!database) {
    return fallbackValue;
  }

  try {
    return await run(database);
  } finally {
    database.close();
  }
};

export const ensureAuthSchema = async (): Promise<boolean> => {
  return withDatabase(false, (database) => {
    try {
      for (const statement of AUTH_SCHEMA_STATEMENTS) {
        database.prepare(statement).run();
      }

      return true;
    } catch {
      return false;
    }
  });
};

export const initializeAuthPersistence = async (): Promise<boolean> => {
  const databaseReady = await initializeDatabaseFile();
  if (!databaseReady) {
    return false;
  }

  return ensureAuthSchema();
};

export const getOwnerSetupState = async (): Promise<OwnerSetupState> => {
  return withDatabase("setup" as OwnerSetupState, (database) => {
    try {
      const row = database.prepare(authQueries.countOwners).get() as { count?: unknown } | undefined;
      const ownerCount = toCount(row?.count);
      if (ownerCount === null) {
        return "setup";
      }

      return ownerCount > 0 ? "ready" : "create";
    } catch {
      return "setup";
    }
  });
};

export const createOwner = async (input: AuthOwnerInput): Promise<string | null> => {
  return withDatabase<string | null>(null, (database) => {
    const userId = randomUUID();
    const passwordHash = hashPassword(input.password);
    const now = getTimestamp();

    try {
      database
        .prepare(authQueries.insertOwnerUser)
        .run(userId, input.email, input.name ?? null, null, now, now);

      database
        .prepare(authQueries.insertOwnerCredential)
        .run(userId, passwordHash, now, now);

      return userId;
    } catch {
      return null;
    }
  });
};

export const getUserByEmail = async (email: string): Promise<AuthUser | null> => {
  return withDatabase<AuthUser | null>(null, (database) => {
    try {
      const row = database.prepare(authQueries.selectUserByEmail).get(email) as
        | { id?: unknown; email?: unknown; passwordHash?: unknown }
        | undefined;

      const id = toNonEmptyString(row?.id);
      const rowEmail = toNonEmptyString(row?.email);
      const passwordHash = toNonEmptyString(row?.passwordHash);
      if (!id || !rowEmail || !passwordHash) {
        return null;
      }

      return { id, email: rowEmail, password: passwordHash };
    } catch {
      return null;
    }
  });
};

export const createSession = async (userId: string): Promise<AuthSession | null> => {
  return withDatabase<AuthSession | null>(null, (database) => {
    const sessionId = randomUUID();
    const now = getTimestamp();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    try {
      database.prepare(authQueries.insertSession).run(sessionId, userId, now, expiresAt);
      return { id: sessionId, userId, expiresAt };
    } catch {
      return null;
    }
  });
};

export const getSessionById = async (sessionId: string): Promise<AuthSession | null> => {
  return withDatabase<AuthSession | null>(null, (database) => {
    try {
      const row = database.prepare(authQueries.selectSessionById).get(sessionId) as
        | { id?: unknown; userId?: unknown; expiresAt?: unknown }
        | undefined;

      const id = toNonEmptyString(row?.id);
      const userId = toNonEmptyString(row?.userId);
      const expiresAt = toNonEmptyString(row?.expiresAt);
      if (!id || !userId || !expiresAt) {
        return null;
      }

      const expiresAtMs = Date.parse(expiresAt);
      if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
        return null;
      }

      return { id, userId, expiresAt };
    } catch {
      return null;
    }
  });
};

export const deleteSessionById = async (sessionId: string): Promise<void> => {
  await withDatabase<void>(undefined, (database) => {
    database.prepare(authQueries.deleteSessionById).run(sessionId);
  });
};

export const getOwnerUserId = async (): Promise<string | null> => {
  return withDatabase<string | null>(null, (database) => {
    try {
      const row = database.prepare(authQueries.selectOwnerUserId).get() as { id?: unknown } | undefined;
      return toNonEmptyString(row?.id);
    } catch {
      return null;
    }
  });
};

export const getUserIdByIdentity = async (
  provider: AuthOAuthProvider,
  providerUserId: string
): Promise<string | null> => {
  return withDatabase<string | null>(null, (database) => {
    try {
      const row = database
        .prepare(authQueries.selectIdentityUserId)
        .get(provider, providerUserId) as { userId?: unknown } | undefined;
      return toNonEmptyString(row?.userId);
    } catch {
      return null;
    }
  });
};

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  return withDatabase<string | null>(null, (database) => {
    try {
      const row = database.prepare(authQueries.selectUserIdByEmail).get(email) as
        | { id?: unknown }
        | undefined;
      return toNonEmptyString(row?.id);
    } catch {
      return null;
    }
  });
};

export const createOwnerFromOAuthProfile = async (
  profile: AuthOAuthProfileInput
): Promise<string | null> => {
  if (!profile.email) {
    return null;
  }

  return withDatabase<string | null>(null, (database) => {
    const userId = randomUUID();
    const now = getTimestamp();

    try {
      database
        .prepare(authQueries.insertOAuthOwnerUser)
        .run(userId, profile.email, profile.name, profile.avatarUrl, now, now);

      return userId;
    } catch {
      return null;
    }
  });
};

export const updateUserFromOAuthProfile = async (
  userId: string,
  profile: AuthOAuthProfileInput
): Promise<void> => {
  await withDatabase<void>(undefined, (database) => {
    database
      .prepare(authQueries.updateUserFromOAuth)
      .run(profile.email, profile.name, profile.avatarUrl, getTimestamp(), userId);
  });
};

export const linkIdentityToUser = async (
  userId: string,
  profile: AuthOAuthProfileInput
): Promise<void> => {
  await withDatabase<void>(undefined, (database) => {
    const now = getTimestamp();
    database
      .prepare(authQueries.upsertIdentity)
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

export const getLinkedUserIdByProvider = async (
  provider: AuthOAuthProvider
): Promise<string | null> =>
  withDatabase<string | null>(null, (database) => {
    try {
      const row = database
        .prepare(authQueries.selectLinkedUserIdByProvider)
        .get(provider) as { userId?: unknown } | undefined;
      return toNonEmptyString(row?.userId);
    } catch {
      return null;
    }
  });
