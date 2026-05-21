import * as routing from "./editor.routing.js";
import * as store from "./editor.store.js";
import { persistDraft } from "./editor.draft.js";

export const publishCurrentPage = (): void => {
  const state = store.getEditorState();
  const isCreateRoute = routing.isCreatePagesRoute();
  if (isCreateRoute && !state.hasEditorChanges) {
    return;
  }

  persistDraft("published");
  if (isCreateRoute) {
    store.setEditorState({ hasEditorChanges: false });
  }
};

export const unpublishCurrentPage = (): void => {
  persistDraft("draft");
};

export const archiveCurrentPage = (): void => {
  persistDraft("archived");
};
