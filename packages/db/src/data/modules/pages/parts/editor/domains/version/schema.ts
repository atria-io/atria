export const versionSchema = [
  `CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_uuid TEXT NOT NULL,
    version_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('draft-save','publish')),
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT,
    UNIQUE(document_uuid, version_id),
    FOREIGN KEY(document_uuid) REFERENCES documents(uuid) ON DELETE CASCADE
  )`,
  "CREATE INDEX IF NOT EXISTS document_versions_doc_idx ON document_versions(document_uuid)",
  "CREATE INDEX IF NOT EXISTS document_versions_doc_created_idx ON document_versions(document_uuid, created_at DESC)",
] as const;
