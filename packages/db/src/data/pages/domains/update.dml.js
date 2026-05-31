export const updateQueries = {
  updatePage: [
    "UPDATE documents",
    [
      "SET",
      "status = ?,",
      "title = ?,",
      "slug = ?,",
      "content = ?,",
      "published_at = CASE WHEN ? = 'published' THEN ? ELSE NULL END,",
      "updated_at = ?",
    ].join(" "),
    "WHERE id = ?",
  ].join(" "),
  upsertPageVersion: [
    [
      "INSERT INTO document_versions",
      "(document_type, document_id, version_id, snapshot, created_at)",
    ].join(" "),
    "VALUES (?, ?, ?, ?, ?)",
    "ON CONFLICT(document_type, document_id, version_id)",
    "DO UPDATE SET snapshot = excluded.snapshot, created_at = excluded.created_at",
  ].join(" "),
};
