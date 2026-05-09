export type PageStatus = "draft" | "published" | "archived";

export interface PageRecord {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  id: string;
  title: string;
  slug: string;
}

export interface UpdatePageInput {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
}
