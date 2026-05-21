import * as React from "react";
import { popstate } from "@/app/system/hooks/popstate.js";
import * as model from "./editor.model.js";
import { getEditorState, subscribeEditorState } from "./editor.store.js";

export type { CatalogItem, EditorState } from "./editor.types.js";

export const useEditorState = () =>
  React.useSyncExternalStore(subscribeEditorState, getEditorState, getEditorState);

export const useEditorStateSetup = (): void => {
  const sync = React.useCallback((): void => {
    model.syncEditorFromRoute();
  }, []);

  popstate(sync);

  React.useEffect(() => {
    sync();
  }, [sync]);
};

export const setEditorTitle = (title: string): void => {
  model.setTitle(title);
};

export const setEditorSlug = (slug: string): void => {
  model.setSlug(slug);
};

export const setEditorContent = (content: string): void => {
  model.setContent(content);
};

export const applyPendingEditorSlugFromTitle = (): void => {
  model.applyPendingSlugFromTitle();
};

export const touchEditorCreateInteraction = (): void => {
  model.touchCreateInteraction();
};

export const startEditorCreateMode = (): void => {
  model.beginCreateMode();
};

export const publishEditorPage = (): void => {
  model.publishCurrentPage();
};

export const unpublishEditorPage = (): void => {
  model.unpublishCurrentPage();
};

export const archiveEditorPage = (): void => {
  model.archiveCurrentPage();
};

export const deleteEditorPageById = (uuid: string): Promise<boolean> => {
  return model.deletePageById(uuid);
};
