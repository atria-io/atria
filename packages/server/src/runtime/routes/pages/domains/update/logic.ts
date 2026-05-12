import type { UpdatePageInput } from "../../types.js";
import { updatePage } from "./db.js";
import { parseSlug, parseStatus, parseTitle, parseUuid } from "../shared.js";

export const resolvePagePatch = async (
  uuid: string,
  payload: UpdatePageInput | null
) => {
  const id = parseUuid(uuid);
  const title = parseTitle(payload?.title);
  const slug = parseSlug(payload?.slug);
  const status = parseStatus(payload?.status);

  if (!id || !title || !slug || !status) {
    return { status: "invalid_payload" as const };
  }

  const page = await updatePage({ id, title, slug, status });
  if (!page) {
    return { status: "not_found" as const };
  }

  return { status: "ok" as const, payload: page };
};
