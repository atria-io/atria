import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { openDatabase } from "../../client/openDatabase.js";
import type { AuthOwnerInput, AuthSession, AuthUser, OwnerSetupState } from "./auth.types.js";

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

const toStringValue = (value: unknown): string | null => {
  if (typeof value === "string" && value !== "") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "bigint") {
    return String(value);
  }
  return null;
};

const parseCount = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const getOwnerSetupState = async (): Promise<OwnerSetupState> => {
  const database = await openDatabase();
  if (!database) {
    return "setup";
  }

  try {
    const statements: Array<{ sql: string; args: unknown[] }> = [
      { sql: "SELECT COUNT(*) AS count FROM atria_users WHERE role = ?", args: ["owner"] },
      { sql: "SELECT COUNT(*) AS count FROM atria_users WHERE is_owner = 1", args: [] },
    ];

    for (const statement of statements) {
      try {
        const row = database.prepare(statement.sql).get(...statement.args) as
          | { count?: unknown }
          | undefined;
        const count = parseCount(row?.count);
        if (count !== null) {
          return count > 0 ? "ready" : "create";
        }
      } catch {
        continue;
      }
    }

    return "setup";
  } finally {
    database.close();
  }
};

export const createOwner = async (input: AuthOwnerInput): Promise<string | null> => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  const userId = randomUUID();
  const hashedPassword = hashPassword(input.password);

  try {
    const userStatements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: "INSERT INTO atria_users (id, email, role, is_owner) VALUES (?, ?, ?, 1)",
        args: [userId, input.email, "owner"],
      },
      {
        sql: "INSERT INTO atria_users (id, email, role) VALUES (?, ?, ?)",
        args: [userId, input.email, "owner"],
      },
      {
        sql: "INSERT INTO atria_users (id, email, is_owner) VALUES (?, ?, 1)",
        args: [userId, input.email],
      },
    ];

    let userCreated = false;
    for (const statement of userStatements) {
      try {
        database.prepare(statement.sql).run(...statement.args);
        userCreated = true;
        break;
      } catch {
        continue;
      }
    }

    if (!userCreated) {
      return null;
    }

    const credentialStatements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: "INSERT INTO atria_user_credentials (user_id, password) VALUES (?, ?)",
        args: [userId, hashedPassword],
      },
      {
        sql: "INSERT INTO atria_user_credentials (user_id, secret) VALUES (?, ?)",
        args: [userId, hashedPassword],
      },
      {
        sql: "INSERT INTO atria_user_credentials (user_id, password_hash) VALUES (?, ?)",
        args: [userId, hashedPassword],
      },
    ];

    for (const statement of credentialStatements) {
      try {
        database.prepare(statement.sql).run(...statement.args);
        return userId;
      } catch {
        continue;
      }
    }

    return null;
  } finally {
    database.close();
  }
};

export const getUserByEmail = async (email: string): Promise<AuthUser | null> => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const statements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: "SELECT u.id AS id, u.email AS email, c.password AS password FROM atria_users u JOIN atria_user_credentials c ON c.user_id = u.id WHERE u.email = ? LIMIT 1",
        args: [email],
      },
      {
        sql: "SELECT u.id AS id, u.email AS email, c.secret AS password FROM atria_users u JOIN atria_user_credentials c ON c.user_id = u.id WHERE u.email = ? LIMIT 1",
        args: [email],
      },
      {
        sql: "SELECT u.id AS id, u.email AS email, c.password_hash AS password FROM atria_users u JOIN atria_user_credentials c ON c.user_id = u.id WHERE u.email = ? LIMIT 1",
        args: [email],
      },
      {
        sql: "SELECT id, email, password FROM atria_users WHERE email = ? LIMIT 1",
        args: [email],
      },
    ];

    for (const statement of statements) {
      try {
        const row = database.prepare(statement.sql).get(...statement.args) as
          | { id?: unknown; email?: unknown; password?: unknown }
          | undefined;
        const id = toStringValue(row?.id);
        const rowEmail = toStringValue(row?.email);
        const password = toStringValue(row?.password);
        if (id && rowEmail && password) {
          return { id, email: rowEmail, password };
        }
      } catch {
        continue;
      }
    }

    return null;
  } finally {
    database.close();
  }
};

export const createSession = async (userId: string): Promise<AuthSession | null> => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  const sessionId = randomUUID();
  const now = new Date().toISOString();

  try {
    const statements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: "INSERT INTO atria_sessions (id, user_id, created_at) VALUES (?, ?, ?)",
        args: [sessionId, userId, now],
      },
      {
        sql: "INSERT INTO atria_sessions (id, user_id) VALUES (?, ?)",
        args: [sessionId, userId],
      },
      {
        sql: "INSERT INTO atria_sessions (session_id, user_id, created_at) VALUES (?, ?, ?)",
        args: [sessionId, userId, now],
      },
      {
        sql: "INSERT INTO atria_sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        args: [sessionId, userId, now],
      },
    ];

    for (const statement of statements) {
      try {
        database.prepare(statement.sql).run(...statement.args);
        return { id: sessionId, userId };
      } catch {
        continue;
      }
    }

    return null;
  } finally {
    database.close();
  }
};

export const getSessionById = async (sessionId: string): Promise<AuthSession | null> => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const statements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: "SELECT id AS id, user_id AS userId FROM atria_sessions WHERE id = ? LIMIT 1",
        args: [sessionId],
      },
      {
        sql: "SELECT session_id AS id, user_id AS userId FROM atria_sessions WHERE session_id = ? LIMIT 1",
        args: [sessionId],
      },
      {
        sql: "SELECT token AS id, user_id AS userId FROM atria_sessions WHERE token = ? LIMIT 1",
        args: [sessionId],
      },
    ];

    for (const statement of statements) {
      try {
        const row = database.prepare(statement.sql).get(...statement.args) as
          | { id?: unknown; userId?: unknown }
          | undefined;
        const id = toStringValue(row?.id);
        const userId = toStringValue(row?.userId);
        if (id && userId) {
          return { id, userId };
        }
      } catch {
        continue;
      }
    }

    return null;
  } finally {
    database.close();
  }
};

export const deleteSessionById = async (sessionId: string): Promise<void> => {
  const database = await openDatabase();
  if (!database) {
    return;
  }

  try {
    const statements: Array<{ sql: string; args: unknown[] }> = [
      { sql: "DELETE FROM atria_sessions WHERE id = ?", args: [sessionId] },
      { sql: "DELETE FROM atria_sessions WHERE session_id = ?", args: [sessionId] },
      { sql: "DELETE FROM atria_sessions WHERE token = ?", args: [sessionId] },
    ];

    for (const statement of statements) {
      try {
        database.prepare(statement.sql).run(...statement.args);
      } catch {
        continue;
      }
    }
  } finally {
    database.close();
  }
};
