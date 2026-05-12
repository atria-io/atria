import { getPageById, listPages } from "./read.db.js";
import { parseUuid } from "../shared.js";

export const resolvePagesList = listPages;

export const resolvePageGet = async (uuid: string) => {
  const id = parseUuid(uuid);
  if (!id) {
    return { status: "invalid_id" as const };
  }

  const page = await getPageById(id);
  if (!page) {
    return { status: "not_found" as const };
  }

  return { status: "ok" as const, payload: page };
};
