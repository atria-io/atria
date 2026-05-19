import * as db from "@atria/db";

const asString = (value) => typeof value === "string" ? value : "";

export const getAuthUser = async (userId) => {
  const database = await db.openDB();
  try {
    const row = database
      .prepare([
        "SELECT name AS name, email AS email, avatar_url AS avatarUrl, ",
        "role AS role FROM users WHERE id = ? LIMIT 1",
      ].join(""))
      .get(userId);
    if (!row) {
      return null;
    }
    const email = asString(row.email);
    if (email === "") {
      return null;
    }
    const name = asString(row.name) || email;
    const avatarUrl = asString(row.avatarUrl);
    const role = asString(row.role) || "owner";
    return {
      name,
      email,
      avatarUrl,
      role
    };
  }
  finally {
    database.close();
  }
};
