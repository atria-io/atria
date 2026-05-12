export type PageStatus = "draft" | "published" | "archived";

export interface PageTimestamps {
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string;
}

export interface PageRecord {
  id: string;
  type: "page";
  status: PageStatus;
  title: string;
  slug: string;
  timestamps: PageTimestamps;
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
