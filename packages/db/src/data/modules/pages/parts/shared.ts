import { openDatabase } from "@/system/openDatabase.js";
import * as support from "@/data/support/shared.js";

export type PagesDatabase = NonNullable<Awaited<ReturnType<typeof openDatabase>>>;

export const DEFAULT_LOCALE = "default";

export const getLocale = (locale: string | null | undefined): string => {
  const normalized = support.toString(locale);
  return normalized ?? DEFAULT_LOCALE;
};

export const normalizeSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export const getFolderId = (
  dataJson: Record<string, unknown>,
  documentUuid: string
): string | null => {
  const assignments = dataJson.assignments;
  if (!assignments || typeof assignments !== "object" || Array.isArray(assignments)) {
    return null;
  }

  const raw = (assignments as Record<string, unknown>)[documentUuid];
  return support.toString(raw);
};

export const resolveFolders = (input: unknown): Record<string, unknown> => {
  const data = input && typeof input === "object" && !Array.isArray(input)
    ? { ...(input as Record<string, unknown>) }
    : {};
  if (!data.folders || typeof data.folders !== "object" || Array.isArray(data.folders)) {
    data.folders = {};
  }
  if (!data.assignments || typeof data.assignments !== "object" || Array.isArray(data.assignments)) {
    data.assignments = {};
  }
  return data;
};

export const runInTransaction = <T>(db: PagesDatabase, run: () => T): T => {
  db.prepare("BEGIN").run();
  try {
    const result = run();
    db.prepare("COMMIT").run();
    return result;
  } catch (error) {
    db.prepare("ROLLBACK").run();
    throw error;
  }
};
