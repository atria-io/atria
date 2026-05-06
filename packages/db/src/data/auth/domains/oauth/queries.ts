export const osql = {
  oauthUpdateUser: `
    UPDATE users
    SET
      email = COALESCE(?, email),
      name = COALESCE(?, name),
      avatar_url = COALESCE(?, avatar_url),
      updated_at = ?
    WHERE id = ?
  `,

  oauthInsertOwnerUser: `
    INSERT INTO users (
      id,
      email,
      role,
      is_owner,
      name,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES (?, ?, 'owner', 1, ?, ?, ?, ?)
  `,
} as const;
