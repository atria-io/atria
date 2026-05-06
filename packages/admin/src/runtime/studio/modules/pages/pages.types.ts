export type PageStatus = "draft" | "published" | "archived";

export interface PageListItem {
  uuid: string;
  title: string;
  status: PageStatus;
  draftSlug: string;
  publishedSlug: string | null;
  template: string;
  folderId: string | null;
  updatedAt: string;
}

export interface PageVersionSummary {
  versionId: string;
  kind: "draft-save" | "publish";
  createdAt: string;
  createdBy: string | null;
}

export interface PageDocument {
  uuid: string;
  document: string;
  template: string;
  title: string;
  status: PageStatus;
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

export interface FolderNode {
  id: string;
  name: string;
  parent: string | null;
}

export interface PagesWorkspaceFolders {
  folders: FolderNode[];
  assignments: Record<string, string>;
}

export interface PageDraftPatch {
  title?: string;
  draftSlug?: string;
  template?: string;
  status?: PageStatus;
  draftContent?: Record<string, unknown>;
}

export interface CreatePagePayload {
  slug: string;
  title?: string;
  template?: string;
  folderId?: string | null;
  locale?: string;
}
