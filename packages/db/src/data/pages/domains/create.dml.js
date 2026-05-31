export const createQueries = {
  insertPage: [
    [
      "INSERT INTO documents",
      "(id, type, status, title, slug, content, created_at, published_at, updated_at)",
    ].join(" "),
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ].join(" "),
  insertPageAction: [
    [
      "INSERT INTO document_actions",
      "(id, document_type, document_id, version_id, type, payload, created_at)",
    ].join(" "),
    "VALUES (?, ?, ?, ?, ?, ?, ?)",
  ].join(" "),
};
