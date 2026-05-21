export const createQueries = {
  insertPage: [
    [
      "INSERT INTO documents",
      "(id, type, status, title, slug, content, created_at, published_at, updated_at)",
    ].join(" "),
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ].join(" "),
};
