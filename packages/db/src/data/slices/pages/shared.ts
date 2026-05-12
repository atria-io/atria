import { toStringValue } from "@/data/support/shared.js";
import type { PageRecord } from "./types.js";

export const toPageRecord = (row: {
  id?: unknown;
  type?: unknown;
  status?: unknown;
  title?: unknown;
  slug?: unknown;
  createdAt?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
}): PageRecord => ({
  id: toStringValue(row.id),
  type: "page",
  status: toStringValue(row.status) === "published" ? "published" : (toStringValue(row.status) === "archived" ? "archived" : "draft"),
  title: toStringValue(row.title),
  slug: toStringValue(row.slug),
  timestamps: {
    createdAt: toStringValue(row.createdAt),
    publishedAt: toStringValue(row.publishedAt) === "" ? null : toStringValue(row.publishedAt),
    updatedAt: toStringValue(row.updatedAt),
  },
});
