import { toStringValue } from "@/data/support/shared.js";
import type { PageRecord } from "../../../types.js";

export const toPageRecord = (row: {
  id?: unknown;
  title?: unknown;
  slug?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}): PageRecord => ({
  id: toStringValue(row.id),
  title: toStringValue(row.title),
  slug: toStringValue(row.slug),
  status: "draft",
  createdAt: toStringValue(row.createdAt),
  updatedAt: toStringValue(row.updatedAt),
});
