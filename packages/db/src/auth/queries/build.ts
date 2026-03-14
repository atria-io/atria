export type QueryDialect = "sqlite" | "postgres";

export interface AuthQuerySet {
  users: {
    selectById: string;
    selectByEmail: string;
    selectWithPasswordByEmail: string;
    insert: string;
    update: string;
  };
  credentials: {
    insert: string;
  };
  identities: {
    selectByProvider: string;
    updateByProvider: string;
    insert: string;
  };
  meta: {
    selectValue: string;
    deleteValue: string;
    upsertValue: string;
  };
  sessions: {
    selectById: string;
    upsert: string;
    deleteById: string;
    deleteExpired: string;
  };
}

const placeholder = (dialect: QueryDialect, position: number): string =>
  dialect === "sqlite" ? "?" : `$${position}`;

const excludedRef = (dialect: QueryDialect): string =>
  dialect === "sqlite" ? "excluded" : "EXCLUDED";

const identitySelectLock = (dialect: QueryDialect): string =>
  dialect === "postgres" ? "\n  FOR UPDATE" : "";

const toSql = (query: string): string => query.trim();

export const createAuthQuerySet = (dialect: QueryDialect): AuthQuerySet => {
  const p = (position: number): string => placeholder(dialect, position);
  const excluded = excludedRef(dialect);

  return {
    users: {
      selectById: toSql(`
        SELECT id, email, name, avatar_url, created_at, updated_at
        FROM atria_users
        WHERE id = ${p(1)}
      `),
      selectByEmail: toSql(`
        SELECT id, email, name, avatar_url, created_at, updated_at
        FROM atria_users
        WHERE email IS NOT NULL AND lower(email) = lower(${p(1)})
        LIMIT 1
      `),
      selectWithPasswordByEmail: toSql(`
        SELECT
          u.id,
          u.email,
          u.name,
          u.avatar_url,
          u.created_at,
          u.updated_at,
          c.password_hash
        FROM atria_users AS u
        INNER JOIN atria_user_credentials AS c
          ON c.user_id = u.id
        WHERE u.email IS NOT NULL AND lower(u.email) = lower(${p(1)})
        LIMIT 1
      `),
      insert: toSql(`
        INSERT INTO atria_users (id, email, name, avatar_url, created_at, updated_at)
        VALUES (${p(1)}, ${p(2)}, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)})
      `),
      update: toSql(`
        UPDATE atria_users
        SET email = ${p(1)}, name = ${p(2)}, avatar_url = ${p(3)}, updated_at = ${p(4)}
        WHERE id = ${p(5)}
      `)
    },
    credentials: {
      insert: toSql(`
        INSERT INTO atria_user_credentials (user_id, password_hash, created_at, updated_at)
        VALUES (${p(1)}, ${p(2)}, ${p(3)}, ${p(4)})
      `)
    },
    identities: {
      selectByProvider: toSql(`
        SELECT provider, provider_user_id, user_id, email, name, avatar_url, linked_at, updated_at
        FROM atria_identities
        WHERE provider = ${p(1)} AND provider_user_id = ${p(2)}${identitySelectLock(dialect)}
      `),
      updateByProvider: toSql(`
        UPDATE atria_identities
        SET user_id = ${p(1)}, email = ${p(2)}, name = ${p(3)}, avatar_url = ${p(4)}, updated_at = ${p(5)}
        WHERE provider = ${p(6)} AND provider_user_id = ${p(7)}
      `),
      insert: toSql(`
        INSERT INTO atria_identities (
          provider,
          provider_user_id,
          user_id,
          email,
          name,
          avatar_url,
          linked_at,
          updated_at
        ) VALUES (${p(1)}, ${p(2)}, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)}, ${p(8)})
      `)
    },
    meta: {
      selectValue: toSql(`
        SELECT value
        FROM atria_meta
        WHERE key = ${p(1)}
      `),
      deleteValue: toSql(`
        DELETE FROM atria_meta
        WHERE key = ${p(1)}
      `),
      upsertValue: toSql(`
        INSERT INTO atria_meta (key, value, updated_at)
        VALUES (${p(1)}, ${p(2)}, ${p(3)})
        ON CONFLICT(key) DO UPDATE SET
          value = ${excluded}.value,
          updated_at = ${excluded}.updated_at
      `)
    },
    sessions: {
      selectById: toSql(`
        SELECT id, user_id, created_at, expires_at
        FROM atria_sessions
        WHERE id = ${p(1)}
        LIMIT 1
      `),
      upsert: toSql(`
        INSERT INTO atria_sessions (id, user_id, created_at, expires_at)
        VALUES (${p(1)}, ${p(2)}, ${p(3)}, ${p(4)})
        ON CONFLICT(id) DO UPDATE SET
          user_id = ${excluded}.user_id,
          created_at = ${excluded}.created_at,
          expires_at = ${excluded}.expires_at
      `),
      deleteById: toSql(`
        DELETE FROM atria_sessions
        WHERE id = ${p(1)}
      `),
      deleteExpired: toSql(`
        DELETE FROM atria_sessions
        WHERE expires_at <= ${p(1)}
      `)
    }
  };
};
