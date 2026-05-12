export const readQueries = {
  selectPages: [
    "SELECT id, title, slug, status, created_at AS createdAt, updated_at AS updatedAt",
    "FROM documents",
    "ORDER BY updated_at DESC"
  ].join(" "),
  selectPageById: [
    "SELECT id, title, slug, status, created_at AS createdAt, updated_at AS updatedAt",
    "FROM documents",
    "WHERE id = ?",
    "LIMIT 1"
  ].join(" "),
} as const;
