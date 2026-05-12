export const updateQueries = {
  updatePageTitle: [
    "UPDATE documents",
    "SET title = ?, slug = ?, status = ?, updated_at = ?",
    "WHERE id = ?"
  ].join(" "),
} as const;
