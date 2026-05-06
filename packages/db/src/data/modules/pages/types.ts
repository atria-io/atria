export type DocumentStatus = "draft" | "published" | "archived";

export interface FolderNode {
  id: string;
  name: string;
  parent: string | null;
}

export interface WorkspaceFolders {
  folders: FolderNode[];
  assignments: Record<string, string>;
}

export interface PageVersion {
  versionId: string;
  kind: "draft-save" | "publish";
  createdAt: string;
  createdBy: string | null;
}

export interface CatalogItem {
  uuid: string;
  title: string;
  status: DocumentStatus;
  draftSlug: string;
  publishedSlug: string | null;
  template: string;
  folderId: string | null;
  updatedAt: string;
}

export interface Catalog {
  locale?: string | null;
  folderId?: string | null;
}

export interface PageDocument {
  uuid: string;
  document: string;
  template: string;
  title: string;
  status: DocumentStatus;
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

export interface PageById {
  locale?: string | null;
  versionId?: string | null;
}

export interface PageCreate {
  slug: string;
  title?: string | null;
  template?: string | null;
  folderId?: string | null;
  locale?: string | null;
}

export interface PageUpdate {
  title?: string;
  draftSlug?: string;
  template?: string;
  status?: DocumentStatus;
  draftContent?: Record<string, unknown>;
}

export interface PagePublish {
  actor?: string | null;
  locale?: string | null;
}
