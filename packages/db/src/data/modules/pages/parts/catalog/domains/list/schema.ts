export const listSchema = [
  `CREATE TABLE IF NOT EXISTS navigations (
    locale TEXT NOT NULL,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    data_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL,
    PRIMARY KEY(locale, key)
  )`,
] as const;
