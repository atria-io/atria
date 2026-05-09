export const documentsDDL = [
  [
    "CREATE TABLE IF NOT EXISTS documents (",
    "id TEXT PRIMARY KEY,",
    "title TEXT NOT NULL,",
    "slug TEXT NOT NULL,",
    "status TEXT NOT NULL,",
    "created_at TEXT NOT NULL,",
    "updated_at TEXT NOT NULL",
    ")"
  ].join(" "),
] as const;
