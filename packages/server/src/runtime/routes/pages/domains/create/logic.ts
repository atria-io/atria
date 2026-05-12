import type { CreatePageInput } from "../../types.js";
import { createPage } from "./db.js";
import { parseSlug, parseTitle, parseUuid } from "../shared.js";

export const resolvePageCreate = async (payload: CreatePageInput | null) => {
  const id = parseUuid(payload?.id);
  const title = parseTitle(payload?.title);
  const slug = parseSlug(payload?.slug);

  if (!id || !title || !slug) {
    return { status: "invalid_payload" as const };
  }

  const page = await createPage({ id, title, slug });
  if (!page) {
    return { status: "conflict" as const };
  }

  return { status: "created" as const, payload: page };
};
