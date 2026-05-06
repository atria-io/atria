export const pageQueries = {
  listByLocale: `
    SELECT
      d.uuid AS uuid,
      d.title AS title,
      d.status AS status,
      d.draft_slug AS draftSlug,
      d.published_slug AS publishedSlug,
      d.template AS template,
      d.updated_at AS updatedAt
    FROM documents d
    ORDER BY d.updated_at DESC
  `,

  selectByUuid: `
    SELECT
      uuid AS uuid,
      document AS document,
      template AS template,
      title AS title,
      status AS status,
      draft_slug AS draftSlug,
      published_slug AS publishedSlug,
      draft_content AS draftContent,
      published_content AS publishedContent,
      published_version_id AS publishedVersionId,
      created_at AS createdAt,
      updated_at AS updatedAt,
      published_at AS publishedAt
    FROM documents
    WHERE uuid = ?
    LIMIT 1
  `,

  insert: `
    INSERT INTO documents (
      uuid,
      document,
      template,
      title,
      status,
      draft_slug,
      published_slug,
      draft_content,
      published_content,
      published_version_id,
      created_at,
      updated_at,
      published_at
    )
    VALUES (?, 'page', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

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

  updateUnpublished: `
    UPDATE documents
    SET
      status = 'draft',
      updated_at = ?
    WHERE uuid = ?
  `,

  deleteByUuid: `
    DELETE FROM documents
    WHERE uuid = ?
  `,
} as const;
