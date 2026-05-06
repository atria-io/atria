import {
  randomUUID,
  randomBytes,
  scryptSync
} from "node:crypto";
import { sql } from "../../dmlApi.js";
import { withDatabase } from "@/system/withDatabase.js";
import { getTimestamp, toCount, toString } from "@/data/support/shared.js";
import type { AuthOwnerInput, OwnerSetupState } from "../../types.js";

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const getOwnerState = async (): Promise<OwnerSetupState> => {
  return withDatabase("setup" as OwnerSetupState, (db) => {
    try {
      const row = db
        .prepare(sql.owner.ownerSelectCount)
        .get() as
          | { count?: unknown }
          | undefined;
      const ownerCount = toCount(row?.count);
      if (ownerCount === null) {
        return "setup";
      }

      return ownerCount > 0 ? "ready" : "create";
    } catch {
      return "setup";
    }
  });
};

export const createOwner = async (
  input: AuthOwnerInput
): Promise<string | null> => {
  return withDatabase<string | null>(null, (db) => {
    const userId = randomUUID();
    const passwordHash = hashPassword(input.password);
    const now = getTimestamp();

    try {
      db
        .prepare(sql.owner.ownerInsertUser)
        .run(
          userId,
          input.email,
          input.name ?? null,
          null,
          now,
          now
        );

      db
        .prepare(sql.owner.ownerInsertCredential)
        .run(
          userId,
          passwordHash,
          now,
          now
        );

      return userId;
    } catch {
      return null;
    }
  });
};

export const getOwnerId = async (): Promise<string | null> => {
  return withDatabase<string | null>(null, (db) => {
    try {
      const row = db
        .prepare(sql.user.userSelectOwnerId)
        .get() as
          | { id?: unknown }
          | undefined;
      return toString(row?.id);
    } catch {
      return null;
    }
  });
};
