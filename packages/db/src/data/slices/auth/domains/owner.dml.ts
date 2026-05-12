export const ownerQueries = {
  ownerSelectCount: `
    SELECT COUNT(*) AS count
    FROM users
    WHERE is_owner = 1
  `,

  ownerInsertUser: `
    INSERT INTO users (
      id,
      email,
      role,
      is_owner,
      name,
      first_name,
      last_name,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES (?, ?, 'owner', 1, ?, ?, ?, ?, ?, ?)
  `,

  ownerInsertCredential: `
    INSERT INTO user_credentials (
      user_id,
      password_hash,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?)
  `,
} as const;
