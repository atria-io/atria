import { identityQueries } from "./domains/identity/queries.js";
import { osql } from "./domains/oauth/queries.js";
import { ownerQueries } from "./domains/owner/queries.js";
import { sessionQueries } from "./domains/session/queries.js";
import { userQueries } from "./domains/user/queries.js";

export const sql = {
  owner: ownerQueries,
  user: userQueries,
  session: sessionQueries,
  oauth: osql,
  identity: identityQueries,
} as const;
