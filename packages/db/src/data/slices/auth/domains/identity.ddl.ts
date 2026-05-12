export const identityDDL = [
  `CREATE TABLE IF NOT EXISTS identities (
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    linked_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(provider, provider_user_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`,
  "CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_identities_provider ON identities(provider)",
] as const;
