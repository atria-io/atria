import { parsePagesRoute, resolveDocumentPath } from "../../../routes/pages.routes.js";
import * as pagesApi from "../api/editor.api.js";
import { getEditorState, setEditorState } from "./editor.store.js";
import type { CatalogItem, PageApiPayload } from "./editor.types.js";

let isBootstrapped = false;
let createInFlight = false;
let slugTouched = false;
const persistedIds = new Set<string>();

const createUuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const randomHex = (): string => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return [
    `${randomHex()}${randomHex()}`,
    randomHex(),
    `4${randomHex().slice(1)}`,
    `${((8 + Math.floor(Math.random() * 4)).toString(16))}${randomHex().slice(1)}`,
    `${randomHex()}${randomHex()}${randomHex()}`,
  ].join("-");
};

const toCatalogItem = (payload: PageApiPayload): CatalogItem => ({
  uuid: payload.id,
  title: payload.title,
  slug: payload.slug,
  content: payload.content,
  status: payload.status,
});

const normalizeManualSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\//g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 200);

const isValidPersistedSlug = (value: string): boolean =>
  value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const resolveSlugFromTitle = (value: string): string =>
  normalizeManualSlug(value).replace(/^-+|-+$/g, "");

const upsertDraftItem = (
  uuid: string,
  title: string,
  slug: string,
  content: string,
  status: "draft" | "published" | "archived"
): void => {
  const state = getEditorState();
  const existing = state.drafts.find((item) => item.uuid === uuid);

  if (existing) {
    setEditorState({
      drafts: state.drafts.map((item) =>
        item.uuid === uuid ? { ...item, title, slug, content, status } : item
      ),
    });
    return;
  }

  setEditorState({
    drafts: [{ uuid, title, slug, content, status }, ...state.drafts],
  });
};

const openDraftRoute = (uuid: string): void => {
  window.history.pushState({}, "", resolveDocumentPath(uuid));
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const loadDrafts = async (): Promise<void> => {
  const items = await pagesApi.listPages();
  items.forEach((item) => persistedIds.add(item.id));
  setEditorState({ drafts: items.map(toCatalogItem) });
};

const loadDraftById = async (uuid: string): Promise<boolean> => {
  const state = getEditorState();
  const existing = state.drafts.find((item) => item.uuid === uuid);
  if (existing) {
    if (state.currentUuid === uuid) {
      setEditorState({ title: existing.title, slug: existing.slug, content: existing.content });
    }
    return true;
  }

  const payload = await pagesApi.getPage(uuid);
  if (!payload) {
    return false;
  }

  persistedIds.add(payload.id);
  upsertDraftItem(payload.id, payload.title, payload.slug, payload.content, payload.status);
  if (getEditorState().currentUuid === payload.id) {
    setEditorState({
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
    });
  }

  return true;
};

const persistDraft = (status?: "draft" | "published" | "archived"): void => {
  const state = getEditorState();
  if (!state.currentUuid) {
    return;
  }

  const uuid = state.currentUuid;
  const title = state.title.trim();
  const slug = state.slug.trim();
  const content = state.content;
  const nextStatus = status ?? (state.drafts.find((item) => item.uuid === uuid)?.status ?? "draft");

  if (!isValidPersistedSlug(slug)) {
    return;
  }

  upsertDraftItem(uuid, state.title, state.slug, state.content, nextStatus);

  if (!persistedIds.has(uuid)) {
    if (createInFlight) {
      return;
    }

    createInFlight = true;
    void pagesApi.createPage(uuid, title, slug, content).then((payload) => {
      if (!payload) {
        return;
      }

      persistedIds.add(payload.id);
      upsertDraftItem(payload.id, payload.title, payload.slug, payload.content, payload.status);
      setEditorState({ currentUuid: payload.id });

      const latest = getEditorState();
      if (latest.currentUuid !== payload.id) {
        return;
      }

      void pagesApi.updatePage(
        payload.id,
        latest.title.trim(),
        latest.slug.trim(),
        latest.content,
        latest.drafts.find((item) => item.uuid === payload.id)?.status ?? "draft"
      ).then((updatedPayload) => {
        if (!updatedPayload) {
          return;
        }

        upsertDraftItem(
          updatedPayload.id,
          updatedPayload.title,
          updatedPayload.slug,
          updatedPayload.content,
          updatedPayload.status
        );
      });
    }).finally(() => {
      createInFlight = false;
    });
    return;
  }

  void pagesApi.updatePage(uuid, title, slug, content, nextStatus).then((payload) => {
    if (!payload) {
      return;
    }

    persistedIds.add(payload.id);
    upsertDraftItem(payload.id, payload.title, payload.slug, payload.content, payload.status);
  });
};

export const syncEditorFromRoute = (): void => {
  if (!isBootstrapped) {
    isBootstrapped = true;
    void loadDrafts();
  }

  const state = getEditorState();
  const route = parsePagesRoute(window.location.pathname);
  const routeUuid = route.mode === "document" ? route.uuid : null;
  const routeDraft = routeUuid ? state.drafts.find((item) => item.uuid === routeUuid) : null;
  const creating = route.mode === "create" || (route.mode === "document" && routeDraft !== null);

  setEditorState({
    creating,
    currentUuid: route.mode === "create" ? state.currentUuid : routeUuid,
    title: routeDraft ? routeDraft.title : route.mode === "create" ? state.title : "",
    slug: routeDraft ? routeDraft.slug : route.mode === "create" ? state.slug : "",
    content: routeDraft ? routeDraft.content : route.mode === "create" ? state.content : "",
  });

  if (routeUuid && !routeDraft) {
    void loadDraftById(routeUuid).then((found) => {
      if (found) {
        return;
      }

      const latest = getEditorState();
      if (latest.currentUuid !== routeUuid) {
        return;
      }

      setEditorState({
        creating: false,
        currentUuid: null,
        title: "",
        slug: "",
        content: "",
      });
    });
  }
};

export const touchCreateInteraction = (): void => {
  const state = getEditorState();
  if (!state.creating || state.currentUuid) {
    return;
  }

  const uuid = createUuid();
  slugTouched = false;
  setEditorState({ currentUuid: uuid });
  upsertDraftItem(uuid, state.title, state.slug, state.content, "draft");

  if (parsePagesRoute(window.location.pathname).mode === "create") {
    openDraftRoute(uuid);
  }

  persistDraft("draft");
};

export const setTitle = (title: string): void => {
  setEditorState({ title });
  persistDraft();
};

const setSlugInternal = (slug: string, manual: boolean): void => {
  const normalized = normalizeManualSlug(slug);
  if (manual) {
    slugTouched = true;
  }
  setEditorState({ slug: normalized });
  persistDraft();
};

export const setSlug = (slug: string): void => {
  setSlugInternal(slug, true);
};

export const setContent = (content: string): void => {
  setEditorState({ content });
  persistDraft();
};

export const applyPendingSlugFromTitle = (): void => {
  const state = getEditorState();
  if (!state.creating || slugTouched) {
    return;
  }

  const normalized = resolveSlugFromTitle(state.title);
  if (!isValidPersistedSlug(normalized)) {
    return;
  }

  setSlugInternal(normalized, false);
};

export const publishCurrentPage = (): void => {
  persistDraft("published");
};

export const unpublishCurrentPage = (): void => {
  persistDraft("draft");
};

export const archiveCurrentPage = (): void => {
  persistDraft("archived");
};

export const deletePageById = async (uuid: string): Promise<boolean> => {
  const deleted = await pagesApi.deletePage(uuid);
  if (!deleted) {
    return false;
  }

  const state = getEditorState();
  const wasCurrent = state.currentUuid === uuid;
  const nextDrafts = state.drafts.filter((item) => item.uuid !== uuid);

  persistedIds.delete(uuid);

  setEditorState({
    drafts: nextDrafts,
    currentUuid: wasCurrent ? null : state.currentUuid,
    title: wasCurrent ? "" : state.title,
    slug: wasCurrent ? "" : state.slug,
    content: wasCurrent ? "" : state.content,
  });

  if (wasCurrent) {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return true;
};

export const beginCreateMode = (): void => {
  slugTouched = false;
  setEditorState({
    currentUuid: null,
    title: "",
    slug: "",
    content: "",
  });
};
