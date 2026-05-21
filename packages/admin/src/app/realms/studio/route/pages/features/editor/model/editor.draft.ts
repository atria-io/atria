import * as store from "./editor.store.js";
import * as routing from "./editor.routing.js";
import * as session from "./editor.session.js";
import * as repository from "./editor.repository.js";

type PageStatus = "draft" | "published" | "archived";
type EditorField = "title" | "slug" | "content";

const newId = (): string => {
  return crypto.randomUUID();
};

const normSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\//g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 200);

const isSlugValid = (value: string): boolean =>
  value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const titleToSlug = (value: string): string =>
  normSlug(value).replace(/^-+|-+$/g, "");

const upsertDraft = (
  uuid: string,
  title: string,
  slug: string,
  content: string,
  status: PageStatus,
): void => {
  const state = store.getEditorState();
  const existing = state.drafts.find((item) => item.uuid === uuid);

  if (existing) {
    store.setEditorState({
      drafts: state.drafts.map((item) =>
        item.uuid === uuid
          ? {
            ...item,
            title,
            slug,
            content,
            status,
          }
          : item
      ),
    });
    return;
  }

  store.setEditorState({
    drafts: [
      {
        uuid,
        title,
        slug,
        content,
        status,
      },
      ...state.drafts,
    ],
  });
};

const getDraftStatus = (uuid: string): PageStatus =>
  store.getEditorState().drafts.find((item) => item.uuid === uuid)?.status ?? "draft";

const setChanged = (previousValue: string, nextValue: string): void => {
  const previous = store.getEditorState();
  if (previous.creating && previousValue !== nextValue) {
    store.setEditorState({ hasEditorChanges: true });
  }
};

const resetEditorFields = (): void => {
  store.setEditorState({ title: "", slug: "", content: "" });
};

export const loadDrafts = async (): Promise<void> => {
  const items = await repository.fetchPages();
  items.forEach((item) => session.addPersistedId(item.uuid));
  store.setEditorState({ drafts: items });
};

export const loadDraftById = async (uuid: string): Promise<boolean> => {
  const state = store.getEditorState();
  const existing = state.drafts.find((item) => item.uuid === uuid);

  if (existing) {
    if (state.currentUuid === uuid) {
      store.setEditorState({ title: existing.title, slug: existing.slug, content: existing.content });
    }

    return true;
  }

  const payload = await repository.fetchPage(uuid);
  if (!payload) {
    return false;
  }

  session.addPersistedId(payload.id);
  upsertDraft(
    payload.id,
    payload.title,
    payload.slug,
    payload.content,
    payload.status,
  );
  if (store.getEditorState().currentUuid === payload.id) {
    store.setEditorState({ title: payload.title, slug: payload.slug, content: payload.content });
  }

  return true;
};

const hasRealInput = (title: string, slug: string, content: string): boolean =>
  title.trim() !== "" || slug.trim() !== "" || content.trim() !== "";

const updateField = (field: EditorField, value: string): void => {
  const previousValue = store.getEditorState()[field];
  store.setEditorState({ [field]: value });
  setChanged(previousValue, value);
  ensureDraftFromInput();
  persistDraft();
};

const ensureDraftFromInput = (): void => {
  const state = store.getEditorState();
  if (!state.creating || state.currentUuid) {
    return;
  }

  if (!hasRealInput(state.title, state.slug, state.content)) {
    return;
  }

  const uuid = newId();
  session.resetSlugTouched();
  store.setEditorState({ currentUuid: uuid });
  upsertDraft(
    uuid,
    state.title,
    state.slug,
    state.content,
    "draft",
  );

  if (routing.parseCurrentPagesRoute().mode === "create") {
    routing.openDraftRoute(uuid);
  }
};

export const persistDraft = (status?: PageStatus): void => {
  const state = store.getEditorState();
  if (!state.currentUuid) {
    return;
  }

  const uuid = state.currentUuid;
  const title = state.title.trim();
  const slug = state.slug.trim();
  const content = state.content;
  const nextStatus = status ?? getDraftStatus(uuid);

  if (!isSlugValid(slug)) {
    return;
  }

  upsertDraft(
    uuid,
    state.title,
    state.slug,
    state.content,
    nextStatus,
  );

  if (!session.hasPersistedId(uuid)) {
    if (session.isCreateInFlight()) {
      return;
    }

    session.startCreateInFlight();
    void repository.createPage(uuid, title, slug, content)
      .then((payload) => {
        if (!payload) {
          return;
        }

        session.addPersistedId(payload.id);
        upsertDraft(
          payload.id,
          payload.title,
          payload.slug,
          payload.content,
          payload.status,
        );
        store.setEditorState({ currentUuid: payload.id });

        const latest = store.getEditorState();
        if (latest.currentUuid !== payload.id) {
          return;
        }

        void repository.updatePage(
          payload.id,
          latest.title.trim(),
          latest.slug.trim(),
          latest.content,
          getDraftStatus(payload.id)
        ).then((updatedPayload) => {
          if (!updatedPayload) {
            return;
          }

          upsertDraft(
            updatedPayload.id,
            updatedPayload.title,
            updatedPayload.slug,
            updatedPayload.content,
            updatedPayload.status,
          );
        });
      })
      .finally(() => {
        session.finishCreateInFlight();
      });

    return;
  }

  void repository.updatePage(uuid, title, slug, content, nextStatus).then((payload) => {
    if (!payload) {
      return;
    }

    session.addPersistedId(payload.id);
    upsertDraft(
      payload.id,
      payload.title,
      payload.slug,
      payload.content,
      payload.status,
    );
  });
};

export const setTitle = (title: string): void => {
  updateField("title", title);
};

const setSlugInternal = (slug: string, manual: boolean): void => {
  const normalized = normSlug(slug);
  if (manual) {
    session.markSlugTouched();
  }
  updateField("slug", normalized);
};

export const setSlug = (slug: string): void => {
  setSlugInternal(slug, true);
};

export const setContent = (content: string): void => {
  updateField("content", content);
};

export const applyPendingSlugFromTitle = (): void => {
  const state = store.getEditorState();
  if (!state.creating || session.getSlugTouched()) {
    return;
  }

  const normalized = titleToSlug(state.title);
  if (!isSlugValid(normalized)) {
    return;
  }

  setSlugInternal(normalized, false);
};

export const deletePageById = async (uuid: string): Promise<boolean> => {
  const deleted = await repository.removePage(uuid);
  if (!deleted) {
    return false;
  }

  const state = store.getEditorState();
  const wasCurrent = state.currentUuid === uuid;
  const nextDrafts = state.drafts.filter((item) => item.uuid !== uuid);

  session.removePersistedId(uuid);

  store.setEditorState({
    drafts: nextDrafts,
    isResolving: false,
    currentUuid: wasCurrent ? null : state.currentUuid,
    hasEditorChanges: wasCurrent ? false : state.hasEditorChanges,
    title: wasCurrent ? "" : state.title,
    slug: wasCurrent ? "" : state.slug,
    content: wasCurrent ? "" : state.content,
  });

  if (wasCurrent) {
    routing.openPagesRootRoute();
  }

  return true;
};

export const beginCreateMode = (): void => {
  session.resetSlugTouched();
  store.setEditorState({
    isResolving: false,
    hasEditorChanges: false,
    currentUuid: null,
  });
  resetEditorFields();
};
