import type { PageApiPayload } from "../../../model/pages.types.js";

const path = (
  id?: string,
  versionId?: string | null,
  actionId?: string | null,
  mode?: "editor",
): string => {
  if (!id) {
    return "/api/pages";
  }

  if (versionId) {
    return mode === "editor"
      ? actionId
        ? `/api/pages:${id}:editor:${versionId}:${actionId}`
        : `/api/pages:${id}:editor:${versionId}`
      : `/api/pages:${id}:${versionId}`;
  }

  return mode === "editor" ? `/api/pages:${id}:editor` : `/api/pages:${id}`;
};

const json = async <T>(url: string, init: RequestInit): Promise<T | null> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T;
};

export const listPages = async (): Promise<Array<PageApiPayload>> => {
  const payload = await json<{ items?: Array<PageApiPayload> }>(
    path(),
    { method: "GET" },
  );
  if (!payload) {
    return [];
  }

  return Array.isArray(payload.items) ? payload.items : [];
};

export const getPage = (
  id: string,
  versionId?: string,
  actionId?: string,
  mode?: "editor",
): Promise<PageApiPayload | null> => {
  return json<PageApiPayload>(path(id, versionId, actionId, mode), { method: "GET" });
};

export const createPage = async (
  id: string,
  title: string,
  slug: string,
  content: string,
): Promise<PageApiPayload | null> => {
  return json<PageApiPayload>(path(), {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ id, title, slug, content }),
  });
};

export const updatePage = async (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
  versionId?: string | null,
): Promise<PageApiPayload | null> => {
  return json<PageApiPayload>(path(id, versionId, null), {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title, slug, content, status }),
  });
};

export const savePageVersion = async (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
  versionId?: string | null,
): Promise<PageApiPayload | null> => {
  return json<PageApiPayload>(path(id, versionId, null), {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title, slug, content, status, operation: "version" }),
  });
};

export const deletePage = async (id: string): Promise<boolean> => {
  const response = await fetch(path(id), { method: "DELETE" });
  return response.status === 204;
};
