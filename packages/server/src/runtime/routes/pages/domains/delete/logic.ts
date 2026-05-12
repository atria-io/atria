import { deletePage } from "./db.js";
import { parseUuid } from "../shared.js";

export const resolvePageDelete = async (uuid: string): Promise<boolean> => {
  const id = parseUuid(uuid);
  if (!id) {
    return false;
  }

  return deletePage(id);
};
