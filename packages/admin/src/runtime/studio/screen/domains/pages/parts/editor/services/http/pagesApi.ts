import type { PageApiPayload } from "../state/types.js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

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

export const createPage = async (id: string, title: string, slug: string): Promise<PageApiPayload | null> => {
  const response = await fetch("/api/pages", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ id, title, slug }),
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
  status: "draft" | "published" | "archived"
): Promise<PageApiPayload | null> => {
  const response = await fetch(`/api/pages/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ title, slug, status }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PageApiPayload;
};
