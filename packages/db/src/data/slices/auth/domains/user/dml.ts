export const userQueries = {
  userSelectOwnerId: `
    SELECT id AS id
    FROM users
    WHERE is_owner = 1
    LIMIT 1
  `,

  userSelectByEmail: `
    SELECT
      u.id AS id,
      u.email AS email,
      c.password_hash AS passwordHash
    FROM users u
    INNER JOIN user_credentials c ON c.user_id = u.id
    WHERE lower(u.email) = lower(?)
    LIMIT 1
  `,

  userSelectIdByEmail: `
    SELECT id AS id
    FROM users
    WHERE lower(email) = lower(?)
    LIMIT 1
  `,
} as const;
