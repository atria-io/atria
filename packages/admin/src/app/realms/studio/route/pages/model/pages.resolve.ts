import { parseRoute } from "./pages.routing.js";
import * as store from "./pages.store.js";
import * as draft from "./pages.draft.js";

let isBootstrapped = false;

export const sync = (): void => {
  if (!isBootstrapped) {
    isBootstrapped = true;
    void draft.load();
  }

  const state = store.getState();
  const route = parseRoute();
  const routeUuid = route.mode === "document" ? route.uuid : null;
  const routeDraft = routeUuid ? state.drafts.find((item) => item.uuid === routeUuid) : null;

  store.setState({ creating: false });

  if (route.mode === "create") {
    store.setState({
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
    store.setState({
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
    store.setState({
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
    store.setState({
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

  store.setState({
    currentUuid: documentUuid,
    hasEditorChanges: false,
    title: "",
    slug: "",
    content: "",
  });

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
      store.setState({ creating: false });
      return;
    }

    store.setState({
      creating: true,
      hasEditorChanges: false,
      currentUuid: draft.uuid,
      title: draft.title,
      slug: draft.slug,
      content: draft.content,
    });
  });
};
