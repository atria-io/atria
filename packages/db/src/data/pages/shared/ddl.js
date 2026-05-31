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
  [
    "CREATE TABLE IF NOT EXISTS document_versions (",
    "document_id TEXT NOT NULL,",
    "version_id TEXT NOT NULL,",
    "document_type TEXT NOT NULL,",
    "snapshot TEXT NOT NULL,",
    "created_at TEXT NOT NULL,",
    "FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,",
    "PRIMARY KEY (document_type, document_id, version_id)",
    ")"
  ].join(" "),
  "CREATE INDEX IF NOT EXISTS idx_document_versions_document_created ON document_versions (document_type, document_id, created_at DESC)",
  [
    "CREATE TABLE IF NOT EXISTS document_actions (",
    "id TEXT PRIMARY KEY,",
    "document_type TEXT NOT NULL,",
    "document_id TEXT NOT NULL,",
    "version_id TEXT,",
    "type TEXT NOT NULL,",
    "payload TEXT NOT NULL,",
    "created_at TEXT NOT NULL,",
    "FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE",
    ")"
  ].join(" "),
  "CREATE INDEX IF NOT EXISTS idx_document_actions_document_created ON document_actions (document_type, document_id, created_at DESC)",
];
