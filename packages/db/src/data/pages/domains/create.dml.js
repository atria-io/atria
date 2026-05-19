export const createQueries = {
  insertPage: [
    [
      "INSERT INTO documents",
      "(id, type, status, title, slug, created_at, published_at, updated_at)",
    ].join(" "),
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ].join(" "),
};
