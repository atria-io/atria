export const identityQueries = {
  selectUserId: `
    SELECT user_id AS userId
    FROM identities
    WHERE provider = ? AND provider_user_id = ?
    LIMIT 1
  `,

  selectUserIdByProvider: `
    SELECT user_id AS userId
    FROM identities
    WHERE provider = ?
    LIMIT 1
  `,

  upsert: `
    INSERT INTO identities (
      provider,
      provider_user_id,
      user_id,
      email,
      name,
      avatar_url,
      linked_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider, provider_user_id)
    DO UPDATE SET
      user_id = excluded.user_id,
      email = excluded.email,
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      updated_at = excluded.updated_at
  `,
} as const;
