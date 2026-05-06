export const folderUpdateQueries = {
  upsertWorkspace: `
    INSERT INTO workspaces (
      scope,
      key,
      name,
      data_json,
      updated_at
    )
    VALUES ('documents:pages', 'folders', 'Page Folders', ?, ?)
    ON CONFLICT(scope, key)
    DO UPDATE SET
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `,
} as const;
