import { createAuthQuerySet } from "./build.js";

export type { QueryDialect, AuthQuerySet } from "./build.js";
export { createAuthQuerySet } from "./build.js";

export const sqliteAuthQueries = createAuthQuerySet("sqlite");
export const postgresAuthQueries = createAuthQuerySet("postgres");
