export type PageStatus = "draft" | "published";

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
