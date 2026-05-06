export const pageUpdateQueries = {
  updateDraft: `
    UPDATE documents
    SET
      title = ?,
      template = ?,
      draft_slug = ?,
      status = ?,
      draft_content = ?,
      updated_at = ?
    WHERE uuid = ?
  `,
} as const;
