import { createQueries } from "./domains/create.dml.js";
import { readQueries } from "./domains/read.dml.js";
import { updateQueries } from "./domains/update.dml.js";
import { deleteQueries } from "./domains/delete.dml.js";

export const sql = {
  create: createQueries,
  read: readQueries,
  update: updateQueries,
  delete: deleteQueries,
} as const;
