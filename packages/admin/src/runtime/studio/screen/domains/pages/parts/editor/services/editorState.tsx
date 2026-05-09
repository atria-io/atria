import { useEffect, useSyncExternalStore } from "react";
import {
  beginCreateMode,
  publishCurrentPage,
  setSlug,
  setTitle,
  syncEditorFromRoute,
  unpublishCurrentPage
} from "./models/editorStateModel.js";
import { getEditorState, subscribeEditorState } from "./state/store.js";

export type { CatalogItem, EditorState } from "./state/types.js";

export const useEditorState = () =>
  useSyncExternalStore(subscribeEditorState, getEditorState, getEditorState);

export const useEditorStateSetup = (creating: boolean): void => {
  useEffect(() => {
    const sync = (): void => {
      syncEditorFromRoute(creating);
    };

    sync();
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
    };
  }, [creating]);
};

export const setEditorTitle = (title: string): void => {
  setTitle(title);
};

export const setEditorSlug = (slug: string): void => {
  setSlug(slug);
};

export const startEditorCreateMode = (): void => {
  beginCreateMode();
};

export const publishEditorPage = (): void => {
  publishCurrentPage();
};

export const unpublishEditorPage = (): void => {
  unpublishCurrentPage();
};
