import { parsePagesRoute, resolveDocumentPath } from "../../../../services/state/pagesState.js";
import * as pagesApi from "../http/pagesApi.js";
import { getEditorState, setEditorState } from "../state/store.js";
import type { CatalogItem, PageApiPayload } from "../state/types.js";

let isBootstrapped = false;
let createInFlight = false;

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
  status: "draft",
});

const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 200);

const isManualSlug = (title: string, slug: string): boolean =>
  slug !== slugify(title);

const upsertDraftItem = (uuid: string, title: string, slug: string): void => {
  const state = getEditorState();
  const existing = state.drafts.find((item) => item.uuid === uuid);

  if (existing) {
    setEditorState({
      drafts: state.drafts.map((item) => (item.uuid === uuid ? { ...item, title, slug } : item)),
    });
    return;
  }

  setEditorState({
    drafts: [{ uuid, title, slug, status: "draft" }, ...state.drafts],
  });
};

const openDraftRoute = (uuid: string): void => {
  window.history.pushState({}, "", resolveDocumentPath(uuid));
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const loadDrafts = async (): Promise<void> => {
  const items = await pagesApi.listPages();
  setEditorState({ drafts: items.map(toCatalogItem) });
};

const loadDraftById = async (uuid: string): Promise<void> => {
  const state = getEditorState();
  const existing = state.drafts.find((item) => item.uuid === uuid);
  if (existing) {
    if (state.currentUuid === uuid) {
      setEditorState({ title: existing.title });
    }
    return;
  }

  const payload = await pagesApi.getPage(uuid);
  if (!payload) {
    return;
  }

  upsertDraftItem(payload.id, payload.title, payload.slug);
  if (getEditorState().currentUuid === payload.id) {
    setEditorState({
      title: payload.title,
      slug: payload.slug,
      slugTouched: isManualSlug(payload.title, payload.slug),
    });
  }
};

export const syncEditorFromRoute = (creating: boolean): void => {
  if (!isBootstrapped) {
    isBootstrapped = true;
    void loadDrafts();
  }

  const state = getEditorState();
  const route = parsePagesRoute(window.location.pathname);
  const routeUuid = route.mode === "document" ? route.uuid : null;
  const routeDraft = routeUuid ? state.drafts.find((item) => item.uuid === routeUuid) : null;

  setEditorState({
    creating,
    currentUuid: routeUuid,
    title: routeDraft ? routeDraft.title : route.mode === "create" ? state.title : "",
    slug: routeDraft ? routeDraft.slug : route.mode === "create" ? state.slug : "",
    slugTouched: routeDraft ? isManualSlug(routeDraft.title, routeDraft.slug) : state.slugTouched,
  });

  if (routeUuid && !routeDraft) {
    void loadDraftById(routeUuid);
  }
};

export const setTitle = (title: string): void => {
  const state = getEditorState();
  const trimmed = title.trim();
  const nextSlug = state.slugTouched ? state.slug : slugify(trimmed);

  if (state.creating && !state.currentUuid && trimmed !== "") {
    if (createInFlight) {
      setEditorState({ title, slug: nextSlug });
      return;
    }

    const uuid = createUuid();
    createInFlight = true;
    setEditorState({ currentUuid: uuid, title, slug: nextSlug });
    upsertDraftItem(uuid, title, nextSlug || "untitled-page");
    openDraftRoute(uuid);

    void pagesApi.createPage(uuid, trimmed, nextSlug || "untitled-page").then((payload) => {
      if (!payload) {
        return;
      }

      upsertDraftItem(payload.id, payload.title, payload.slug);
      setEditorState({
        slug: payload.slug,
        slugTouched: isManualSlug(payload.title, payload.slug),
      });
    }).finally(() => {
      createInFlight = false;
    });
    return;
  }

  if (state.currentUuid) {
    const currentUuid = state.currentUuid;
    setEditorState({ title, slug: nextSlug });
    upsertDraftItem(currentUuid, title, nextSlug === "" ? "untitled-page" : nextSlug);

    void pagesApi.updatePageTitle(
      currentUuid,
      trimmed === "" ? "Untitled page" : trimmed,
      (nextSlug === "" ? "untitled-page" : nextSlug)
    ).then((payload) => {
      if (!payload) {
        return;
      }

      upsertDraftItem(payload.id, payload.title, payload.slug);
      setEditorState({
        slug: payload.slug,
        slugTouched: isManualSlug(payload.title, payload.slug),
      });
    });
    return;
  }

  setEditorState({ title, slug: nextSlug });
};

export const setSlug = (slug: string): void => {
  const state = getEditorState();
  const normalized = slugify(slug);
  setEditorState({ slug: normalized, slugTouched: true });

  if (!state.currentUuid) {
    return;
  }

  void pagesApi.updatePageTitle(
    state.currentUuid,
    state.title.trim() === "" ? "Untitled page" : state.title,
    normalized === "" ? "untitled-page" : normalized
  ).then((payload) => {
    if (!payload) {
      return;
    }

    upsertDraftItem(payload.id, payload.title, payload.slug);
    setEditorState({
      slug: payload.slug,
      slugTouched: isManualSlug(payload.title, payload.slug),
    });
  });
};

export const beginCreateMode = (): void => {
  setEditorState({
    currentUuid: null,
    title: "",
    slug: "",
    slugTouched: false,
  });
};
