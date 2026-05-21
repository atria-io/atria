export const pagesDDL = [
  [
    "CREATE TABLE IF NOT EXISTS documents (",
    "id TEXT PRIMARY KEY,",
    "type TEXT NOT NULL DEFAULT 'page',",
    "status TEXT NOT NULL,",
    "title TEXT NOT NULL,",
    "slug TEXT NOT NULL,",
    "content TEXT NOT NULL,",
    "created_at TEXT NOT NULL,",
    "published_at TEXT,",
    "updated_at TEXT NOT NULL",
    ")"
  ].join(" "),
];
