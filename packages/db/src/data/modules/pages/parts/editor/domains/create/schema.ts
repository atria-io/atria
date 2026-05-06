export const pageSchema = [
  `CREATE TABLE IF NOT EXISTS documents (
    uuid TEXT PRIMARY KEY,
    document TEXT NOT NULL DEFAULT 'page',
    template TEXT NOT NULL DEFAULT 'page.default',
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft','published','archived')),
    draft_slug TEXT NOT NULL,
    published_slug TEXT,
    draft_content TEXT NOT NULL DEFAULT '{}',
    published_content TEXT,
    published_version_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS documents_draft_slug_uq ON documents(draft_slug)",
  "CREATE UNIQUE INDEX IF NOT EXISTS documents_published_slug_uq ON documents(published_slug) WHERE published_slug IS NOT NULL",
  "CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status)",
] as const;
