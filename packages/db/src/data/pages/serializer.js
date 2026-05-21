import { toStringValue } from "@/data/coerce.js";

const toPageStatus = (value) => {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }
  throw new Error(`Invalid page status: ${value}`);
};

export const toPageRecord = (row) => ({
  id: toStringValue(row.id),
  type: "page",
  status: toPageStatus(toStringValue(row.status)),
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
