export const routeUpsertQueries = {
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
} as const;
