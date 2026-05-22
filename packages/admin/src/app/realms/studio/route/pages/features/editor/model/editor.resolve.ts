import { parseCurrentPagesRoute } from "./editor.routing.js";
import * as store from "./editor.store.js";
import * as draft from "./editor.draft.js";

let isBootstrapped = false;

export const syncEditorFromRoute = (): void => {
  if (!isBootstrapped) {
    isBootstrapped = true;
    void draft.loadDrafts();
  }

  const state = store.getEditorState();
  const route = parseCurrentPagesRoute();
  const routeUuid = route.mode === "document" ? route.uuid : null;
  const routeDraft = routeUuid ? state.drafts.find((item) => item.uuid === routeUuid) : null;

  store.setEditorState({ creating: false });

  if (route.mode === "create") {
    store.setEditorState({
      creating: true,
      hasEditorChanges: state.hasEditorChanges,
      currentUuid: state.currentUuid,
      title: state.title,
      slug: state.slug,
      content: state.content,
    });
    return;
  }

  if (route.mode !== "document") {
    store.setEditorState({
      creating: false,
      hasEditorChanges: false,
      currentUuid: null,
      title: "",
      slug: "",
      content: "",
    });
    return;
  }

  if (routeDraft) {
    store.setEditorState({
      creating: true,
      hasEditorChanges: false,
      currentUuid: routeDraft.uuid,
      title: routeDraft.title,
      slug: routeDraft.slug,
      content: routeDraft.content,
    });
    return;
  }

  if (!routeUuid) {
    store.setEditorState({
      creating: false,
      hasEditorChanges: false,
      currentUuid: null,
      title: "",
      slug: "",
      content: "",
    });
    return;
  }

  const documentUuid = routeUuid;

  store.setEditorState({
    currentUuid: documentUuid,
    hasEditorChanges: false,
    title: "",
    slug: "",
    content: "",
  });

  void draft.loadDraftById(documentUuid).then((found) => {
    if (parseCurrentPagesRoute().mode !== "document") {
      return;
    }

    const latest = store.getEditorState();
    if (latest.currentUuid !== documentUuid) {
      return;
    }

    if (!found) {
      store.setEditorState({
        creating: false,
        hasEditorChanges: false,
        currentUuid: null,
        title: "",
        slug: "",
        content: "",
      });
      return;
    }

    const draft = latest.drafts.find((item) => item.uuid === documentUuid);
    if (!draft) {
      store.setEditorState({ creating: false });
      return;
    }

    store.setEditorState({
      creating: true,
      hasEditorChanges: false,
      currentUuid: draft.uuid,
      title: draft.title,
      slug: draft.slug,
      content: draft.content,
    });
  });
};
