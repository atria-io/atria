import type { PageApiPayload } from "../../../model/pages.types.js";

export const listPages = async (): Promise<Array<PageApiPayload>> => {
  const response = await fetch("/api/pages", { method: "GET" });
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { items?: Array<PageApiPayload> };
  return Array.isArray(payload.items) ? payload.items : [];
};

export const getPage = async (id: string): Promise<PageApiPayload | null> => {
  const response = await fetch(`/api/pages/${id}`, { method: "GET" });
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PageApiPayload;
};

export const createPage = async (
  id: string,
  title: string,
  slug: string,
  content: string,
): Promise<PageApiPayload | null> => {
  const response = await fetch("/api/pages", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ id, title, slug, content }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PageApiPayload;
};

export const updatePage = async (
  id: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived",
): Promise<PageApiPayload | null> => {
  const response = await fetch(`/api/pages/${id}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title, slug, content, status }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PageApiPayload;
};

export const deletePage = async (id: string): Promise<boolean> => {
  const response = await fetch(`/api/pages/${id}`, { method: "DELETE" });
  return response.status === 204;
};
