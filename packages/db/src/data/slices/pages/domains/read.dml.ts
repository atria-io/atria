export const readQueries = {
  selectPages: [
    "SELECT id, type, status, title, slug, created_at AS createdAt, published_at AS publishedAt, updated_at AS updatedAt",
    "FROM documents",
    "ORDER BY updated_at DESC"
  ].join(" "),
  selectPageById: [
    "SELECT id, type, status, title, slug, created_at AS createdAt, published_at AS publishedAt, updated_at AS updatedAt",
    "FROM documents",
    "WHERE id = ?",
    "LIMIT 1"
  ].join(" "),
} as const;
