export interface CatalogItem {
  uuid: string;
  title: string;
  status: "draft";
}

export interface EditorState {
  creating: boolean;
  title: string;
  slug: string;
  slugTouched: boolean;
  currentUuid: string | null;
  drafts: CatalogItem[];
}

export interface PageApiPayload {
  id: string;
  title: string;
  slug: string;
  status: "draft";
}
