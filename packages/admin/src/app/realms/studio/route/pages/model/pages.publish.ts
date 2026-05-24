import * as routing from "./pages.routing.js";
import * as store from "./pages.store.js";
import { persist } from "./pages.draft.js";

export const publish = (): void => {
  const state = store.getState();
  const creating = routing.isCreateRoute();
  if (creating && !state.hasEditorChanges) {
    return;
  }

  persist("published");
  if (creating) {
    store.setState({ hasEditorChanges: false });
  }
};

export const unpublish = (): void => {
  persist("draft");
};

export const archive = (): void => {
  persist("archived");
};
