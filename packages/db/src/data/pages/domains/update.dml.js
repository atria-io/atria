export const updateQueries = {
  updatePage: [
    "UPDATE documents",
    [
      "SET",
      "status = ?,",
      "title = ?,",
      "slug = ?,",
      "published_at = CASE WHEN ? = 'published' THEN ? ELSE NULL END,",
      "updated_at = ?",
    ].join(" "),
    "WHERE id = ?",
  ].join(" "),
};
