import * as store from "./pages.store.js";
import * as routing from "./pages.routing.js";
import * as session from "./pages.session.js";
import * as repository from "./pages.repository.js";
import * as sync from "./pages.sync.js";
import * as history from "./pages.history.js";
import * as archive from "./pages.archive.js";
import type { PageApiPayload } from "./pages.types.js";

type PageStatus = "draft" | "published" | "archived";
type EditorField = "title" | "slug" | "content";

const newId = (): string => {
  return crypto.randomUUID();
};

const normalizeSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\//g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 200);

const isValidSlug = (value: string): boolean =>
  value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const slugFromTitle = (value: string): string =>
  normalizeSlug(value).replace(/^-+|-+$/g, "");

const upsertItem = (
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

const getItemStatus = (uuid: string): PageStatus =>
  store.getState().drafts.find((item) => item.uuid === uuid)?.status ?? "draft";

const upsertPayload = (payload: PageApiPayload, status: PageStatus): void => {
  session.addId(payload.id);
  upsertItem(
    payload.id,
    payload.title,
    payload.slug,
    payload.content,
    status,
  );
};

const setCurrentFromExisting = (status: PageStatus, title: string, slug: string, content: string): void => {
  store.setState({
    editorMode: false,
    versionId: null,
    canonicalStatus: status,
    title,
    slug,
    content,
  });
};

const setEditorClearedState = (creating: boolean): void => {
  store.setState({
    creating,
    editorMode: false,
    versionId: null,
    canonicalStatus: null,
    hasEditorChanges: false,
    currentUuid: null,
    title: "",
    slug: "",
    content: "",
  });
};

const hasChanges = (): boolean => {
  const state = store.getState();

  if (!state.creating) {
    return false;
  }

  if (!state.currentUuid) {
    return hasInput(state.title, state.slug, state.content);
  }

  const currentDraft = state.drafts.find((item) => item.uuid === state.currentUuid);
  if (!currentDraft) {
    return hasInput(state.title, state.slug, state.content);
  }

  const stateEntries = state as unknown as Record<string, unknown>;

  for (const [key, prevValue] of Object.entries(currentDraft)) {
    if (key === "uuid" || key === "status") {
      continue;
    }

    const nextValue = stateEntries[key];
    if (typeof prevValue === "string" && typeof nextValue === "string") {
      if (nextValue.trim() !== prevValue.trim()) {
        return true;
      }
      continue;
    }

    if (nextValue !== prevValue) {
      return true;
    }
  }

  return false;
};

const getVersionFromUrl = (): { versionId?: string; actionId?: string } => {
  if (typeof window === "undefined") {
    return {};
  }
  const parts = window.location.pathname.split(":");
  const fromPath = parts.length >= 3 ? parts[2] : "";
  const fromAction = parts.length >= 4 ? parts[3] : "";
  const versionValue = fromPath || new URLSearchParams(window.location.search).get("v") || "";
  const versionId = /^[a-z0-9]{7}$/i.test(versionValue) ? versionValue : undefined;
  const actionId =
    fromAction.startsWith("optimistic")
      ? undefined
      : /^[a-z0-9.]+$/i.test(fromAction)
        ? fromAction
        : undefined;
  if (!versionId) {
    return {};
  }
  return { versionId, actionId };
};

const syncVersionInUrl = (
  uuid: string,
  versionId: string | null,
  keepAction: boolean = true,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const prefix = `/pages:${uuid}`;
  if (!window.location.pathname.startsWith(prefix)) {
    return;
  }

  const suffix = window.location.pathname.slice(prefix.length);
  const versionToken = suffix.startsWith(":") ? suffix.slice(1).split(":")[0] ?? "" : "";
  const actionToken = suffix.startsWith(":") ? suffix.slice(1).split(":")[1] ?? "" : "";
  const actionSuffix =
    keepAction
    && actionToken !== ""
    && !actionToken.startsWith("optimistic")
      ? `:${actionToken}`
      : "";
  const nextPath = versionId
    ? `${prefix}:${versionId}${versionToken === versionId ? actionSuffix : ""}`
    : suffix.startsWith(":")
      ? prefix
      : window.location.pathname;

  if (nextPath === window.location.pathname) {
    return;
  }

  window.history.replaceState({}, "", `${nextPath}${window.location.search}`);
};

export const load = async (): Promise<void> => {
  const items = await repository.list();
  items.forEach((item) => session.addId(item.uuid));
  store.setState({ drafts: items });
};

export const loadById = async (uuid: string): Promise<boolean> => {
  const state = store.getState();
  const existing = state.drafts.find((item) => item.uuid === uuid);
  const requested = getVersionFromUrl();
  if (existing && !session.hasId(uuid)) {
    if (state.currentUuid === uuid) {
      setCurrentFromExisting(existing.status, existing.title, existing.slug, existing.content);
    }
    return true;
  }

  const isCanonicalRoute = !requested.versionId && !requested.actionId;
  let payload = isCanonicalRoute
    ? await repository.get(uuid, undefined, undefined, "editor")
    : await repository.get(uuid, requested.versionId, requested.actionId, "editor");

  if (!payload && requested.actionId) {
    return Boolean(existing);
  }
  if (!payload && requested.versionId) {
    payload = await repository.get(uuid, requested.versionId, undefined, "editor");
  }
  if (!payload && !isCanonicalRoute) {
    return Boolean(existing);
  }
  if (!payload) {
    if (existing && state.currentUuid === uuid) {
      setCurrentFromExisting(existing.status, existing.title, existing.slug, existing.content);
    }
    return Boolean(existing);
  }

  const itemStatus = payload.editorMode === true
    ? "draft"
    : payload.canonicalStatus ?? payload.status;
  upsertPayload(payload, itemStatus);
  if (store.getState().currentUuid === payload.id) {
    store.setState({
      editorMode: payload.editorMode === true,
      versionId: payload.versionId ?? null,
      canonicalStatus: payload.canonicalStatus ?? payload.status,
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
    });
    syncVersionInUrl(payload.id, payload.versionId ?? null);
  }

  return true;
};

const hasInput = (title: string, slug: string, content: string): boolean =>
  title.trim() !== "" || slug.trim() !== "" || content.trim() !== "";

const resolveSlugForCreate = (title: string, slug: string): string => {
  const normalized = normalizeSlug(slug).trim();
  if (normalized !== "") {
    return normalized;
  }

  return slugFromTitle(title);
};

const setSavedVersion = (
  uuid: string,
  payload: PageApiPayload | null,
): void => {
  if (!payload) {
    return;
  }

  const state = store.getState();
  const itemStatus = payload.status;
  upsertPayload(payload, itemStatus);

  if (store.getState().currentUuid !== uuid) {
    return;
  }

  const nextState = store.getState();
  const nextVersionId = payload.versionId ?? state.versionId;
  store.setState({
    title: payload.title,
    slug: payload.slug,
    content: payload.content,
    editorMode: nextState.editorMode,
    versionId: nextVersionId ?? null,
  });
  syncVersionInUrl(payload.id, nextVersionId ?? null);
};

const updateField = (field: EditorField, value: string): void => {
  store.setState({ [field]: value });
  ensureDraft();
  store.setState({ hasEditorChanges: hasChanges() });
};

const persistWorkingVersion = (): void => {
  const state = store.getState();
  if (!state.currentUuid || !session.hasId(state.currentUuid)) {
    return;
  }

  if (!hasChanges()) {
    return;
  }

  const uuid = state.currentUuid;

  const slug = state.slug.trim();
  if (!isValidSlug(slug)) {
    return;
  }

  const itemStatus = getItemStatus(uuid);
  const currentVersions = state.historyByPage[uuid]?.versions ?? [];
  const currentVersion = state.versionId
    ? currentVersions.find((version) => version.versionId === state.versionId)
    : null;
  const latestDraftVersion = currentVersions.find((version) =>
    version.versionId !== "pending" && !version.live
  );
  const hasPublishedHistory = Boolean(
    currentVersion?.actions.some((action) => action.type === "document:published"),
  );
  const isEditingHistoricalVersion = Boolean(currentVersion && !currentVersion.live);
  const isEditingLiveVersion = Boolean(currentVersion?.live);
  const isPublishedDocument = state.canonicalStatus === "published";
  const targetVersionId = isPublishedDocument && isEditingHistoricalVersion && hasPublishedHistory
    ? null
    : isPublishedDocument && isEditingLiveVersion
      ? latestDraftVersion?.versionId ?? null
      : state.versionId;

  const hasUrlAction = typeof window !== "undefined"
    && window.location.pathname.startsWith(`/pages:${uuid}:`)
    && window.location.pathname.split(":").length >= 4;
  if (hasUrlAction) {
    syncVersionInUrl(uuid, targetVersionId ?? state.versionId ?? null, false);
  }

  const optimisticType = targetVersionId ? "version:updated" : "version:created";
  const optimisticVersionId = targetVersionId ?? "pending";
  history.addOptimisticAction(uuid, optimisticVersionId, optimisticType);
  if (targetVersionId && targetVersionId !== state.versionId) {
    store.setState({
      versionId: targetVersionId,
      editorMode: true,
    });
    syncVersionInUrl(uuid, targetVersionId, false);
  }

  void sync.saveVersion(
    uuid,
    state.title.trim(),
    slug,
    state.content,
    itemStatus,
    targetVersionId,
  ).then((payload) => {
    setSavedVersion(uuid, payload);
  });
};

const ensureDraft = (): void => {
  const state = store.getState();
  if (!state.creating || state.currentUuid) {
    return;
  }

  if (!hasInput(state.title, state.slug, state.content)) {
    return;
  }

  const uuid = newId();
  session.resetSlug();
  store.setState({ currentUuid: uuid });
  upsertItem(
    uuid,
    state.title,
    state.slug,
    state.content,
    "draft",
  );

  if (routing.parseRoute().mode === "create") {
    routing.openDraft(uuid);
  }

  persistFirstDraft(uuid);
};

const persistFirstDraft = (uuid: string): void => {
  if (session.hasId(uuid) || session.isCreating()) {
    return;
  }

  const state = store.getState();
  const title = state.title.trim();
  const slug = resolveSlugForCreate(state.title, state.slug);
  const content = state.content;

  if (!isValidSlug(slug)) {
    return;
  }

  session.startCreating();
  void sync.create(uuid, title, slug, content)
    .then((payload) => {
      if (!payload) {
        return;
      }

      session.addId(payload.id);
      upsertItem(
        payload.id,
        payload.title,
        payload.slug,
        payload.content,
        payload.status,
      );
      if (store.getState().currentUuid === uuid) {
        store.setState({
          currentUuid: payload.id,
          canonicalStatus: payload.status,
        });
      }

      const latest = store.getState();
      if (latest.currentUuid !== payload.id) {
        return;
      }

      if (!isValidSlug(latest.slug.trim())) {
        return;
      }

      void sync.saveVersion(
        payload.id,
        latest.title.trim(),
        latest.slug.trim(),
        latest.content,
        "draft",
        null,
      ).then((versionPayload) => {
        setSavedVersion(payload.id, versionPayload);
      });
    })
    .finally(() => {
      session.finishCreating();
    });
};

export const persist = (status?: PageStatus): void => {
  const state = store.getState();
  if (!state.currentUuid) {
    return;
  }

  const uuid = state.currentUuid;
  const activeVersionId = state.versionId;
  const title = state.title.trim();
  const slug = state.slug.trim();
  const content = state.content;
  const nextStatus = status ?? getItemStatus(uuid);

  if (!isValidSlug(slug)) {
    return;
  }

  upsertItem(
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
    void sync.create(uuid, title, resolveSlugForCreate(state.title, state.slug), content)
      .then((payload) => {
        if (!payload) {
          return;
        }

        upsertPayload(payload, payload.status);
        store.setState({ currentUuid: payload.id });

        const latest = store.getState();
        if (latest.currentUuid !== payload.id) {
          return;
        }

        void sync.update(
          payload.id,
          latest.title.trim(),
          latest.slug.trim(),
          latest.content,
          getItemStatus(payload.id),
          latest.versionId,
        ).then((updatedPayload) => {
          if (!updatedPayload) {
            return;
          }

          upsertPayload(updatedPayload, updatedPayload.status);
          if (store.getState().currentUuid === updatedPayload.id) {
            store.setState({
              hasEditorChanges: hasChanges(),
              canonicalStatus: updatedPayload.status,
              editorMode: false,
              versionId: latest.versionId ?? null,
            });
            syncVersionInUrl(
              updatedPayload.id,
              latest.versionId ?? null,
              updatedPayload.status !== "published",
            );
          }
        });
      })
      .finally(() => {
        session.finishCreating();
      });

    return;
  }

  void sync.update(
    uuid,
    title,
    slug,
    content,
    nextStatus,
    state.versionId,
  ).then((payload) => {
    if (!payload) {
      return;
    }

    upsertPayload(payload, payload.status);
    if (store.getState().currentUuid === payload.id) {
      store.setState({
        hasEditorChanges: hasChanges(),
        canonicalStatus: payload.status,
        editorMode: false,
        versionId: activeVersionId ?? null,
      });
      syncVersionInUrl(
        payload.id,
        activeVersionId ?? null,
        payload.status !== "published",
      );
      if (payload.status !== "archived") {
        archive.setArchived(false);
      }
    }
  });
};

export const setTitle = (title: string): void => {
  updateField("title", title);
};

export const commitTitleBlurOnCreate = (title: string): void => {
  const state = store.getState();
  const nextSlug = state.slug.trim() === "" ? slugFromTitle(title) : state.slug;

  if (!isValidSlug(nextSlug)) {
    return;
  }

  store.setState({ title, slug: nextSlug });
  ensureDraft();
  store.setState({ hasEditorChanges: hasChanges() });
  persistWorkingVersion();
};

const setSlugInternal = (slug: string, manual: boolean): void => {
  const normalized = normalizeSlug(slug);
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

export const commitEditorChanges = (): void => {
  persistWorkingVersion();
};

export const applySlugFromTitle = (title?: string): void => {
  const state = store.getState();
  if (state.slug.trim() !== "") {
    return;
  }

  const normalized = slugFromTitle(title ?? state.title);
  if (!isValidSlug(normalized)) {
    return;
  }

  setSlugInternal(normalized, false);
};

export const deleteById = async (uuid: string): Promise<boolean> => {
  const state = store.getState();
  const wasCurrent = state.currentUuid === uuid;
  const nextDrafts = state.drafts.filter((item) => item.uuid !== uuid);
  const nextState = {
    drafts: nextDrafts,
    editorMode: wasCurrent ? false : state.editorMode,
    versionId: wasCurrent ? null : state.versionId,
    canonicalStatus: wasCurrent ? null : state.canonicalStatus,
    currentUuid: wasCurrent ? null : state.currentUuid,
    hasEditorChanges: wasCurrent ? false : state.hasEditorChanges,
    title: wasCurrent ? "" : state.title,
    slug: wasCurrent ? "" : state.slug,
    content: wasCurrent ? "" : state.content,
  };

  if (!session.hasId(uuid)) {
    store.setState(nextState);

    if (wasCurrent) {
      routing.openRoot();
    }

    return true;
  }

  const deleted = await sync.remove(uuid);
  if (!deleted) {
    return false;
  }

  session.removeId(uuid);

  store.setState(nextState);

  if (wasCurrent) {
    routing.openRoot();
  }

  return true;
};

export const startCreate = (): void => {
  session.resetSlug();
  setEditorClearedState(true);
};

export const setStatusById = async (
  uuid: string,
  status: PageStatus,
): Promise<boolean> => {
  const current = store.getState().drafts.find((item) => item.uuid === uuid);
  if (!current) {
    return false;
  }

  const payload = await sync.update(
    uuid,
    current.title.trim(),
    current.slug.trim(),
    current.content,
    status,
    undefined,
  );
  if (!payload) {
    return false;
  }

  if (payload.versionId) {
    history.addOptimisticAction(uuid, payload.versionId, `document:${status === "published" ? "published" : status === "archived" ? "archived" : "unpublished"}`);
  }

  upsertPayload(payload, payload.status);

  if (status === "archived" && store.getState().currentUuid === uuid) {
    setEditorClearedState(false);
    routing.openRoot();
  }
  if (status !== "archived") {
    archive.setArchived(false);
  }

  return true;
};
