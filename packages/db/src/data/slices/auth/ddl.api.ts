import { identityDDL } from "./domains/identity.ddl.js";
import { ownerDDL } from "./domains/owner.ddl.js";
import { sessionDDL } from "./domains/session.ddl.js";

export const AUTH_DDL = [
  ...ownerDDL,
  ...sessionDDL,
  ...identityDDL,
] as const;
