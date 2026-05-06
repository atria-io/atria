export const routeQueries = {
  selectByPageAndLocale: `
    SELECT
      slug AS slug,
      parent_uuid AS parentUuid,
      is_published AS isPublished
    FROM routes
    WHERE page_uuid = ? AND locale = ?
    LIMIT 1
  `,

  upsert: `
    INSERT INTO routes (
      locale,
      page_uuid,
      slug,
      parent_uuid,
      is_published
    )
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(locale, page_uuid)
    DO UPDATE SET
      slug = excluded.slug,
      parent_uuid = excluded.parent_uuid,
      is_published = excluded.is_published
  `,

  updatePublishedState: `
    UPDATE routes
    SET is_published = ?
    WHERE locale = ? AND page_uuid = ?
  `,
} as const;
