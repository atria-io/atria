export const updateQueries = {
  updatePage: [
    "UPDATE documents",
    [
      "SET",
      "status = ?,",
      "title = ?,",
      "slug = ?,",
      "published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE NULL END,",
      "updated_at = ?",
    ].join(" "),
    "WHERE id = ?",
  ].join(" "),
};
