import { openDatabase } from "./openDatabase.js";

type OpenedDatabase = NonNullable<Awaited<ReturnType<typeof openDatabase>>>;

export const withDatabase = async <T>(
  fallbackValue: T,
  run: (database: OpenedDatabase) => T | Promise<T>
): Promise<T> => {
  const database = await openDatabase();
  if (!database) {
    return fallbackValue;
  }

  try {
    return await run(database);
  } finally {
    database.close();
  }
};
