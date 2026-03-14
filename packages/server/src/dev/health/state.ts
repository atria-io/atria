import {
  openAtriaDatabase,
  resolveDatabaseConnection,
  type DatabaseDriver,
  type DatabaseSource
} from "@atria/db";

export interface DatabaseHealthState {
  driver: DatabaseDriver;
  source: DatabaseSource;
  usesFallback: boolean;
  reachable: boolean;
  error: string | null;
}

const toHealthErrorMessage = (error: unknown): string => {
  if (error instanceof AggregateError) {
    const nested = error.errors
      .map((entry) => (entry instanceof Error && entry.message ? entry.message : String(entry)))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (nested.length > 0) {
      return nested.join(" | ");
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.trim().length > 0) {
      return code.trim();
    }
  }

  return String(error).trim();
};

export const readDatabaseHealthState = async (projectRoot: string): Promise<DatabaseHealthState> => {
  const connection = resolveDatabaseConnection(projectRoot);
  const baseState = {
    driver: connection.driver,
    source: connection.source,
    usesFallback: connection.usesFallback
  };

  try {
    const database = openAtriaDatabase(projectRoot);
    try {
      await database.hasUsers();
    } finally {
      await database.close();
    }

    return {
      ...baseState,
      reachable: true,
      error: null
    };
  } catch (error) {
    return {
      ...baseState,
      reachable: false,
      error: toHealthErrorMessage(error)
    };
  }
};
