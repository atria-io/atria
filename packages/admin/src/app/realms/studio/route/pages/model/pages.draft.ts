import * as store from "./pages.store.js";
import * as routing from "./pages.routing.js";
import * as session from "./pages.session.js";
import * as repository from "./pages.repository.js";

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
  const state = store.getState();
  const existing = state.drafts.find((item) => item.uuid === uuid);

  if (existing) {
    store.setState({
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

  store.setState({
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
  store.getState().drafts.find((item) => item.uuid === uuid)?.status ?? "draft";

const setChanged = (previousValue: string, nextValue: string): void => {
  const previous = store.getState();
  if (previous.creating && previousValue !== nextValue) {
    store.setState({ hasEditorChanges: true });
  }
};

const resetEditorFields = (): void => {
  store.setState({ title: "", slug: "", content: "" });
};

export const load = async (): Promise<void> => {
  const items = await repository.list();
  items.forEach((item) => session.addId(item.uuid));
  store.setState({ drafts: items });
};

export const loadById = async (uuid: string): Promise<boolean> => {
  const state = store.getState();
  const existing = state.drafts.find((item) => item.uuid === uuid);

  if (existing) {
    if (state.currentUuid === uuid) {
      store.setState({ title: existing.title, slug: existing.slug, content: existing.content });
    }

    return true;
  }

  const payload = await repository.get(uuid);
  if (!payload) {
    return false;
  }

  session.addId(payload.id);
  upsertDraft(
    payload.id,
    payload.title,
    payload.slug,
    payload.content,
    payload.status,
  );
  if (store.getState().currentUuid === payload.id) {
    store.setState({ title: payload.title, slug: payload.slug, content: payload.content });
  }

  return true;
};

const hasRealInput = (title: string, slug: string, content: string): boolean =>
  title.trim() !== "" || slug.trim() !== "" || content.trim() !== "";

const updateField = (field: EditorField, value: string): void => {
  const previousValue = store.getState()[field];
  store.setState({ [field]: value });
  setChanged(previousValue, value);
  ensureDraftFromInput();
  persist();
};

const ensureDraftFromInput = (): void => {
  const state = store.getState();
  if (!state.creating || state.currentUuid) {
    return;
  }

  if (!hasRealInput(state.title, state.slug, state.content)) {
    return;
  }

  const uuid = newId();
  session.resetSlug();
  store.setState({ currentUuid: uuid });
  upsertDraft(
    uuid,
    state.title,
    state.slug,
    state.content,
    "draft",
  );

  if (routing.parseRoute().mode === "create") {
    routing.openDraft(uuid);
  }
};

export const persist = (status?: PageStatus): void => {
  const state = store.getState();
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

  if (!session.hasId(uuid)) {
    if (session.isCreating()) {
      return;
    }

    session.startCreating();
    void repository.create(uuid, title, slug, content)
      .then((payload) => {
        if (!payload) {
          return;
        }

        session.addId(payload.id);
        upsertDraft(
          payload.id,
          payload.title,
          payload.slug,
          payload.content,
          payload.status,
        );
        store.setState({ currentUuid: payload.id });

        const latest = store.getState();
        if (latest.currentUuid !== payload.id) {
          return;
        }

        void repository.update(
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
        session.finishCreating();
      });

    return;
  }

  void repository.update(uuid, title, slug, content, nextStatus).then((payload) => {
    if (!payload) {
      return;
    }

    session.addId(payload.id);
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
    session.touchSlug();
  }
  updateField("slug", normalized);
};

export const setSlug = (slug: string): void => {
  setSlugInternal(slug, true);
};

export const setContent = (content: string): void => {
  updateField("content", content);
};

export const applySlugFromTitle = (): void => {
  const state = store.getState();
  if (!state.creating || session.isSlugTouched() || state.slug.trim() !== "") {
    return;
  }

  const normalized = titleToSlug(state.title);
  if (!isSlugValid(normalized)) {
    return;
  }

  setSlugInternal(normalized, false);
};

export const deleteById = async (uuid: string): Promise<boolean> => {
  const deleted = await repository.remove(uuid);
  if (!deleted) {
    return false;
  }

  const state = store.getState();
  const wasCurrent = state.currentUuid === uuid;
  const nextDrafts = state.drafts.filter((item) => item.uuid !== uuid);

  session.removeId(uuid);

  store.setState({
    drafts: nextDrafts,
    currentUuid: wasCurrent ? null : state.currentUuid,
    hasEditorChanges: wasCurrent ? false : state.hasEditorChanges,
    title: wasCurrent ? "" : state.title,
    slug: wasCurrent ? "" : state.slug,
    content: wasCurrent ? "" : state.content,
  });

  if (wasCurrent) {
    routing.openRoot();
  }

  return true;
};

export const startCreate = (): void => {
  session.resetSlug();
  store.setState({
    hasEditorChanges: false,
    currentUuid: null,
  });
  resetEditorFields();
};

export const setStatusById = async (
  uuid: string,
  status: PageStatus,
): Promise<boolean> => {
  const current = store.getState().drafts.find((item) => item.uuid === uuid);
  if (!current) {
    return false;
  }

  const payload = await repository.update(
    uuid,
    current.title.trim(),
    current.slug.trim(),
    current.content,
    status,
  );
  if (!payload) {
    return false;
  }

  session.addId(payload.id);
  upsertDraft(
    payload.id,
    payload.title,
    payload.slug,
    payload.content,
    payload.status,
  );

  if (status === "archived" && store.getState().currentUuid === uuid) {
    store.setState({
      creating: false,
      hasEditorChanges: false,
      currentUuid: null,
      title: "",
      slug: "",
      content: "",
    });
    routing.openRoot();
  }

  return true;
};
