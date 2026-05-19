import { openDB } from "./open.js";

export const withDB = async (run) => {
  const database = await openDB();
  try {
    return await run(database);
  }
  finally {
    database.close();
  }
};
