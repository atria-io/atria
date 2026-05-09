import { useEffect, useSyncExternalStore } from "react";
import { parsePagesRoute, resolveDocumentPath } from "../../../services/state/pagesState.js";

export interface CatalogDraftItem {
  uuid: string;
  title: string;
  status: "draft";
}

interface EditorState {
  creating: boolean;
  title: string;
  currentUuid: string | null;
  drafts: CatalogDraftItem[];
}

let editorState: EditorState = {
  creating: false,
  title: "",
  currentUuid: null,
  drafts: [],
};

const listeners = new Set<() => void>();

const emit = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const setEditorState = (next: Partial<EditorState>): void => {
  editorState = { ...editorState, ...next };
  emit();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): EditorState => editorState;

const createUuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const openDraftRoute = (uuid: string): void => {
  window.history.pushState({}, "", resolveDocumentPath(uuid));
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const upsertDraftItem = (uuid: string, title: string): void => {
  const existing = editorState.drafts.find((item) => item.uuid === uuid);

  if (existing) {
    setEditorState({
      drafts: editorState.drafts.map((item) =>
        item.uuid === uuid
          ? { ...item, title }
          : item
      ),
    });

    return;
  }

  setEditorState({
    drafts: [{ uuid, title, status: "draft" }, ...editorState.drafts],
  });
};

export const useEditorState = (): EditorState =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const useEditorStateSetup = (creating: boolean): void => {
  useEffect(() => {
    const syncFromRoute = (): void => {
      const route = parsePagesRoute(window.location.pathname);
      const routeUuid = route.mode === "document" ? route.uuid : null;
      const routeDraft = routeUuid
        ? editorState.drafts.find((item) => item.uuid === routeUuid)
        : null;

      setEditorState({
        creating,
        currentUuid: routeUuid,
        title: routeDraft ? routeDraft.title : route.mode === "create" ? editorState.title : "",
      });
    };

    syncFromRoute();
    window.addEventListener("popstate", syncFromRoute);
    return () => {
      window.removeEventListener("popstate", syncFromRoute);
    };
  }, [creating]);
};

export const setEditorTitle = (title: string): void => {
  const nextTitle = title;
  const trimmed = nextTitle.trim();

  if (editorState.creating && !editorState.currentUuid && trimmed !== "") {
    const uuid = createUuid();
    setEditorState({
      currentUuid: uuid,
      title: nextTitle,
    });

    upsertDraftItem(uuid, nextTitle);
    openDraftRoute(uuid);
    return;
  }

  if (editorState.currentUuid) {
    setEditorState({ title: nextTitle });
    upsertDraftItem(editorState.currentUuid, nextTitle);
    return;
  }

  setEditorState({ title: nextTitle });
};
