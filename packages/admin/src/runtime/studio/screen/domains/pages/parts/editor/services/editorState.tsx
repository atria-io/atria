import { useEffect, useSyncExternalStore } from "react";
import {
  archiveCurrentPage,
  beginCreateMode,
  deletePageById,
  lockAutoSlug,
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

export const lockEditorAutoSlug = (): void => {
  lockAutoSlug();
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

export const archiveEditorPage = (): void => {
  archiveCurrentPage();
};

export const deleteEditorPageById = (uuid: string): Promise<boolean> => {
  return deletePageById(uuid);
};
