import * as api from "../features/editor/api/editor.fetch.js";
import type { CatalogItem, PageApiPayload } from "./pages.types.js";

const toCatalogItem = (payload: PageApiPayload): CatalogItem => ({
  uuid: payload.id,
  title: payload.title,
  slug: payload.slug,
  content: payload.content,
  status: payload.status,
});

export const list = async (): Promise<Array<CatalogItem>> => {
  const items = await api.listPages();
  return items.map(toCatalogItem);
};

export const get = async (
  id: string,
  versionId?: string,
  actionId?: string,
  mode?: "editor",
): Promise<PageApiPayload | null> => {
  return api.getPage(id, versionId, actionId, mode);
};

export const create = async (
  id: string,
  title: string,
  slug: string,
  content: string,
): Promise<PageApiPayload | null> => {
  return api.createPage(id, title, slug, content);
};

export const update = async (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
  versionId?: string | null,
): Promise<PageApiPayload | null> => {
  return api.updatePage(id, title, slug, content, status, versionId);
};

export const saveVersion = async (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
  versionId?: string | null,
): Promise<PageApiPayload | null> => {
  return api.savePageVersion(id, title, slug, content, status, versionId);
};

export const remove = async (id: string): Promise<boolean> => {
  return api.deletePage(id);
};
