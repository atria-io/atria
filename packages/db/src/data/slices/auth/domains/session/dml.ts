export const sessionQueries = {
  sessionSelectById: `
    SELECT
      id AS id,
      user_id AS userId,
      expires_at AS expiresAt
    FROM sessions
    WHERE id = ?
    LIMIT 1
  `,

  sessionInsert: `
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `,

  sessionDeleteById: `
    DELETE FROM sessions
    WHERE id = ?
  `,
} as const;
