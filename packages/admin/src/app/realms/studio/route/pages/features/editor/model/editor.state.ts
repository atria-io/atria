import * as React from "react";
import * as model from "./editor.model.js";
import { popstate } from "@/app/system/hooks/popstate.js";
import { getEditorState, subscribeEditorState } from "./editor.store.js";

export type { CatalogItem, EditorState } from "./editor.types.js";

export const useState = () =>
  React.useSyncExternalStore(
    subscribeEditorState,
    getEditorState
  );

export const useSetup = (): void => {
  const sync = React.useCallback((): void => {
    model.syncEditorFromRoute();
  }, []);

  popstate(sync);

  React.useEffect(() => {
    sync();
  }, [sync]);
};

export const setTitle = (title: string): void => {
  model.setTitle(title);
};

export const setSlug = (slug: string): void => {
  model.setSlug(slug);
};

export const setContent = (content: string): void => {
  model.setContent(content);
};

export const applySlugFromTitle = (): void => {
  model.applyPendingSlugFromTitle();
};

export const startCreate = (): void => {
  model.beginCreateMode();
};

export const publish = (): void => {
  model.publishCurrentPage();
};

export const unpublish = (): void => {
  model.unpublishCurrentPage();
};

export const archive = (): void => {
  model.archiveCurrentPage();
};

export const deleteById = (uuid: string): Promise<boolean> => {
  return model.deletePageById(uuid);
};
