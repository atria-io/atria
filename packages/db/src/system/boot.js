import { ensureDatabaseFile } from "./open.js";
import { ensureComponentsDDL } from "../data/setup.js";

export const bootDB = async () => {
  await ensureDatabaseFile();
  return ensureComponentsDDL();
};
