import { parsePagesRoute, resolveDocumentPath } from "./editor.routes.js";

export const parseCurrentPagesRoute = () => parsePagesRoute(window.location.pathname);

export const isCreatePagesRoute = (): boolean => parseCurrentPagesRoute().mode === "create";

export const openDraftRoute = (uuid: string): void => {
  window.history.pushState({}, "", resolveDocumentPath(uuid));
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const openPagesRootRoute = (): void => {
  window.history.pushState({}, "", "/pages");
  window.dispatchEvent(new PopStateEvent("popstate"));
};
