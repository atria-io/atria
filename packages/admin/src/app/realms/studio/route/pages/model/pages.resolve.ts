import { parseRoute } from "./pages.routing.js";
import * as store from "./pages.store.js";
import * as draft from "./pages.draft.js";

let bootstrapped = false;

export const sync = (): void => {
  if (!bootstrapped) {
    bootstrapped = true;
    void draft.load();
  }

  const state = store.getState();
  const route = parseRoute();
  const docId = route.mode === "document" ? route.uuid : null;
  const changedDocument = Boolean(
    state.currentUuid
    && route.mode === "document"
    && state.currentUuid !== docId,
  );

  if (changedDocument) {
    void draft.load();
  }

  if (
    state.currentUuid
    && state.canonicalStatus
    && (
      route.mode !== "document"
      || state.currentUuid !== docId
    )
  ) {
    const previousStatus = state.canonicalStatus;
    store.setState({
      drafts: state.drafts.map((item) =>
        item.uuid === state.currentUuid
          ? { ...item, status: previousStatus }
          : item
      ),
    });
  }

  if (route.mode === "create") {
    store.setState({
      creating: true,
      switching: false,
      editorMode: false,
      versionId: null,
      canonicalStatus: null,
      hasEditorChanges: state.hasEditorChanges,
      currentUuid: state.currentUuid,
      title: state.title,
      slug: state.slug,
      content: state.content,
    });
    return;
  }

  if (route.mode !== "document") {
    void draft.load();
    store.setState({
      creating: false,
      switching: false,
      editorMode: false,
      versionId: null,
      canonicalStatus: null,
      hasEditorChanges: false,
      currentUuid: null,
      title: "",
      slug: "",
      content: "",
    });
    return;
  }

  if (!docId) {
    store.setState({
      creating: false,
      switching: false,
      editorMode: false,
      versionId: null,
      canonicalStatus: null,
      hasEditorChanges: false,
      currentUuid: null,
      title: "",
      slug: "",
      content: "",
    });
    return;
  }

  const documentUuid = docId;

  if (state.currentUuid !== documentUuid) {
    store.setState({
      currentUuid: documentUuid,
      switching: true,
      hasEditorChanges: false,
    });
  }

  void draft.loadById(documentUuid).then((found) => {
    if (parseRoute().mode !== "document") {
      return;
    }

    const latest = store.getState();
    if (latest.currentUuid !== documentUuid) {
      return;
    }

    if (!found) {
      store.setState({
        creating: false,
        switching: false,
        editorMode: false,
        versionId: null,
        canonicalStatus: null,
        hasEditorChanges: false,
        currentUuid: null,
        title: "",
        slug: "",
        content: "",
      });
      return;
    }

    const doc = latest.drafts.find((item) => item.uuid === documentUuid);
    if (!doc) {
      store.setState({ creating: false, switching: false });
      return;
    }

    store.setState({
      creating: true,
      switching: false,
      editorMode: latest.editorMode,
      versionId: latest.versionId,
      canonicalStatus: latest.canonicalStatus,
      hasEditorChanges: false,
      currentUuid: doc.uuid,
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
    });
  });
};
