export const updateQueries = {
  updatePageTitle: [
    "UPDATE documents",
    "SET title = ?, slug = ?, updated_at = ?",
    "WHERE id = ?"
  ].join(" "),
} as const;
