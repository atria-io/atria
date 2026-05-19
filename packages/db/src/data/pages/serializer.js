import { toStringValue } from "@/data/coerce.js";

export const toPageRecord = (row) => ({
  id: toStringValue(row.id),
  type: "page",
  status:
    toStringValue(row.status) === "published"
      ? "published"
      : toStringValue(row.status) === "archived"
        ? "archived"
        : "draft",
  title: toStringValue(row.title),
  slug: toStringValue(row.slug),
  timestamps: {
    createdAt: toStringValue(row.createdAt),
    publishedAt:
      toStringValue(row.publishedAt) === ""
        ? null
        : toStringValue(row.publishedAt),
    updatedAt: toStringValue(row.updatedAt),
  },
});
