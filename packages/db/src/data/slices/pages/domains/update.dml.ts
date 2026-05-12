export const updateQueries = {
  updatePageTitle: [
    "UPDATE documents",
    "SET status = ?, title = ?, slug = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE NULL END, updated_at = ?",
    "WHERE id = ?"
  ].join(" "),
} as const;
