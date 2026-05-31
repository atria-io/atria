const hasColumn = (database, table, column) => {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }
  return rows.some((row) => row?.name === column);
};

const hasDocumentCascadeForeignKey = (database, table) => {
  const rows = database.prepare(`PRAGMA foreign_key_list(${table})`).all();
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }

  return rows.some((row) =>
    row?.table === "documents"
    && row?.from === "document_id"
    && String(row?.on_delete ?? "").toUpperCase() === "CASCADE"
  );
};

const migrateDocumentVersionsCascade = (database) => {
  if (hasDocumentCascadeForeignKey(database, "document_versions")) {
    return;
  }

  database.prepare("DROP INDEX IF EXISTS idx_document_versions_document_created").run();
  database.prepare("ALTER TABLE document_versions RENAME TO document_versions_legacy").run();
  database.prepare(
    [
      "CREATE TABLE document_versions (",
      "document_id TEXT NOT NULL,",
      "version_id TEXT NOT NULL,",
      "document_type TEXT NOT NULL,",
      "snapshot TEXT NOT NULL,",
      "created_at TEXT NOT NULL,",
      "FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,",
      "PRIMARY KEY (document_type, document_id, version_id)",
      ")",
    ].join(" ")
  ).run();
  database.prepare(
    [
      "INSERT INTO document_versions (document_id, version_id, document_type, snapshot, created_at)",
      "SELECT v.document_id, v.version_id, v.document_type, v.snapshot, v.created_at",
      "FROM document_versions_legacy v",
      "JOIN documents d ON d.id = v.document_id",
    ].join(" ")
  ).run();
  database.prepare("DROP TABLE document_versions_legacy").run();
  database.prepare(
    "CREATE INDEX IF NOT EXISTS idx_document_versions_document_created ON document_versions (document_type, document_id, created_at DESC)"
  ).run();
};

const migrateDocumentActionsCascade = (database) => {
  if (hasDocumentCascadeForeignKey(database, "document_actions")) {
    return;
  }

  database.prepare("DROP INDEX IF EXISTS idx_document_actions_document_created").run();
  database.prepare("ALTER TABLE document_actions RENAME TO document_actions_legacy").run();
  database.prepare(
    [
      "CREATE TABLE document_actions (",
      "id TEXT PRIMARY KEY,",
      "document_type TEXT NOT NULL,",
      "document_id TEXT NOT NULL,",
      "version_id TEXT,",
      "type TEXT NOT NULL,",
      "payload TEXT NOT NULL,",
      "created_at TEXT NOT NULL,",
      "FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE",
      ")",
    ].join(" ")
  ).run();
  database.prepare(
    [
      "INSERT INTO document_actions (id, document_type, document_id, version_id, type, payload, created_at)",
      "SELECT a.id, a.document_type, a.document_id, a.version_id, a.type, a.payload, a.created_at",
      "FROM document_actions_legacy a",
      "JOIN documents d ON d.id = a.document_id",
    ].join(" ")
  ).run();
  database.prepare("DROP TABLE document_actions_legacy").run();
  database.prepare(
    "CREATE INDEX IF NOT EXISTS idx_document_actions_document_created ON document_actions (document_type, document_id, created_at DESC)"
  ).run();
};

const migrateDocumentVersionsType = (database) => {
  if (hasColumn(database, "document_versions", "document_type")) {
    return;
  }

  database.prepare("DROP INDEX IF EXISTS idx_document_versions_document_created").run();
  database.prepare("ALTER TABLE document_versions RENAME TO document_versions_legacy").run();
  database.prepare(
    [
      "CREATE TABLE document_versions (",
      "document_id TEXT NOT NULL,",
      "version_id TEXT NOT NULL,",
      "document_type TEXT NOT NULL,",
      "snapshot TEXT NOT NULL,",
      "created_at TEXT NOT NULL,",
      "PRIMARY KEY (document_type, document_id, version_id)",
      ")",
    ].join(" ")
  ).run();
  database.prepare(
    [
      "INSERT INTO document_versions (document_type, document_id, version_id, snapshot, created_at)",
      "SELECT 'page', document_id, version_id, snapshot, created_at",
      "FROM document_versions_legacy",
    ].join(" ")
  ).run();
  database.prepare("DROP TABLE document_versions_legacy").run();
  database.prepare(
    "CREATE INDEX IF NOT EXISTS idx_document_versions_document_created ON document_versions (document_type, document_id, created_at DESC)"
  ).run();
};

const migrateDocumentActionsType = (database) => {
  if (hasColumn(database, "document_actions", "document_type")) {
    return;
  }

  database.prepare("ALTER TABLE document_actions ADD COLUMN document_type TEXT").run();
  database.prepare("UPDATE document_actions SET document_type = 'page' WHERE document_type IS NULL").run();
  database.prepare("DROP INDEX IF EXISTS idx_document_actions_document_created").run();
  database.prepare(
    "CREATE INDEX IF NOT EXISTS idx_document_actions_document_created ON document_actions (document_type, document_id, created_at DESC)"
  ).run();
};

const migrateDocumentActionsIdToText = (database) => {
  const rows = database.prepare("PRAGMA table_info(document_actions)").all();
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const idColumn = rows.find((row) => row?.name === "id");
  const idType = typeof idColumn?.type === "string" ? idColumn.type.toUpperCase() : "";
  if (idType !== "INTEGER") {
    return;
  }

  database.prepare("DROP INDEX IF EXISTS idx_document_actions_document_created").run();
  database.prepare("ALTER TABLE document_actions RENAME TO document_actions_legacy").run();
  database.prepare(
    [
      "CREATE TABLE document_actions (",
      "id TEXT PRIMARY KEY,",
      "document_type TEXT NOT NULL,",
      "document_id TEXT NOT NULL,",
      "version_id TEXT,",
      "type TEXT NOT NULL,",
      "payload TEXT NOT NULL,",
      "created_at TEXT NOT NULL",
      ")",
    ].join(" ")
  ).run();
  database.prepare(
    [
      "INSERT INTO document_actions (id, document_type, document_id, version_id, type, payload, created_at)",
      "SELECT",
      "'c' || lower(hex(randomblob(4))) || lower(hex(randomblob(8))) AS id,",
      "'page', document_id, version_id, type, payload, created_at",
      "FROM document_actions_legacy",
    ].join(" ")
  ).run();
  database.prepare("DROP TABLE document_actions_legacy").run();
  database.prepare(
    "CREATE INDEX IF NOT EXISTS idx_document_actions_document_created ON document_actions (document_type, document_id, created_at DESC)"
  ).run();
};

export const applyPagesMigrations = (database) => {
  migrateDocumentVersionsType(database);
  migrateDocumentActionsIdToText(database);
  migrateDocumentActionsType(database);
  migrateDocumentVersionsCascade(database);
  migrateDocumentActionsCascade(database);
};
