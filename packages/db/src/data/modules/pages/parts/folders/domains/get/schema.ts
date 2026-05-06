export const folderSchema = [
  `CREATE TABLE IF NOT EXISTS workspaces (
    scope TEXT NOT NULL,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    data_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL,
    PRIMARY KEY(scope, key)
  )`,
] as const;
