import type { UpdatePageInput } from "../../../../types.js";
import { updatePage } from "./db.js";
import { parseSlug, parseTitle, parseUuid } from "../shared.js";

export const resolvePagePatch = async (
  uuid: string,
  payload: UpdatePageInput | null
) => {
  const id = parseUuid(uuid);
  const title = parseTitle(payload?.title);
  const slug = parseSlug(payload?.slug);

  if (!id || !title || !slug) {
    return { status: "invalid_payload" as const };
  }

  const page = await updatePage({ id, title, slug });
  if (!page) {
    return { status: "not_found" as const };
  }

  return { status: "ok" as const, payload: page };
};
