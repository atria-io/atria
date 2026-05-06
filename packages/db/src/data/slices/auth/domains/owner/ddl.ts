export const ownerDDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    is_owner INTEGER NOT NULL DEFAULT 0,
    name TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_credentials (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`,
  "CREATE INDEX IF NOT EXISTS idx_users_owner ON users(is_owner)",
  "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
] as const;
