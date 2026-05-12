export type PageStatus = "draft" | "published" | "archived";

export interface CreatePageInput {
  id?: unknown;
  title?: unknown;
  slug?: unknown;
}

export interface UpdatePageInput {
  title?: unknown;
  slug?: unknown;
  status?: unknown;
}
