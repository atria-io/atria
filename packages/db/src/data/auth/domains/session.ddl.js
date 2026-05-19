export const sessionDDL = [
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`,
  "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
];
