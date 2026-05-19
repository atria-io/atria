import * as crypto from "node:crypto";
import { sql } from "../dml.api.js";
import { withDB } from "@/system/with.js";
import { getTimestamp, toCount, toString } from "@/data/coerce.js";

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const getOwnerState = async () => {
  return withDB((db) => {
    const row = db
      .prepare(sql.owner.ownerSelectCount)
      .get();
    const ownerCount = toCount(row?.count);
    if (ownerCount === null) {
      return "setup";
    }
    return ownerCount > 0 ? "ready" : "create";
  });
};

export const createOwner = async (input) => {
  return withDB((db) => {
    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(input.password);
    const now = getTimestamp();
    db
      .prepare(sql.owner.ownerInsertUser)
      .run(
        userId,
        input.email,
        input.name ?? null,
        input.firstName ?? null,
        input.lastName ?? null,
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
  });
};

export const getOwnerId = async () => {
  return withDB((db) => {
    const row = db
      .prepare(sql.user.userSelectOwnerId)
      .get();
    return toString(row?.id);
  });
};
