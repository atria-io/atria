export const pagePublishQueries = {
  updatePublished: `
    UPDATE documents
    SET
      status = 'published',
      published_slug = ?,
      published_content = ?,
      published_version_id = ?,
      published_at = ?,
      updated_at = ?
    WHERE uuid = ?
  `,
} as const;
