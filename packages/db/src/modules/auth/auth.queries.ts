export const AUTH_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS atria_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    is_owner INTEGER NOT NULL DEFAULT 0,
    name TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS atria_user_credentials (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES atria_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS atria_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES atria_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS atria_identities (
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    linked_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(provider, provider_user_id),
    FOREIGN KEY(user_id) REFERENCES atria_users(id)
  )`,
  "CREATE INDEX IF NOT EXISTS idx_atria_users_owner ON atria_users(is_owner)",
  "CREATE INDEX IF NOT EXISTS idx_atria_users_email ON atria_users(email)",
  "CREATE INDEX IF NOT EXISTS idx_atria_sessions_user_id ON atria_sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_atria_identities_user_id ON atria_identities(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_atria_identities_provider ON atria_identities(provider)",
] as const;

export const authQueries = {
  countOwners: "SELECT COUNT(*) AS count FROM atria_users WHERE is_owner = 1",
  insertOwnerUser:
    "INSERT INTO atria_users (id, email, role, is_owner, name, avatar_url, created_at, updated_at) VALUES (?, ?, 'owner', 1, ?, ?, ?, ?)",
  insertOwnerCredential:
    "INSERT INTO atria_user_credentials (user_id, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)",
  selectUserByEmail:
    "SELECT u.id AS id, u.email AS email, c.password_hash AS passwordHash FROM atria_users u INNER JOIN atria_user_credentials c ON c.user_id = u.id WHERE lower(u.email) = lower(?) LIMIT 1",
  insertSession:
    "INSERT INTO atria_sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  selectSessionById:
    "SELECT id AS id, user_id AS userId, expires_at AS expiresAt FROM atria_sessions WHERE id = ? LIMIT 1",
  deleteSessionById: "DELETE FROM atria_sessions WHERE id = ?",
  selectIdentityUserId:
    "SELECT user_id AS userId FROM atria_identities WHERE provider = ? AND provider_user_id = ? LIMIT 1",
  selectLinkedUserIdByProvider:
    "SELECT user_id AS userId FROM atria_identities WHERE provider = ? LIMIT 1",
  selectUserIdByEmail: "SELECT id AS id FROM atria_users WHERE lower(email) = lower(?) LIMIT 1",
  selectOwnerUserId: "SELECT id AS id FROM atria_users WHERE is_owner = 1 LIMIT 1",
  insertOAuthOwnerUser:
    "INSERT INTO atria_users (id, email, role, is_owner, name, avatar_url, created_at, updated_at) VALUES (?, ?, 'owner', 1, ?, ?, ?, ?)",
  updateUserFromOAuth:
    "UPDATE atria_users SET email = COALESCE(?, email), name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), updated_at = ? WHERE id = ?",
  upsertIdentity:
    "INSERT INTO atria_identities (provider, provider_user_id, user_id, email, name, avatar_url, linked_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(provider, provider_user_id) DO UPDATE SET user_id = excluded.user_id, email = excluded.email, name = excluded.name, avatar_url = excluded.avatar_url, updated_at = excluded.updated_at",
} as const;
