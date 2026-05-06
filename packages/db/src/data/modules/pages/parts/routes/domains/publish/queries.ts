export const routePublishQueries = {
  updatePublishedState: `
    UPDATE routes
    SET is_published = ?
    WHERE locale = ? AND page_uuid = ?
  `,
} as const;
