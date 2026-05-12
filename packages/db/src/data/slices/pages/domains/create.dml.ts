export const createQueries = {
  insertPage: [
    "INSERT INTO documents (id, title, slug, status, created_at, updated_at)",
    "VALUES (?, ?, ?, ?, ?, ?)"
  ].join(" "),
} as const;
