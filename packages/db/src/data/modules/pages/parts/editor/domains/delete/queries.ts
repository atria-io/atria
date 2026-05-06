export const pageDeleteQueries = {
  deleteByUuid: `
    DELETE FROM documents
    WHERE uuid = ?
  `,
} as const;
