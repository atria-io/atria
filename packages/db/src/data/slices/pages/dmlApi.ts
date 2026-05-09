import { createQueries } from "./parts/crud/domains/create/queries.js";
import { readQueries } from "./parts/crud/domains/read/queries.js";
import { updateQueries } from "./parts/crud/domains/update/queries.js";
import { deleteQueries } from "./parts/crud/domains/delete/queries.js";

export const sql = {
  create: createQueries,
  read: readQueries,
  update: updateQueries,
  delete: deleteQueries,
} as const;
