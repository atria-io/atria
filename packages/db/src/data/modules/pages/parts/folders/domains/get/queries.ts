export const folderQueries = {
  selectWorkspace: `
    SELECT data_json AS dataJson
    FROM workspaces
    WHERE scope = 'documents:pages' AND key = 'folders'
    LIMIT 1
  `,

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
