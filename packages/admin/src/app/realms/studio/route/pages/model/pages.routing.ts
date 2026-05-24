import { parse, docPath } from "./pages.routes.js";

export const parseRoute = () => parse(window.location.pathname);

export const isCreateRoute = (): boolean => parseRoute().mode === "create";

export const openDraft = (uuid: string): void => {
  window.history.pushState({}, "", docPath(uuid));
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const openRoot = (): void => {
  window.history.pushState({}, "", "/pages");
  window.dispatchEvent(new PopStateEvent("popstate"));
};
