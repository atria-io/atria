export const versionQueries = {
  selectById: `
    SELECT
      version_id AS versionId,
      kind AS kind,
      snapshot_json AS snapshotJson,
      created_at AS createdAt,
      created_by AS createdBy
    FROM document_versions
    WHERE document_uuid = ? AND version_id = ?
    LIMIT 1
  `,

  listByPage: `
    SELECT
      version_id AS versionId,
      kind AS kind,
      created_at AS createdAt,
      created_by AS createdBy
    FROM document_versions
    WHERE document_uuid = ?
    ORDER BY created_at DESC
  `,

  insert: `
    INSERT INTO document_versions (
      document_uuid,
      version_id,
      kind,
      snapshot_json,
      created_at,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `,
} as const;
