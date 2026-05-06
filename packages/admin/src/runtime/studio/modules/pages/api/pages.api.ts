import type {
  CreatePagePayload,
  PageDocument,
  PageDraftPatch,
  PageListItem,
  PagesWorkspaceFolders,
  PageVersionSummary,
} from "../pages.types.js";

const readJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T;
  return payload;
};

const assertOk = (response: Response): void => {
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
};

export const listPages = async (
  params: { locale?: string;
    folderId?: string | null }
  ): Promise<PageListItem[]> => {
  const search = new URLSearchParams();
  search.set("locale", params.locale ?? "default");
  if (params.folderId) {
    search.set("folder", params.folderId);
  }

  const response = await fetch(`/api/pages?${search.toString()}`, { method: "GET" });
  assertOk(response);
  const payload = await readJson<{ items: PageListItem[] }>(response);
  return payload.items;
};

export const createPage = async (input: CreatePagePayload): Promise<PageDocument> => {
  const response = await fetch("/api/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assertOk(response);
  return readJson<PageDocument>(response);
};

export const getPage = async (
  uuid: string,
  params: { locale?: string; versionId?: string | null } = {}
): Promise<PageDocument> => {
  const search = new URLSearchParams();
  search.set("locale", params.locale ?? "default");
  if (params.versionId) {
    search.set("version", params.versionId);
  }
  const response = await fetch(`/api/pages/${uuid}?${search.toString()}`, { method: "GET" });
  assertOk(response);
  return readJson<PageDocument>(response);
};

export const patchPage = async (uuid: string, patch: PageDraftPatch): Promise<PageDocument> => {
  const response = await fetch(`/api/pages/${uuid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  assertOk(response);
  return readJson<PageDocument>(response);
};

export const deletePage = async (uuid: string): Promise<void> => {
  const response = await fetch(`/api/pages/${uuid}`, { method: "DELETE" });
  assertOk(response);
};

export const publishPage = async (uuid: string, locale = "default"): Promise<PageDocument> => {
  const response = await fetch(`/api/pages/${uuid}/publish?locale=${encodeURIComponent(locale)}`, { method: "POST" });
  assertOk(response);
  return readJson<PageDocument>(response);
};

export const unpublishPage = async (uuid: string, locale = "default"): Promise<PageDocument> => {
  const response = await fetch(`/api/pages/${uuid}/unpublish?locale=${encodeURIComponent(locale)}`, { method: "POST" });
  assertOk(response);
  return readJson<PageDocument>(response);
};

export const listVersions = async (uuid: string): Promise<PageVersionSummary[]> => {
  const response = await fetch(`/api/pages/${uuid}/versions`, { method: "GET" });
  assertOk(response);
  const payload = await readJson<{ items: PageVersionSummary[] }>(response);
  return payload.items;
};

export const patchFolder = async (uuid: string, folderId: string | null): Promise<void> => {
  const response = await fetch(`/api/pages/${uuid}/folder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId }),
  });
  assertOk(response);
};

export const getFolders = async (): Promise<PagesWorkspaceFolders> => {
  const response = await fetch("/api/pages/folders", { method: "GET" });
  assertOk(response);
  return readJson<PagesWorkspaceFolders>(response);
};
