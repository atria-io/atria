import { identitySchema } from "./domains/identity/schema.js";
import { ownerSchema } from "./domains/owner/schema.js";
import { sessionSchema } from "./domains/session/schema.js";

export const AUTH_SCHEMA = [
  ...ownerSchema,
  ...sessionSchema,
  ...identitySchema,
] as const;
