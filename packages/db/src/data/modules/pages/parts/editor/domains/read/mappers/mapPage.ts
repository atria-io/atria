import * as support from "@/data/support/shared.js";
import * as scope from "../../../../shared.js";
import type { PageDocument } from "@/data/modules/pages/types.js";
import type * as readTypes from "../types.js";

export const mapPage = (
  row: readTypes.PageRecord,
  route: readTypes.RouteLookup | undefined,
  workspace: Record<string, unknown>,
  snapshotOverride: readTypes.VersionSnapshot | undefined,
  version: string | null
): PageDocument => {
  const parsedDraft = support.parseJSON(row.draftContent);
  const parsedPublished = support.parseJSON(row.publishedContent);
  const parsedVersion = support.parseJSON(snapshotOverride?.snapshotJson);
  const draftContent = version ? parsedVersion : parsedDraft;

  return {
    uuid: support.toString(row.uuid) ?? "",
    document: support.toString(row.document) ?? "",
    template: support.toString(row.template) ?? "",
    title: support.toString(row.title) ?? "",
    status: ((support.toString(row.status) ?? "") as PageDocument["status"]) || "draft",
    draftSlug: support.toString(row.draftSlug) ?? "",
    publishedSlug: support.toStringOrNull(row.publishedSlug),
    draftContent,
    publishedContent: Object.keys(parsedPublished).length > 0 ? parsedPublished : null,
    publishedVersionId: support.toStringOrNull(row.publishedVersionId),
    folderId: scope.getFolderId(workspace, support.toString(row.uuid) ?? ""),
    routeSlug: support.toStringOrNull(route?.slug),
    routeParentUuid: support.toStringOrNull(route?.parentUuid),
    routePublished: route ? support.toBoolean(route.isPublished) : null,
    createdAt: support.toString(row.createdAt) ?? "",
    updatedAt: support.toString(row.updatedAt) ?? "",
    publishedAt: support.toStringOrNull(row.publishedAt),
  };
};

export const toVersionId = (
  value: unknown
): string | null => {
  return support.toString(value);
};
