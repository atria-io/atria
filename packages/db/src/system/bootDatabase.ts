import { ensureDatabaseFile } from "./openDatabase.js";
import { ensureComponentsDDL } from "../data/support/setup.js";

export const initializeDatabase = async (): Promise<boolean> => {
  const databaseReady = await ensureDatabaseFile();
  if (!databaseReady) {
    return false;
  }

  return ensureComponentsDDL();
};
