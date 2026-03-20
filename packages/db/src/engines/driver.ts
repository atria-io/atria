import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { Pool, type PoolClient } from "pg";
import { parseAuthMethod, type AuthMethod } from "@atria/shared";
import { AUTH_META_KEYS } from "../auth/keys.js";
import { postgresAuthQueries, sqliteAuthQueries } from "../auth/queries/index.js";
import type {
  DatabaseOAuthProfile,
  DatabaseOwnerSetupState,
  OAuthProviderId
} from "../auth/types.js";
import type {
  AtriaDatabase,
  DatabaseSession,
  DatabaseOwnerRegistrationResult,
  DatabaseUser,
  DatabaseUserWithPassword,
  ResolvedDatabaseConnection
} from "../database.js";
import { asRecord, rowToSession, rowToUser, rowToUserWithPassword } from "../internal/record.js";
import { nowIso } from "../internal/time.js";
import { runPostgresSchemaMigrations } from "./migrate.js";

interface IdentityLookup {
  userId: string | null;
}

interface UpdateIdentityInput {
  provider: OAuthProviderId;
  providerUserId: string;
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  updatedAt: string;
}

interface InsertIdentityInput extends UpdateIdentityInput {
  linkedAt: string;
}

interface InsertCredentialInput {
  userId: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface OwnerStore<TTransaction> {
  hasUsers(tx?: TTransaction): Promise<boolean>;
  getFirstUser(tx?: TTransaction): Promise<DatabaseUser | null>;
  getMetaValue(key: string): Promise<string | null>;
  upsertMetaValue(key: string, value: AuthMethod, updatedAt: string): Promise<void>;
  deleteMetaValue(key: string): Promise<void>;
  isUniqueEmailViolation(error: unknown): boolean;
  getUserById(userId: string, tx?: TTransaction): Promise<DatabaseUser | null>;
  getUserByEmail(email: string, tx: TTransaction): Promise<DatabaseUser | null>;
  getUserWithPasswordByEmail(email: string): Promise<DatabaseUserWithPassword | null>;
  getSessionById(sessionId: string): Promise<DatabaseSession | null>;
  upsertSession(session: DatabaseSession): Promise<void>;
  deleteSessionById(sessionId: string): Promise<void>;
  deleteExpiredSessions(expiresAtOrBefore: string): Promise<void>;
  insertUser(user: DatabaseUser, tx: TTransaction): Promise<void>;
  insertCredential(input: InsertCredentialInput, tx: TTransaction): Promise<void>;
  updateUser(user: DatabaseUser, tx: TTransaction): Promise<void>;
  getIdentityByProvider(
    provider: OAuthProviderId,
    providerUserId: string,
    tx: TTransaction
  ): Promise<IdentityLookup | null>;
  updateIdentityByProvider(input: UpdateIdentityInput, tx: TTransaction): Promise<void>;
  insertIdentity(input: InsertIdentityInput, tx: TTransaction): Promise<void>;
  withTransaction<T>(operation: (tx: TTransaction) => Promise<T>): Promise<T>;
}

interface OwnerDependencies {
  now: () => string;
  createUserId: () => string;
}

interface OwnerOperations {
  hasUsers: () => Promise<boolean>;
  getFirstUser: () => Promise<DatabaseUser | null>;
  getOwnerSetupState: () => Promise<DatabaseOwnerSetupState>;
  setPreferredAuthMethod: (authMethod: AuthMethod | null) => Promise<void>;
  clearPreferredAuthMethod: () => Promise<void>;
  getUserById: (userId: string) => Promise<DatabaseUser | null>;
  getUserWithPasswordByEmail: (email: string) => Promise<DatabaseUserWithPassword | null>;
  getSessionById: (sessionId: string) => Promise<DatabaseSession | null>;
  createSession: (session: DatabaseSession) => Promise<void>;
  deleteSessionById: (sessionId: string) => Promise<void>;
  deleteExpiredSessions: (expiresAtOrBefore: string) => Promise<void>;
  registerOwnerWithPassword: (input: {
    email: string;
    passwordHash: string;
    name: string | null;
  }) => Promise<DatabaseOwnerRegistrationResult>;
  upsertOAuthProfile: (profile: DatabaseOAuthProfile) => Promise<DatabaseUser>;
}

const createOwnerAuthError = (code: string, message: string): Error & { code: string } => {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
};

const createOwnerOperations = <TTransaction>(
  store: OwnerStore<TTransaction>,
  dependencies: OwnerDependencies
): OwnerOperations => {
  const insertUserFromProfile = async (
    profile: DatabaseOAuthProfile,
    tx: TTransaction
  ): Promise<DatabaseUser> => {
    const timestamp = dependencies.now();
    const user: DatabaseUser = {
      id: dependencies.createUserId(),
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      await store.insertUser(user, tx);
      return user;
    } catch (error) {
      if (!profile.emailVerified || profile.email === null || !store.isUniqueEmailViolation(error)) {
        throw error;
      }

      const existingUser = await store.getUserByEmail(profile.email, tx);
      if (existingUser) {
        return existingUser;
      }

      throw error;
    }
  };

  const updateUserWithProfile = async (
    user: DatabaseUser,
    profile: DatabaseOAuthProfile,
    tx: TTransaction
  ): Promise<DatabaseUser> => {
    const updatedUser: DatabaseUser = {
      ...user,
      email: profile.email ?? user.email,
      name: profile.name ?? user.name,
      avatarUrl: profile.avatarUrl ?? user.avatarUrl,
      updatedAt: dependencies.now()
    };

    await store.updateUser(updatedUser, tx);
    return updatedUser;
  };

  return {
    hasUsers: async () => store.hasUsers(),

    getFirstUser: async (): Promise<DatabaseUser | null> => store.getFirstUser(),

    getOwnerSetupState: async (): Promise<DatabaseOwnerSetupState> => {
      if (await store.hasUsers()) {
        return {
          pending: false,
          preferredAuthMethod: null
        };
      }

      return {
        pending: true,
        preferredAuthMethod: parseAuthMethod(
          await store.getMetaValue(AUTH_META_KEYS.ownerPreferredAuthMethod)
        )
      };
    },

    setPreferredAuthMethod: async (authMethod: AuthMethod | null): Promise<void> => {
      if (authMethod === null) {
        await store.deleteMetaValue(AUTH_META_KEYS.ownerPreferredAuthMethod);
        return;
      }

      await store.upsertMetaValue(
        AUTH_META_KEYS.ownerPreferredAuthMethod,
        authMethod,
        dependencies.now()
      );
    },

    clearPreferredAuthMethod: async (): Promise<void> => {
      await store.deleteMetaValue(AUTH_META_KEYS.ownerPreferredAuthMethod);
    },

    getUserById: async (userId: string): Promise<DatabaseUser | null> => store.getUserById(userId),

    getUserWithPasswordByEmail: async (email: string): Promise<DatabaseUserWithPassword | null> =>
      store.getUserWithPasswordByEmail(email),

    getSessionById: async (sessionId: string): Promise<DatabaseSession | null> =>
      store.getSessionById(sessionId),

    createSession: async (session: DatabaseSession): Promise<void> => {
      await store.upsertSession(session);
    },

    deleteSessionById: async (sessionId: string): Promise<void> => {
      await store.deleteSessionById(sessionId);
    },

    deleteExpiredSessions: async (expiresAtOrBefore: string): Promise<void> => {
      await store.deleteExpiredSessions(expiresAtOrBefore);
    },

    registerOwnerWithPassword: async (input): Promise<DatabaseOwnerRegistrationResult> =>
      store.withTransaction(async (tx) => {
        const usersExist = await store.hasUsers(tx);
        if (usersExist) {
          return {
            ok: false,
            reason: "owner_exists"
          };
        }

        const existingUser = await store.getUserByEmail(input.email, tx);
        if (existingUser) {
          return {
            ok: false,
            reason: "email_in_use"
          };
        }

        const timestamp = dependencies.now();
        const user: DatabaseUser = {
          id: dependencies.createUserId(),
          email: input.email,
          name: input.name,
          avatarUrl: null,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        await store.insertUser(user, tx);
        await store.insertCredential(
          {
            userId: user.id,
            passwordHash: input.passwordHash,
            createdAt: timestamp,
            updatedAt: timestamp
          },
          tx
        );

        return {
          ok: true,
          user
        };
      }),

    upsertOAuthProfile: async (profile: DatabaseOAuthProfile): Promise<DatabaseUser> =>
      store.withTransaction(async (tx) => {
        const usersExist = await store.hasUsers(tx);
        const ownerUser = usersExist ? await store.getFirstUser(tx) : null;
        const ownerUserId = ownerUser?.id ?? null;
        if (usersExist && ownerUserId === null) {
          throw createOwnerAuthError("OWNER_USER_NOT_FOUND", "Owner user record is missing.");
        }

        const existingIdentity = await store.getIdentityByProvider(
          profile.provider,
          profile.providerUserId,
          tx
        );

        if (existingIdentity && typeof existingIdentity.userId === "string") {
          const existingUser = await store.getUserById(existingIdentity.userId, tx);
          if (!existingUser) {
            throw createOwnerAuthError(
              "OAUTH_IDENTITY_ORPHANED",
              "OAuth identity is linked to a missing user."
            );
          }

          if (ownerUserId !== null && existingUser.id !== ownerUserId) {
            throw createOwnerAuthError(
              "OAUTH_OWNER_MISMATCH",
              "OAuth account is not authorized for this project owner."
            );
          }

          const resolvedUser = await updateUserWithProfile(existingUser, profile, tx);

          await store.updateIdentityByProvider(
            {
              provider: profile.provider,
              providerUserId: profile.providerUserId,
              userId: resolvedUser.id,
              email: profile.email,
              name: profile.name,
              avatarUrl: profile.avatarUrl,
              updatedAt: dependencies.now()
            },
            tx
          );

          return resolvedUser;
        }

        const emailForMerge = profile.emailVerified && profile.email !== null ? profile.email : null;
        const existingUser = emailForMerge ? await store.getUserByEmail(emailForMerge, tx) : null;
        if (ownerUserId !== null && (!existingUser || existingUser.id !== ownerUserId)) {
          throw createOwnerAuthError(
            "OAUTH_OWNER_MISMATCH",
            "OAuth account is not authorized for this project owner."
          );
        }

        const resolvedUser = existingUser
          ? await updateUserWithProfile(existingUser, profile, tx)
          : await insertUserFromProfile(profile, tx);

        const linkedAt = dependencies.now();
        await store.insertIdentity(
          {
            provider: profile.provider,
            providerUserId: profile.providerUserId,
            userId: resolvedUser.id,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            linkedAt,
            updatedAt: linkedAt
          },
          tx
        );

        return resolvedUser;
      })
  };
};

export class SqliteAtriaDatabase implements AtriaDatabase {
  private readonly owner: OwnerOperations;

  public constructor(
    private readonly database: DatabaseSync,
    private readonly connectionInfo: ResolvedDatabaseConnection
  ) {
    this.owner = createOwnerOperations(this.createStore(), {
      now: nowIso,
      createUserId: randomUUID
    });
  }

  public getConnectionInfo(): ResolvedDatabaseConnection {
    return this.connectionInfo;
  }

  public async close(): Promise<void> {
    this.database.close();
  }

  public async hasUsers(): Promise<boolean> {
    return this.owner.hasUsers();
  }

  public async getFirstUser(): Promise<DatabaseUser | null> {
    return this.owner.getFirstUser();
  }

  public async getOwnerSetupState(): Promise<DatabaseOwnerSetupState> {
    return this.owner.getOwnerSetupState();
  }

  public async setPreferredAuthMethod(authMethod: AuthMethod | null): Promise<void> {
    await this.owner.setPreferredAuthMethod(authMethod);
  }

  public async clearPreferredAuthMethod(): Promise<void> {
    await this.owner.clearPreferredAuthMethod();
  }

  public async getUserById(userId: string): Promise<DatabaseUser | null> {
    return this.owner.getUserById(userId);
  }

  public async getUserWithPasswordByEmail(email: string): Promise<DatabaseUserWithPassword | null> {
    return this.owner.getUserWithPasswordByEmail(email);
  }

  public async getSessionById(sessionId: string): Promise<DatabaseSession | null> {
    return this.owner.getSessionById(sessionId);
  }

  public async createSession(session: DatabaseSession): Promise<void> {
    await this.owner.createSession(session);
  }

  public async deleteSessionById(sessionId: string): Promise<void> {
    await this.owner.deleteSessionById(sessionId);
  }

  public async deleteExpiredSessions(expiresAtOrBefore: string): Promise<void> {
    await this.owner.deleteExpiredSessions(expiresAtOrBefore);
  }

  public async registerOwnerWithPassword(input: {
    email: string;
    passwordHash: string;
    name: string | null;
  }): Promise<DatabaseOwnerRegistrationResult> {
    return this.owner.registerOwnerWithPassword(input);
  }

  public async upsertOAuthProfile(profile: DatabaseOAuthProfile): Promise<DatabaseUser> {
    return this.owner.upsertOAuthProfile(profile);
  }

  private createStore(): OwnerStore<DatabaseSync> {
    return {
      hasUsers: async (tx) => {
        const target = tx ?? this.database;
        const row = target.prepare("SELECT 1 AS has_user FROM atria_users LIMIT 1").get();
        return row !== undefined;
      },
      getFirstUser: async (tx) => {
        const target = tx ?? this.database;
        const row = target.prepare(sqliteAuthQueries.users.selectFirst).get();
        return rowToUser(row);
      },
      getMetaValue: async (key) => {
        const row = this.database.prepare(sqliteAuthQueries.meta.selectValue).get(key);
        const record = asRecord(row);
        return typeof record?.value === "string" ? record.value : null;
      },
      upsertMetaValue: async (key, value, updatedAt) => {
        this.database.prepare(sqliteAuthQueries.meta.upsertValue).run(key, value, updatedAt);
      },
      deleteMetaValue: async (key) => {
        this.database.prepare(sqliteAuthQueries.meta.deleteValue).run(key);
      },
      isUniqueEmailViolation: (error) => {
        if (typeof error !== "object" || error === null) {
          return false;
        }

        const errorRecord = error as { code?: unknown; message?: unknown };
        if (typeof errorRecord.code === "string" && errorRecord.code.startsWith("SQLITE_CONSTRAINT")) {
          return true;
        }

        return typeof errorRecord.message === "string"
          ? errorRecord.message.toLowerCase().includes("unique")
          : false;
      },
      getUserById: async (userId, tx) => {
        const target = tx ?? this.database;
        const row = target.prepare(sqliteAuthQueries.users.selectById).get(userId);
        return rowToUser(row);
      },
      getUserByEmail: async (email, tx) => {
        const row = tx.prepare(sqliteAuthQueries.users.selectByEmail).get(email);
        return rowToUser(row);
      },
      getUserWithPasswordByEmail: async (email) => {
        const row = this.database.prepare(sqliteAuthQueries.users.selectWithPasswordByEmail).get(email);
        return rowToUserWithPassword(row);
      },
      getSessionById: async (sessionId) => {
        const row = this.database.prepare(sqliteAuthQueries.sessions.selectById).get(sessionId);
        return rowToSession(row);
      },
      upsertSession: async (session) => {
        this.database.prepare(sqliteAuthQueries.sessions.upsert).run(
          session.id,
          session.userId,
          session.createdAt,
          session.expiresAt
        );
      },
      deleteSessionById: async (sessionId) => {
        this.database.prepare(sqliteAuthQueries.sessions.deleteById).run(sessionId);
      },
      deleteExpiredSessions: async (expiresAtOrBefore) => {
        this.database.prepare(sqliteAuthQueries.sessions.deleteExpired).run(expiresAtOrBefore);
      },
      insertUser: async (user, tx) => {
        tx.prepare(sqliteAuthQueries.users.insert).run(
          user.id,
          user.email,
          user.name,
          user.avatarUrl,
          user.createdAt,
          user.updatedAt
        );
      },
      insertCredential: async (input, tx) => {
        tx.prepare(sqliteAuthQueries.credentials.insert).run(
          input.userId,
          input.passwordHash,
          input.createdAt,
          input.updatedAt
        );
      },
      updateUser: async (user, tx) => {
        tx.prepare(sqliteAuthQueries.users.update).run(
          user.email,
          user.name,
          user.avatarUrl,
          user.updatedAt,
          user.id
        );
      },
      getIdentityByProvider: async (provider, providerUserId, tx) => {
        const row = tx
          .prepare(sqliteAuthQueries.identities.selectByProvider)
          .get(provider, providerUserId);
        const record = asRecord(row);
        if (!record) {
          return null;
        }

        return {
          userId: typeof record.user_id === "string" ? record.user_id : null
        };
      },
      updateIdentityByProvider: async (input, tx) => {
        tx.prepare(sqliteAuthQueries.identities.updateByProvider).run(
          input.userId,
          input.email,
          input.name,
          input.avatarUrl,
          input.updatedAt,
          input.provider,
          input.providerUserId
        );
      },
      insertIdentity: async (input, tx) => {
        tx.prepare(sqliteAuthQueries.identities.insert).run(
          input.provider,
          input.providerUserId,
          input.userId,
          input.email,
          input.name,
          input.avatarUrl,
          input.linkedAt,
          input.updatedAt
        );
      },
      withTransaction: async <T>(operation: (tx: DatabaseSync) => Promise<T>): Promise<T> => {
        this.database.exec("BEGIN IMMEDIATE");
        try {
          const result = await operation(this.database);
          this.database.exec("COMMIT");
          return result;
        } catch (error) {
          try {
            this.database.exec("ROLLBACK");
          } catch {
            // no-op
          }
          throw error;
        }
      }
    };
  }
}

export class PostgresAtriaDatabase implements AtriaDatabase {
  private readyPromise: Promise<void> | null = null;
  private readonly owner: OwnerOperations;

  public constructor(
    private readonly pool: Pool,
    private readonly connectionInfo: ResolvedDatabaseConnection
  ) {
    this.owner = createOwnerOperations(this.createStore(), {
      now: nowIso,
      createUserId: randomUUID
    });
  }

  public getConnectionInfo(): ResolvedDatabaseConnection {
    return this.connectionInfo;
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async hasUsers(): Promise<boolean> {
    await this.ensureReady();
    return this.owner.hasUsers();
  }

  public async getFirstUser(): Promise<DatabaseUser | null> {
    await this.ensureReady();
    return this.owner.getFirstUser();
  }

  public async getOwnerSetupState(): Promise<DatabaseOwnerSetupState> {
    await this.ensureReady();
    return this.owner.getOwnerSetupState();
  }

  public async setPreferredAuthMethod(authMethod: AuthMethod | null): Promise<void> {
    await this.ensureReady();
    await this.owner.setPreferredAuthMethod(authMethod);
  }

  public async clearPreferredAuthMethod(): Promise<void> {
    await this.ensureReady();
    await this.owner.clearPreferredAuthMethod();
  }

  public async getUserById(userId: string): Promise<DatabaseUser | null> {
    await this.ensureReady();
    return this.owner.getUserById(userId);
  }

  public async getUserWithPasswordByEmail(email: string): Promise<DatabaseUserWithPassword | null> {
    await this.ensureReady();
    return this.owner.getUserWithPasswordByEmail(email);
  }

  public async getSessionById(sessionId: string): Promise<DatabaseSession | null> {
    await this.ensureReady();
    return this.owner.getSessionById(sessionId);
  }

  public async createSession(session: DatabaseSession): Promise<void> {
    await this.ensureReady();
    await this.owner.createSession(session);
  }

  public async deleteSessionById(sessionId: string): Promise<void> {
    await this.ensureReady();
    await this.owner.deleteSessionById(sessionId);
  }

  public async deleteExpiredSessions(expiresAtOrBefore: string): Promise<void> {
    await this.ensureReady();
    await this.owner.deleteExpiredSessions(expiresAtOrBefore);
  }

  public async registerOwnerWithPassword(input: {
    email: string;
    passwordHash: string;
    name: string | null;
  }): Promise<DatabaseOwnerRegistrationResult> {
    await this.ensureReady();
    return this.owner.registerOwnerWithPassword(input);
  }

  public async upsertOAuthProfile(profile: DatabaseOAuthProfile): Promise<DatabaseUser> {
    await this.ensureReady();
    return this.owner.upsertOAuthProfile(profile);
  }

  private async ensureReady(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = runPostgresSchemaMigrations(this.pool);
    }

    await this.readyPromise;
  }

  private createStore(): OwnerStore<PoolClient> {
    return {
      hasUsers: async (tx) => {
        const target = tx ?? this.pool;
        const result = await target.query("SELECT 1 AS has_user FROM atria_users LIMIT 1");
        return result.rows.length > 0;
      },
      getFirstUser: async (tx) => {
        const target = tx ?? this.pool;
        const result = await target.query(postgresAuthQueries.users.selectFirst);
        return rowToUser(result.rows[0]);
      },
      getMetaValue: async (key) => {
        const result = await this.pool.query(postgresAuthQueries.meta.selectValue, [key]);
        const row = asRecord(result.rows[0]);
        return typeof row?.value === "string" ? row.value : null;
      },
      upsertMetaValue: async (key, value, updatedAt) => {
        await this.pool.query(postgresAuthQueries.meta.upsertValue, [key, value, updatedAt]);
      },
      deleteMetaValue: async (key) => {
        await this.pool.query(postgresAuthQueries.meta.deleteValue, [key]);
      },
      isUniqueEmailViolation: (error) => {
        if (typeof error !== "object" || error === null) {
          return false;
        }

        const errorRecord = error as { code?: unknown; message?: unknown };
        if (errorRecord.code === "23505") {
          return true;
        }

        return typeof errorRecord.message === "string"
          ? errorRecord.message.toLowerCase().includes("duplicate key")
          : false;
      },
      getUserById: async (userId, tx) => {
        const target = tx ?? this.pool;
        const result = await target.query(postgresAuthQueries.users.selectById, [userId]);
        return rowToUser(result.rows[0]);
      },
      getUserByEmail: async (email, tx) => {
        const result = await tx.query(postgresAuthQueries.users.selectByEmail, [email]);
        return rowToUser(result.rows[0]);
      },
      getUserWithPasswordByEmail: async (email) => {
        const result = await this.pool.query(postgresAuthQueries.users.selectWithPasswordByEmail, [email]);
        return rowToUserWithPassword(result.rows[0]);
      },
      getSessionById: async (sessionId) => {
        const result = await this.pool.query(postgresAuthQueries.sessions.selectById, [sessionId]);
        return rowToSession(result.rows[0]);
      },
      upsertSession: async (session) => {
        await this.pool.query(postgresAuthQueries.sessions.upsert, [
          session.id,
          session.userId,
          session.createdAt,
          session.expiresAt
        ]);
      },
      deleteSessionById: async (sessionId) => {
        await this.pool.query(postgresAuthQueries.sessions.deleteById, [sessionId]);
      },
      deleteExpiredSessions: async (expiresAtOrBefore) => {
        await this.pool.query(postgresAuthQueries.sessions.deleteExpired, [expiresAtOrBefore]);
      },
      insertUser: async (user, tx) => {
        await tx.query(postgresAuthQueries.users.insert, [
          user.id,
          user.email,
          user.name,
          user.avatarUrl,
          user.createdAt,
          user.updatedAt
        ]);
      },
      insertCredential: async (input, tx) => {
        await tx.query(postgresAuthQueries.credentials.insert, [
          input.userId,
          input.passwordHash,
          input.createdAt,
          input.updatedAt
        ]);
      },
      updateUser: async (user, tx) => {
        await tx.query(postgresAuthQueries.users.update, [
          user.email,
          user.name,
          user.avatarUrl,
          user.updatedAt,
          user.id
        ]);
      },
      getIdentityByProvider: async (provider, providerUserId, tx) => {
        const result = await tx.query(postgresAuthQueries.identities.selectByProvider, [
          provider,
          providerUserId
        ]);
        const row = asRecord(result.rows[0]);
        if (!row) {
          return null;
        }

        return {
          userId: typeof row.user_id === "string" ? row.user_id : null
        };
      },
      updateIdentityByProvider: async (input, tx) => {
        await tx.query(postgresAuthQueries.identities.updateByProvider, [
          input.userId,
          input.email,
          input.name,
          input.avatarUrl,
          input.updatedAt,
          input.provider,
          input.providerUserId
        ]);
      },
      insertIdentity: async (input, tx) => {
        await tx.query(postgresAuthQueries.identities.insert, [
          input.provider,
          input.providerUserId,
          input.userId,
          input.email,
          input.name,
          input.avatarUrl,
          input.linkedAt,
          input.updatedAt
        ]);
      },
      withTransaction: async <T>(operation: (tx: PoolClient) => Promise<T>): Promise<T> => {
        const client = await this.pool.connect();
        try {
          await client.query("BEGIN");
          const result = await operation(client);
          await client.query("COMMIT");
          return result;
        } catch (error) {
          try {
            await client.query("ROLLBACK");
          } catch {
            // no-op
          }
          throw error;
        } finally {
          client.release();
        }
      }
    };
  }
}
