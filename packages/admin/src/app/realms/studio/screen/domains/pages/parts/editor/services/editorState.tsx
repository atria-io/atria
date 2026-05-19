import { useEffect, useSyncExternalStore } from "react";
import * as editorStateModel from "./models/editorStateModel.js";
import { getEditorState, subscribeEditorState } from "./state/store.js";

export type { CatalogItem, EditorState } from "./state/types.js";

export const useEditorState = () =>
  useSyncExternalStore(subscribeEditorState, getEditorState, getEditorState);

export const useEditorStateSetup = (): void => {
  useEffect(() => {
    const sync = (): void => {
      editorStateModel.syncEditorFromRoute();
    };

    sync();
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
    };
  }, []);
};

export const setEditorTitle = (title: string): void => {
  editorStateModel.setTitle(title);
};

export const lockEditorAutoSlug = (): void => {
  editorStateModel.lockAutoSlug();
};

export const setEditorSlug = (slug: string): void => {
  editorStateModel.setSlug(slug);
};

export const startEditorCreateMode = (): void => {
  editorStateModel.beginCreateMode();
};

export const publishEditorPage = (): void => {
  editorStateModel.publishCurrentPage();
};

export const unpublishEditorPage = (): void => {
  editorStateModel.unpublishCurrentPage();
};

export const archiveEditorPage = (): void => {
  editorStateModel.archiveCurrentPage();
};

export const deleteEditorPageById = (uuid: string): Promise<boolean> => {
  return editorStateModel.deletePageById(uuid);
};
