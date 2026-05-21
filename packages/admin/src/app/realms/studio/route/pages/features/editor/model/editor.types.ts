export interface CatalogItem {
  uuid: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published" | "archived";
}

export interface EditorState {
  isResolving: boolean;
  creating: boolean;
  hasEditorChanges: boolean;
  title: string;
  slug: string;
  content: string;
  currentUuid: string | null;
  drafts: CatalogItem[];
}

export interface PageApiPayload {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published" | "archived";
}
