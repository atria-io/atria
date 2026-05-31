import * as routing from "./pages.routing.js";
import * as store from "./pages.store.js";
import { persist } from "./pages.draft.js";

export const publish = (): void => {
  const s = store.getState();
  const isCreate = routing.isCreateRoute();
  if (isCreate && !s.hasEditorChanges) {
    return;
  }

  persist("published");
  if (isCreate) {
    store.setState({ hasEditorChanges: false });
  }
};

export const unpublish = (): void => {
  persist("draft");
};

export const archive = (): void => {
  persist("archived");
};
