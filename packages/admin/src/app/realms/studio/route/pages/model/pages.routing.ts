import { parse, docPath } from "../routes/pages.routes.js";

export const parseRoute = () => parse(window.location.pathname);

export const isCreateRoute = (): boolean => parseRoute().mode === "create";

export const openDraft = (id: string): void => {
  window.history.pushState({}, "", docPath(id));
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const openRoot = (): void => {
  window.history.pushState({}, "", "/pages");
  window.dispatchEvent(new PopStateEvent("popstate"));
};
