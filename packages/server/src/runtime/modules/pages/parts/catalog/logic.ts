import { createPageDraft, listPages } from "./db.js";
import type { CreatePageInput } from "../../types.js";

const toStringValue = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const toNullableString = (value: unknown): string | null => {
  const normalized = toStringValue(value);
  return normalized === "" ? null : normalized;
};

export const resolvePagesList = async (params: {
  locale: string | null;
  folderId: string | null;
}) => {
  return listPages({
    locale: params.locale ?? "default",
    folderId: params.folderId,
  });
};

export type CreatePageResult =
  | { status: "created"; payload: unknown }
  | { status: "invalid_slug" }
  | { status: "conflict" };

export const resolvePageCreate = async (
  payload: CreatePageInput | null
): Promise<CreatePageResult> => {
  const slug = toStringValue(payload?.slug);
  const template = toNullableString(payload?.template) ?? "page.default";
  if (slug === "") {
    return { status: "invalid_slug" };
  }

  const created = await createPageDraft({
    slug,
    title: toNullableString(payload?.title),
    template,
    folderId: toNullableString(payload?.folderId),
    locale: toNullableString(payload?.locale) ?? "default",
  });
  if (!created) {
    return { status: "conflict" };
  }

  return { status: "created", payload: created };
};
