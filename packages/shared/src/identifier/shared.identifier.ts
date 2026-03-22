import { randomBytes } from "node:crypto";

export const createProjectIdentifier = (): string => {
  const raw = randomBytes(6).toString("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return (raw + "00000000").slice(0, 8);
};
