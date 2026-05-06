import {
  deletePage,
  getPageByUuid,
  getPageVersion,
  listPageVersions,
  publishPage,
  unpublishPage,
  updatePageDraft,
} from "./db.js";
import type { UpdatePageInput } from "../../types.js";

const toStringValue = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toNullableString = (value: unknown): string | null => {
  const normalized = toStringValue(value);
  return normalized === "" ? null : normalized;
};

const isValidStatus = (
  value: unknown
): value is "draft" | "published" | "archived" =>
  value === "draft" || value === "published" || value === "archived";

export const resolvePageGet = async (
  uuid: string,
  params: { locale: unknown; versionId: unknown }
) => {
  return getPageByUuid(uuid, {
    locale: toNullableString(params.locale) ?? "default",
    versionId: toNullableString(params.versionId),
  });
};

export type UpdatePageResult =
  | { status: "invalid_payload" }
  | { status: "invalid_status" }
  | { status: "not_found" }
  | { status: "ok"; payload: unknown };

export const resolvePagePatch = async (
  uuid: string,
  payload: UpdatePageInput | null
): Promise<UpdatePageResult> => {
  if (!payload) {
    return { status: "invalid_payload" };
  }

  if (payload.status !== undefined && !isValidStatus(payload.status)) {
    return { status: "invalid_status" };
  }

  const updated = await updatePageDraft(uuid, {
    title: payload.title,
    draftSlug: payload.draftSlug,
    template: payload.template,
    status: payload.status,
    draftContent: payload.draftContent,
  });
  if (!updated) {
    return { status: "not_found" };
  }

  return { status: "ok", payload: updated };
};

export const resolvePageDelete = async (uuid: string): Promise<boolean> => {
  return deletePage(uuid);
};

export const resolvePagePublish = async (
  uuid: string,
  params: { locale: unknown; actor: unknown }
) => {
  return publishPage(uuid, {
    actor: toNullableString(params.actor),
    locale: toNullableString(params.locale) ?? "default",
  });
};

export const resolvePageUnpublish = async (uuid: string, locale: unknown) => {
  return unpublishPage(uuid, toNullableString(locale) ?? "default");
};

export const resolvePageVersionsList = async (uuid: string) => {
  return listPageVersions(uuid);
};

export const resolvePageVersionGet = async (uuid: string, versionId: string) => {
  return getPageVersion(uuid, versionId);
};
