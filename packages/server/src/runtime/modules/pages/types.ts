export interface PageListItem {
  uuid: string;
  title: string;
  status: "draft" | "published" | "archived";
  draftSlug: string;
  publishedSlug: string | null;
  template: string;
  folderId: string | null;
  updatedAt: string;
}

export interface PageDocumentPayload {
  uuid: string;
  document: string;
  template: string;
  title: string;
  status: "draft" | "published" | "archived";
  draftSlug: string;
  publishedSlug: string | null;
  draftContent: Record<string, unknown>;
  publishedContent: Record<string, unknown> | null;
  publishedVersionId: string | null;
  folderId: string | null;
  routeSlug: string | null;
  routeParentUuid: string | null;
  routePublished: boolean | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface PageVersionSummary {
  versionId: string;
  kind: "draft-save" | "publish";
  createdAt: string;
  createdBy: string | null;
}

export interface CreatePageInput {
  slug: string;
  title?: string;
  template?: string;
  folderId?: string | null;
  locale?: string;
}

export interface UpdatePageInput {
  title?: string;
  draftSlug?: string;
  template?: string;
  status?: "draft" | "published" | "archived";
  draftContent?: Record<string, unknown>;
}
