import * as pagesApi from "../features/editor/api/editor.api.js";
import type { CatalogItem, PageApiPayload } from "./pages.types.js";

const toCatalogItem = (payload: PageApiPayload): CatalogItem => ({
  uuid: payload.id,
  title: payload.title,
  slug: payload.slug,
  content: payload.content,
  status: payload.status,
});

export const list = async (): Promise<Array<CatalogItem>> => {
  const items = await pagesApi.listPages();
  return items.map(toCatalogItem);
};

export const get = async (id: string): Promise<PageApiPayload | null> => {
  return pagesApi.getPage(id);
};

export const create = async (
  id: string,
  title: string,
  slug: string,
  content: string,
): Promise<PageApiPayload | null> => {
  return pagesApi.createPage(id, title, slug, content);
};

export const update = async (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
): Promise<PageApiPayload | null> => {
  return pagesApi.updatePage(id, title, slug, content, status);
};

export const remove = async (id: string): Promise<boolean> => {
  return pagesApi.deletePage(id);
};
