import { identityQueries } from "./domains/identity.dml.js";
import { oauthQueries } from "./domains/oauth.dml.js";
import { ownerQueries } from "./domains/owner.dml.js";
import { sessionQueries } from "./domains/session.dml.js";
import { userQueries } from "./domains/user.dml.js";

export const sql = {
  owner: ownerQueries,
  user: userQueries,
  session: sessionQueries,
  oauth: oauthQueries,
  identity: identityQueries,
};
