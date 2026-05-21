export interface CatalogItem {
  uuid: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
}

export interface EditorState {
  creating: boolean;
  title: string;
  slug: string;
  currentUuid: string | null;
  drafts: CatalogItem[];
}

export interface PageApiPayload {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
}
