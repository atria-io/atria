export const pageUnpublishQueries = {
  updateUnpublished: `
    UPDATE documents
    SET
      status = 'draft',
      updated_at = ?
    WHERE uuid = ?
  `,
} as const;
